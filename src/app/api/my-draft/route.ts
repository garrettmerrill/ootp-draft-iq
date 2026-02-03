import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to parse demand amount string to number
function parseDemandAmount(demand: string | null): number {
  if (!demand || demand === 'Slot') return 0;
  
  // Handle formats like "$2.5M", "$750K", "2500000", "$2,500,000"
  const cleanDemand = demand.replace(/,/g, '');
  const match = cleanDemand.match(/\$?([\d.]+)\s*(m|k)?/i);
  if (!match) return 0;
  
  let amount = parseFloat(match[1]);
  const suffix = match[2]?.toLowerCase();
  
  if (suffix === 'm') amount *= 1000000;
  else if (suffix === 'k') amount *= 1000;
  
  return amount;
}

export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id: string }).id;
    
    // Get user's team setting
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { myTeamName: true },
    });
    
    if (!settings?.myTeamName) {
      return NextResponse.json({ 
        picks: [],
        summary: { totalPicks: 0, totalCommitted: 0, slotDemandCount: 0, unknownDemandCount: 0 },
        teamName: null,
        message: 'No team selected'
      });
    }
    
    // Get all draft picks for this user's team
    const draftPicks = await prisma.draftPick.findMany({
      where: {
        userId,
        teamName: settings.myTeamName,
      },
      orderBy: [
        { round: 'asc' },
        { pick: 'asc' },
      ],
    });
    
    // Get all players to match for signing data
    const players = await prisma.player.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        position: true,
        demandAmount: true,
        signability: true,
      },
    });
    
    // Create player lookup by name (lowercase, trimmed)
    const playerLookup = new Map(
      players.map(p => [p.name.toLowerCase().trim(), p])
    );
    
    // Enhance picks with player signing data
    const enhancedPicks = draftPicks.map(pick => {
      const player = playerLookup.get(pick.playerName.toLowerCase().trim());
      const demandAmount = player?.demandAmount || null;
      
      return {
        round: pick.round,
        pick: pick.pick,
        overallPick: pick.overallPick,
        playerName: pick.playerName,
        playerId: player?.id || null,
        position: player?.position || null,
        demandAmount,
        signability: player?.signability || null,
        isSlotDemand: !demandAmount || demandAmount === 'Slot',
      };
    });
    
    // Calculate summary
    let totalCommitted = 0;
    let slotDemandCount = 0;
    let unknownDemandCount = 0;
    
    for (const pick of enhancedPicks) {
      if (pick.isSlotDemand) {
        if (pick.demandAmount === 'Slot') {
          slotDemandCount++;
        } else {
          unknownDemandCount++;
        }
      } else {
        // Parse demand amount
        const amount = parseDemandAmount(pick.demandAmount);
        totalCommitted += amount;
      }
    }
    
    return NextResponse.json({
      picks: enhancedPicks,
      summary: {
        totalPicks: enhancedPicks.length,
        totalCommitted,
        slotDemandCount,
        unknownDemandCount,
      },
      teamName: settings.myTeamName,
    });
  } catch (error) {
    console.error('Error fetching my draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft picks' },
      { status: 500 }
    );
  }
}
