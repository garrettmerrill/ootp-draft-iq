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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = (await import('@/lib/prisma')).default;
    
    const philosophy = await prisma.draftPhilosophy.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!philosophy) {
      return NextResponse.json({ error: 'Philosophy not found' }, { status: 404 });
    }

    return NextResponse.json({
      philosophy: {
        ...philosophy,
        settings: JSON.parse(JSON.stringify(philosophy.settings)),
      },
    });
  } catch (error) {
    console.error('Error fetching philosophy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch philosophy' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const philosophy = body.philosophy as Partial<DraftPhilosophy>;

    // Lazy import Prisma
    const prisma = (await import('@/lib/prisma')).default;
    
    // Verify philosophy exists and belongs to user
    const existing = await prisma.draftPhilosophy.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Philosophy not found' }, { status: 404 });
    }

    // Don't allow editing presets
    if (existing.isPreset) {
      return NextResponse.json(
        { error: 'Cannot edit preset philosophies' },
        { status: 400 }
      );
    }

    // Validate global weights if provided
    if (philosophy.potentialWeight !== undefined) {
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
    }

    // Validate batter weights if provided
    if (philosophy.batterWeights) {
      const exclude = philosophy.useBabipKs ? ['contact'] : ['babip', 'avoidK'];
      if (!validateWeights(philosophy.batterWeights, exclude)) {
        return NextResponse.json(
          { error: 'Batter weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Validate SP weights if provided
    if (philosophy.spWeights) {
      const exclude = (philosophy as DraftPhilosophy).useMovementSP ? ['pBabip', 'hrRate'] : ['movement'];
      if (!validateWeights(philosophy.spWeights, exclude)) {
        return NextResponse.json(
          { error: 'SP weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Validate RP weights if provided
    if (philosophy.rpWeights) {
      const exclude = (philosophy as DraftPhilosophy).useMovementRP ? ['pBabip', 'hrRate'] : ['movement'];
      if (!validateWeights(philosophy.rpWeights, exclude)) {
        return NextResponse.json(
          { error: 'RP weights must sum to 100' },
          { status: 400 }
        );
      }
    }

    // Update philosophy
    const updated = await prisma.draftPhilosophy.update({
      where: { id: params.id },
      data: {
        name: philosophy.name || existing.name,
        description: philosophy.description !== undefined ? philosophy.description : existing.description,
        settings: philosophy as any,
      },
    });

    return NextResponse.json({
      success: true,
      philosophy: {
        ...updated,
        settings: JSON.parse(JSON.stringify(updated.settings)),
      },
    });
  } catch (error) {
    console.error('Error updating philosophy:', error);
    return NextResponse.json(
      { error: 'Failed to update philosophy' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = (await import('@/lib/prisma')).default;
    
    // Verify philosophy exists and belongs to user
    const existing = await prisma.draftPhilosophy.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Philosophy not found' }, { status: 404 });
    }

    // Don't allow deleting presets
    if (existing.isPreset) {
      return NextResponse.json(
        { error: 'Cannot delete preset philosophies' },
        { status: 400 }
      );
    }

    // Don't allow deleting active philosophy
    if (existing.isActive) {
      return NextResponse.json(
        { error: 'Cannot delete active philosophy. Activate another philosophy first.' },
        { status: 400 }
      );
    }

    // Delete philosophy
    await prisma.draftPhilosophy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting philosophy:', error);
    return NextResponse.json(
      { error: 'Failed to delete philosophy' },
      { status: 500 }
    );
  }
}
