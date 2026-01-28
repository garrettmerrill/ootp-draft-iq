import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Lazy import prisma only at runtime
    const prisma = (await import('@/lib/prisma')).default;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    
    const body = await request.json();
    const { statsPlusUrl } = body;
    
    if (!statsPlusUrl) {
      return NextResponse.json(
        { error: 'Stats Plus URL is required' },
        { status: 400 }
      );
    }

    // Fetch draft results from Stats Plus API
    const response = await fetch(statsPlusUrl);
    
    if (!response.ok) {
      throw new Error(`Stats Plus API returned ${response.status}`);
    }

    const draftData = await response.json();
    
    // Stats Plus API returns array of draft picks
    // Format: [{ round, pick, overall, team, player, playerId? }, ...]
    if (!Array.isArray(draftData)) {
      throw new Error('Invalid response from Stats Plus API');
    }

    // Get all players for this user
    const players = await prisma.player.findMany({
      where: { userId },
    });

    let updatedCount = 0;
    const updates: Promise<any>[] = [];

    // Match draft picks to players
    for (const pick of draftData) {
      // Try to find player by name (case-insensitive)
      const player = players.find(p => 
        p.name.toLowerCase() === pick.player.toLowerCase()
      );

      if (player) {
        // Update player with draft information
        updates.push(
          prisma.player.update({
            where: { id: player.id },
            data: {
              isDrafted: true,
              draftRound: pick.round,
              draftPick: pick.pick,
              draftTeam: pick.team,
            },
          })
        );
        updatedCount++;
      }
    }

    // Execute all updates
    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      total: draftData.length,
      message: `Updated ${updatedCount} of ${draftData.length} drafted players`,
    });

  } catch (error) {
    console.error('Sync draft error:', error);
    return NextResponse.json(
      { error: 'Failed to sync draft results' },
      { status: 500 }
    );
  }
}
