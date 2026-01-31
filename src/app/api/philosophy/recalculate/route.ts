import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeAllPlayers } from '@/lib/playerAnalysis';
import { Player, DraftPhilosophy } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Check if client wants streaming response
  const acceptHeader = request.headers.get('accept') || '';
  const wantsStream = acceptHeader.includes('text/event-stream');

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = (await import('@/lib/prisma')).default;
    
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

    const philosophy = JSON.parse(JSON.stringify(activePhilosophy.settings)) as DraftPhilosophy;

    const players = await prisma.player.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const appPlayers = players.map((p) => ({
      ...p,
      battingRatings: p.battingRatings ? JSON.parse(JSON.stringify(p.battingRatings)) : null,
      pitchingRatings: p.pitchingRatings ? JSON.parse(JSON.stringify(p.pitchingRatings)) : null,
      defenseRatings: p.defenseRatings ? JSON.parse(JSON.stringify(p.defenseRatings)) : null,
      speedRatings: p.speedRatings ? JSON.parse(JSON.stringify(p.speedRatings)) : null,
      pitchArsenal: p.pitchArsenal ? JSON.parse(JSON.stringify(p.pitchArsenal)) : null,
    })) as any as Omit<Player, 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers'>[];

    const analyzed = analyzeAllPlayers(appPlayers, philosophy);
    const totalPlayers = analyzed.length;

    // If streaming, return SSE response
    if (wantsStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const BATCH_SIZE = 50;
          let updatedCount = 0;
          
          try {
            for (let i = 0; i < analyzed.length; i += BATCH_SIZE) {
              const batch = analyzed.slice(i, i + BATCH_SIZE);
              
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
              
              // Send progress update
              const progressData = JSON.stringify({
                type: 'progress',
                current: updatedCount,
                total: totalPlayers,
              });
              controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
            }
            
            // Send completion
            const completeData = JSON.stringify({
              type: 'complete',
              playersUpdated: updatedCount,
              philosophyName: activePhilosophy.name,
            });
            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            controller.close();
          } catch (error) {
            const errorData = JSON.stringify({
              type: 'error',
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response (fallback)
    const BATCH_SIZE = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < analyzed.length; i += BATCH_SIZE) {
      const batch = analyzed.slice(i, i + BATCH_SIZE);
      
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
    });
  } catch (error) {
    console.error('Error recalculating players:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to recalculate players',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
