import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Toggle not interested status
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id: playerId } = params;
    const { isNotInterested } = await request.json();

    // Verify player belongs to user
    const player = await prisma.player.findFirst({
      where: { id: playerId, userId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update the player
    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { isNotInterested },
    });

    // If marking as not interested, also remove from rankings
    if (isNotInterested) {
      await prisma.userRanking.deleteMany({
        where: { userId, playerId },
      });
    }

    return NextResponse.json({
      success: true,
      isNotInterested: updated.isNotInterested,
    });
  } catch (error) {
    console.error('Failed to update not interested status:', error);
    return NextResponse.json(
      { error: 'Failed to update not interested status' },
      { status: 500 }
    );
  }
}
