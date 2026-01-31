import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeAllPlayers } from '@/lib/playerAnalysis';
import { Player, DraftPhilosophy } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for this endpoint

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lazy import Prisma
    const prisma = (await import('@/lib/prisma')).default;
    
    // Get active philosophy
    const activePhilosophy = await prisma.draftPhilosophy.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!activePhilosophy) {
      return NextResponse.json(
        { error: 'No active philosophy found' },
        { status: 404 }
      );
    }

    // Parse philosophy settings
    const philosophy = JSON.parse(JSON.stringify(activePhilosophy.settings)) as DraftPhilosophy;

    // Get all players for this user
    const players = await prisma.player.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Convert Prisma players to app Player type
    const appPlayers = players.map((p) => ({
      ...p,
      battingRatings: p.battingRatings ? JSON.parse(JSON.stringify(p.battingRatings)) : null,
      pitchingRatings: p.pitchingRatings ? JSON.parse(JSON.stringify(p.pitchingRatings)) : null,
      defenseRatings: p.defenseRatings ? JSON.parse(JSON.stringify(p.defenseRatings)) : null,
      speedRatings: p.speedRatings ? JSON.parse(JSON.stringify(p.speedRatings)) : null,
      pitchArsenal: p.pitchArsenal ? JSON.parse(JSON.stringify(p.pitchArsenal)) : null,
    })) as any as Omit<Player, 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers'>[];

    // Recalculate scores
    const analyzed = analyzeAllPlayers(appPlayers, philosophy);

    // Find a sample player for debugging (Jim Morales or first player)
    const samplePlayer = analyzed.find(p => p.name.includes('Morales')) || analyzed[0];
    const debugInfo = {
      samplePlayerName: samplePlayer?.name,
      samplePlayerScore: samplePlayer?.compositeScore,
      samplePlayerTier: samplePlayer?.tier,
      philosophyName: activePhilosophy.name,
      philosophyPotWeight: philosophy.potentialWeight,
      philosophyOvrWeight: philosophy.overallWeight,
      philosophySkillsWeight: 100 - philosophy.potentialWeight - philosophy.overallWeight,
    };

    // Batch update players to avoid connection pool exhaustion
    // Process in batches of 50 players at a time
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < analyzed.length; i += BATCH_SIZE) {
      const batch = analyzed.slice(i, i + BATCH_SIZE);
      
      // Use a transaction for each batch to ensure atomicity
      await prisma.$transaction(
        batch.map((player) =>
          prisma.player.update({
            where: { id: player.id },
            data: {
              compositeScore: player.compositeScore,
              tier: player.tier,
              isSleeper: player.isSleeper,
              sleeperScore: player.sleeperScore,
              archetypes: player.archetypes,
              redFlags: player.redFlags,
              greenFlags: player.greenFlags,
              hasSplitsIssues: player.hasSplitsIssues,
              isTwoWay: player.isTwoWay,
            },
          })
        )
      );
      
      updatedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      playersUpdated: updatedCount,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('Error recalculating players:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: 'Failed to recalculate players',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
