import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PHILOSOPHY_PRESETS } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lazy import Prisma
    const prisma = (await import('@/lib/prisma')).default;
    
    // Get user's custom philosophies
    const userPhilosophies = await prisma.draftPhilosophy.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Parse settings from JSON
    const parsedPhilosophies = userPhilosophies.map((p) => ({
      ...p,
      settings: JSON.parse(JSON.stringify(p.settings)),
    }));

    // Find active philosophy
    const activePhilosophy = parsedPhilosophies.find((p) => p.isActive);

    // Convert presets to array format with proper structure
    const presets = Object.entries(PHILOSOPHY_PRESETS).map(([key, preset]) => ({
      id: key,
      ...preset,
    }));

    return NextResponse.json({
      philosophies: parsedPhilosophies,
      presets,
      activePhilosophy,
    });
  } catch (error) {
    console.error('Error fetching philosophies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch philosophies' },
      { status: 500 }
    );
  }
}
