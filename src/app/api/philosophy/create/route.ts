import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DraftPhilosophy } from '@/types';

export const dynamic = 'force-dynamic';

// Validation helper
function validateWeights(weights: Record<string, number>, exclude: string[] = []): boolean {
  const total = Object.entries(weights)
    .filter(([key]) => !exclude.includes(key))
    .reduce((sum, [_, val]) => sum + val, 0);
  
  return Math.abs(total - 100) < 0.01; // Allow tiny floating point error
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const philosophy = body.philosophy as Partial<DraftPhilosophy>;

    // Validate required fields
    if (!philosophy.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate global weights
    const globalWeights = {
      potentialWeight: philosophy.potentialWeight || 0,
      overallWeight: philosophy.overallWeight || 0,
      riskWeight: philosophy.riskWeight || 0,
      signabilityWeight: philosophy.signabilityWeight || 0,
    };
    
    if (!validateWeights(globalWeights)) {
      return NextResponse.json(
        { error: 'Global weights must sum to 100' },
        { status: 400 }
      );
    }

    // Validate batter weights
    if (philosophy.batterWeights) {
      const exclude = philosophy.useBabipKs ? ['contact'] : ['babip', 'avoidK'];
      if (!validateWeights(philosophy.batterWeights, exclude)) {
        return NextResponse.json(
          { error: 'Batter weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Validate SP weights
    if (philosophy.spWeights) {
      const exclude = philosophy.useMovementSP ? ['pBabip', 'hrRate'] : ['movement'];
      if (!validateWeights(philosophy.spWeights, exclude)) {
        return NextResponse.json(
          { error: 'SP weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Validate RP weights
    if (philosophy.rpWeights) {
      const exclude = philosophy.useMovementRP ? ['pBabip', 'hrRate'] : ['movement'];
      if (!validateWeights(philosophy.rpWeights, exclude)) {
        return NextResponse.json(
          { error: 'RP weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Lazy import Prisma
    const prisma = (await import('@/lib/prisma')).default;
    
    // Create philosophy
    const newPhilosophy = await prisma.draftPhilosophy.create({
      data: {
        userId: session.user.id,
        name: philosophy.name,
        description: philosophy.description || null,
        settings: philosophy as any,
        isActive: false, // New philosophies are not active by default
        isPreset: false,
      },
    });

    return NextResponse.json({
      success: true,
      philosophy: {
        ...newPhilosophy,
        settings: JSON.parse(JSON.stringify(newPhilosophy.settings)),
      },
    });
  } catch (error) {
    console.error('Error creating philosophy:', error);
    return NextResponse.json(
      { error: 'Failed to create philosophy' },
      { status: 500 }
    );
  }
}
