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

    // Fetch draft results from Stats Plus API with retry logic
    let response: Response | undefined;
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        response = await fetch(statsPlusUrl);
        
        // Log rate limit headers if available
        console.log('Stats Plus API headers:', {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
          'retry-after': response.headers.get('retry-after'),
        });
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          attempt++;
          if (attempt >= maxAttempts) {
            return NextResponse.json(
              { error: 'Stats Plus API rate limit reached. Please wait a few minutes and try again.' },
              { status: 429 }
            );
          }
          
          // Exponential backoff: 2s, 4s, 8s
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt}/${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`Stats Plus API returned ${response.status}`);
        }
        
        break; // Success!
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response) {
      throw new Error('Failed to fetch from Stats Plus API after retries');
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

    // Log the first pick to see what fields we have
    console.log('First draft pick data:', draftData[0]);
    console.log('Available fields:', Object.keys(draftData[0]));

    let updatedCount = 0;
    const updates: Promise<any>[] = [];

    // Match draft picks to players
    for (const pick of draftData) {
      // Stats Plus uses 'Player Name' (with space)
      const playerName = pick['Player Name'];
      
      if (!playerName) {
        console.warn('No player name found in pick:', pick);
        continue;
      }
      
      // Try to find player by name (case-insensitive)
      const player = players.find(p => 
        p.name.toLowerCase() === playerName.toLowerCase()
      );

      if (player) {
        // Parse round and pick as integers
        const round = parseInt(pick.Round || '0');
        const pickNum = parseInt(pick['Pick In Round'] || '0');
        
        // Update player with draft information
        updates.push(
          prisma.player.update({
            where: { id: player.id },
            data: {
              isDrafted: true,
              draftRound: round,
              draftPick: pickNum,
              draftTeam: pick.Team || '',
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
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json(
        { error: 'Stats Plus API rate limit reached. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to sync draft results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
