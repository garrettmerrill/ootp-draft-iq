import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE - Remove a player from rankings
export async function DELETE(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { playerId } = params;

    // Find the ranking
    const ranking = await prisma.userRanking.findUnique({
      where: {
        userId_playerId: { userId, playerId },
      },
    });

    if (!ranking) {
      return NextResponse.json(
        { error: 'Ranking not found' },
        { status: 404 }
      );
    }

    const { tier, rankInTier } = ranking;

    // Use transaction to delete and reorder
    await prisma.$transaction(async (tx) => {
      // Delete the ranking
      await tx.userRanking.delete({
        where: { id: ranking.id },
      });

      // Shift remaining items in tier up
      await tx.userRanking.updateMany({
        where: {
          userId,
          tier,
          rankInTier: { gt: rankInTier },
        },
        data: { rankInTier: { decrement: 1 } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove from rankings:', error);
    return NextResponse.json(
      { error: 'Failed to remove from rankings' },
      { status: 500 }
    );
  }
}
