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

    // Stats Plus returns CSV, not JSON
    const csvText = await response.text();
    
    // Parse CSV manually (simple parser for draft data)
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('No draft data found in Stats Plus response');
    }
    
    // First line is headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Parse each draft pick
    const draftData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const pick: any = {};
      headers.forEach((header, index) => {
        pick[header] = values[index] || '';
      });
      return pick;
    });
    
    if (draftData.length === 0) {
      throw new Error('No draft picks found in Stats Plus data');
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
