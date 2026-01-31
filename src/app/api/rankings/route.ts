import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all user rankings with FULL player data
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get all rankings with player data
    const rankings = await prisma.userRanking.findMany({
      where: { userId },
      include: {
        player: true,
      },
      orderBy: [
        { tier: 'asc' },
        { rankInTier: 'asc' },
      ],
    });

    // Transform to include FULL player info (matching the players API)
    const transformedRankings = rankings.map(r => ({
      id: r.id,
      odraftId: r.player.playerId,
      odPlayerId: r.player.id,
      tier: r.tier,
      rankInTier: r.rankInTier,
      player: {
        id: r.player.id,
        odraftId: r.player.playerId,
        position: r.player.position,
        name: r.player.name,
        nickname: r.player.nickname,
        age: r.player.age,
        height: r.player.height,
        weight: r.player.weight,
        bats: r.player.bats,
        throws: r.player.throws,
        overall: r.player.overall,
        potential: r.player.potential,
        // Personality
        leadership: r.player.leadership,
        loyalty: r.player.loyalty,
        adaptability: r.player.adaptability,
        financialAmbition: r.player.financialAmbition,
        workEthic: r.player.workEthic,
        intelligence: r.player.intelligence,
        injuryProne: r.player.injuryProne,
        // Background
        school: r.player.school,
        committedSchool: r.player.committedSchool,
        competitionLevel: r.player.competitionLevel,
        highSchoolClass: r.player.highSchoolClass,
        // All ratings (stored as JSON)
        battingRatings: r.player.battingRatings,
        pitchingRatings: r.player.pitchingRatings,
        defenseRatings: r.player.defenseRatings,
        speedRatings: r.player.speedRatings,
        pitchArsenal: r.player.pitchArsenal,
        // Signing
        demandAmount: r.player.demandAmount,
        signability: r.player.signability,
        scoutAccuracy: r.player.scoutAccuracy,
        risk: r.player.risk,
        // Calculated
        compositeScore: r.player.compositeScore,
        tier: r.player.tier,
        isSleeper: r.player.isSleeper,
        sleeperScore: r.player.sleeperScore,
        archetypes: r.player.archetypes,
        redFlags: r.player.redFlags,
        greenFlags: r.player.greenFlags,
        hasSplitsIssues: r.player.hasSplitsIssues,
        isTwoWay: r.player.isTwoWay,
        isNotInterested: r.player.isNotInterested,
        // Draft status
        isDrafted: r.player.isDrafted,
        draftRound: r.player.draftRound,
        draftPick: r.player.draftPick,
        draftTeam: r.player.draftTeam,
        // Score breakdown (stored as JSON)
        scoreBreakdown: r.player.scoreBreakdown,
      },
    }));

    return NextResponse.json({ rankings: transformedRankings });
  } catch (error) {
    console.error('Failed to fetch rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}

// POST - Add a player to rankings
export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { playerId, tier } = await request.json();

    if (!playerId || !tier || tier < 1 || tier > 5) {
      return NextResponse.json(
        { error: 'Invalid playerId or tier' },
        { status: 400 }
      );
    }

    // Check if player exists and belongs to user
    const player = await prisma.player.findFirst({
      where: { id: playerId, userId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if already ranked
    const existing = await prisma.userRanking.findUnique({
      where: {
        userId_playerId: { userId, playerId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Player already in rankings' },
        { status: 400 }
      );
    }

    // Get the highest rank in the target tier to add at bottom
    const maxRank = await prisma.userRanking.aggregate({
      where: { userId, tier },
      _max: { rankInTier: true },
    });

    const newRank = (maxRank._max.rankInTier || 0) + 1;

    // Create the ranking
    const ranking = await prisma.userRanking.create({
      data: {
        userId,
        playerId,
        tier,
        rankInTier: newRank,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json({
      success: true,
      ranking: {
        id: ranking.id,
        tier: ranking.tier,
        rankInTier: ranking.rankInTier,
        playerId: ranking.playerId,
      },
    });
  } catch (error) {
    console.error('Failed to add to rankings:', error);
    return NextResponse.json(
      { error: 'Failed to add to rankings' },
      { status: 500 }
    );
  }
}
