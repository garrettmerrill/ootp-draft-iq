import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Reorder rankings (within tier or move to different tier)
export async function PUT(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { rankingId, newTier, newRankInTier } = await request.json();

    if (!rankingId || !newTier || newRankInTier === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: rankingId, newTier, newRankInTier' },
        { status: 400 }
      );
    }

    // Verify the ranking belongs to the user
    const ranking = await prisma.userRanking.findFirst({
      where: { id: rankingId, userId },
    });

    if (!ranking) {
      return NextResponse.json(
        { error: 'Ranking not found' },
        { status: 404 }
      );
    }

    const oldTier = ranking.tier;
    const oldRank = ranking.rankInTier;

    // Use a transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      if (oldTier === newTier) {
        // Moving within the same tier
        if (newRankInTier > oldRank) {
          // Moving down: shift items between old and new up
          await tx.userRanking.updateMany({
            where: {
              userId,
              tier: oldTier,
              rankInTier: { gt: oldRank, lte: newRankInTier },
            },
            data: { rankInTier: { decrement: 1 } },
          });
        } else if (newRankInTier < oldRank) {
          // Moving up: shift items between new and old down
          await tx.userRanking.updateMany({
            where: {
              userId,
              tier: oldTier,
              rankInTier: { gte: newRankInTier, lt: oldRank },
            },
            data: { rankInTier: { increment: 1 } },
          });
        }
      } else {
        // Moving to a different tier
        // 1. Remove from old tier (shift others up)
        await tx.userRanking.updateMany({
          where: {
            userId,
            tier: oldTier,
            rankInTier: { gt: oldRank },
          },
          data: { rankInTier: { decrement: 1 } },
        });

        // 2. Make room in new tier (shift others down)
        await tx.userRanking.updateMany({
          where: {
            userId,
            tier: newTier,
            rankInTier: { gte: newRankInTier },
          },
          data: { rankInTier: { increment: 1 } },
        });
      }

      // Update the moved ranking
      await tx.userRanking.update({
        where: { id: rankingId },
        data: { tier: newTier, rankInTier: newRankInTier },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder rankings:', error);
    return NextResponse.json(
      { error: 'Failed to reorder rankings' },
      { status: 500 }
    );
  }
}
