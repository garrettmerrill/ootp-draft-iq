import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lazy import prisma only at runtime
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get players with their ranking info
    const players = await prisma.player.findMany({
      where: { userId },
      include: {
        rankings: {
          where: { userId },
          select: {
            id: true,
            tier: true,
            rankInTier: true,
          },
        },
      },
      orderBy: { compositeScore: 'desc' },
    });

    const transformedPlayers = players.map(p => ({
      id: p.id,
      odraftId: p.playerId,
      position: p.position,
      name: p.name,
      nickname: p.nickname,
      age: p.age,
      height: p.height,
      weight: p.weight,
      bats: p.bats,
      throws: p.throws,
      overall: p.overall,
      potential: p.potential,
      leadership: p.leadership,
      loyalty: p.loyalty,
      adaptability: p.adaptability,
      financialAmbition: p.financialAmbition,
      workEthic: p.workEthic,
      intelligence: p.intelligence,
      injuryProne: p.injuryProne,
      school: p.school,
      committedSchool: p.committedSchool,
      competitionLevel: p.competitionLevel,
      highSchoolClass: p.highSchoolClass,
      battingRatings: p.battingRatings,
      pitchingRatings: p.pitchingRatings,
      defenseRatings: p.defenseRatings,
      speedRatings: p.speedRatings,
      pitchArsenal: p.pitchArsenal,
      demandAmount: p.demandAmount,
      signability: p.signability,
      scoutAccuracy: p.scoutAccuracy,
      risk: p.risk,
      compositeScore: p.compositeScore,
      tier: p.tier,
      isSleeper: p.isSleeper,
      sleeperScore: p.sleeperScore,
      archetypes: p.archetypes,
      redFlags: p.redFlags,
      greenFlags: p.greenFlags,
      hasSplitsIssues: p.hasSplitsIssues,
      isTwoWay: p.isTwoWay,
      isNotInterested: p.isNotInterested,
      isDrafted: p.isDrafted,
      draftRound: p.draftRound,
      draftPick: p.draftPick,
      draftTeam: p.draftTeam,
      // Include ranking info if player is in user's rankings
      ranking: p.rankings.length > 0 ? p.rankings[0] : null,
    }));

    return NextResponse.json({ players: transformedPlayers });
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
