import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseCSV, convertCSVToPlayer } from '@/lib/csvParser';
import { analyzeAllPlayers } from '@/lib/playerAnalysis';
import { DEFAULT_PHILOSOPHY, DraftPhilosophy, PITCHER_POSITIONS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const rawPlayers = await parseCSV(file);

    if (rawPlayers.length === 0) {
      return NextResponse.json({ error: 'No players found in CSV' }, { status: 400 });
    }

    const userPhilosophy = await prisma.draftPhilosophy.findUnique({
      where: { userId },
    });

    let philosophy: DraftPhilosophy = DEFAULT_PHILOSOPHY;
    if (userPhilosophy?.settings) {
      philosophy = userPhilosophy.settings as unknown as DraftPhilosophy;
    }

    const convertedPlayers = rawPlayers.map(raw => {
      const player = convertCSVToPlayer(raw);
      return {
        ...player,
        id: `temp-${player.odraftId}`,
      };
    });

    const analyzedPlayers = analyzeAllPlayers(convertedPlayers as Parameters<typeof analyzeAllPlayers>[0], philosophy);

    await prisma.player.deleteMany({
      where: { userId },
    });

    await prisma.player.createMany({
      data: analyzedPlayers.map(player => ({
        userId,
        playerId: player.odraftId,
        position: player.position,
        name: player.name,
        nickname: player.nickname,
        age: player.age,
        height: player.height,
        weight: player.weight,
        bats: player.bats,
        throws: player.throws,
        overall: player.overall,
        potential: player.potential,
        leadership: player.leadership,
        loyalty: player.loyalty,
        adaptability: player.adaptability,
        financialAmbition: player.financialAmbition,
        workEthic: player.workEthic,
        intelligence: player.intelligence,
        injuryProne: player.injuryProne,
        school: player.school,
        committedSchool: player.committedSchool,
        competitionLevel: player.competitionLevel,
        highSchoolClass: player.highSchoolClass,
        battingRatings: player.battingRatings as object | null,
        pitchingRatings: player.pitchingRatings as object | null,
        defenseRatings: player.defenseRatings as object | null,
        speedRatings: player.speedRatings as object | null,
        pitchArsenal: player.pitchArsenal as object | null,
        demandAmount: player.demandAmount,
        signability: player.signability,
        scoutAccuracy: player.scoutAccuracy,
        risk: player.risk,
        compositeScore: player.compositeScore,
        tier: player.tier,
        isSleeper: player.isSleeper,
        sleeperScore: player.sleeperScore,
        archetypes: player.archetypes,
        redFlags: player.redFlags,
        greenFlags: player.greenFlags,
        hasSplitsIssues: player.hasSplitsIssues,
        isTwoWay: player.isTwoWay,
      })),
    });

    const batters = analyzedPlayers.filter(
      p => !(PITCHER_POSITIONS as readonly string[]).includes(p.position)
    ).length;
    const pitchers = analyzedPlayers.length - batters;

    return NextResponse.json({
      success: true,
      stats: {
        total: analyzedPlayers.length,
        batters,
        pitchers,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
