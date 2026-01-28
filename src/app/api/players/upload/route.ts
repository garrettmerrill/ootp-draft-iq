import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parseCSV, convertCSVToPlayer, validateHeaders, getCSVHeaders } from '@/lib/csvParser';
import { analyzeAllPlayers } from '@/lib/playerAnalysis';
import { DEFAULT_PHILOSOPHY, PITCHER_POSITIONS } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    // Parse CSV
    const rawPlayers = await parseCSV(file);

    if (rawPlayers.length === 0) {
      return NextResponse.json({ error: 'No players found in CSV' }, { status: 400 });
    }

    // Get user's philosophy or use default
    const userPhilosophy = await prisma.draftPhilosophy.findUnique({
      where: { userId },
    });

    const philosophy = userPhilosophy?.settings 
      ? (userPhilosophy.settings as typeof DEFAULT_PHILOSOPHY)
      : DEFAULT_PHILOSOPHY;

    // Convert and analyze players
    const convertedPlayers = rawPlayers.map(raw => {
      const player = convertCSVToPlayer(raw);
      return {
        ...player,
        id: `temp-${player.odraftId}`, // Temporary ID for analysis
      };
    });

    const analyzedPlayers = analyzeAllPlayers(convertedPlayers as any, philosophy);

    // Delete existing players for this user
    await prisma.player.deleteMany({
      where: { userId },
    });

    // Insert new players
    const createdPlayers = await prisma.player.createMany({
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
        battingRatings: player.battingRatings as any,
        pitchingRatings: player.pitchingRatings as any,
        defenseRatings: player.defenseRatings as any,
        speedRatings: player.speedRatings as any,
        pitchArsenal: player.pitchArsenal as any,
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

    // Calculate stats
    const batters = analyzedPlayers.filter(
      p => !PITCHER_POSITIONS.includes(p.position as any)
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
