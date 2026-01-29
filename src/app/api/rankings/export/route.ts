import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Export rankings as CSV (just player IDs, no header)
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get all rankings ordered by tier then rank, excluding drafted players
    const rankings = await prisma.userRanking.findMany({
      where: { 
        userId,
        player: {
          isDrafted: false,
        },
      },
      include: {
        player: {
          select: {
            playerId: true, // This is the OOTP ID
            isDrafted: true,
          },
        },
      },
      orderBy: [
        { tier: 'asc' },
        { rankInTier: 'asc' },
      ],
    });

    // Create CSV content - just player IDs, one per line, no header
    const csvContent = rankings
      .map(r => r.player.playerId)
      .join('\n');

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="statsplus-rankings.csv"',
      },
    });
  } catch (error) {
    console.error('Failed to export rankings:', error);
    return NextResponse.json(
      { error: 'Failed to export rankings' },
      { status: 500 }
    );
  }
}
