import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch tier names
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    return NextResponse.json({
      tiers: {
        1: settings.tier1Name,
        2: settings.tier2Name,
        3: settings.tier3Name,
        4: settings.tier4Name,
        5: settings.tier5Name,
      },
    });
  } catch (error) {
    console.error('Failed to fetch tier settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tier settings' },
      { status: 500 }
    );
  }
}

// PUT - Update tier names
export async function PUT(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { tiers } = await request.json();

    if (!tiers) {
      return NextResponse.json(
        { error: 'Missing tiers data' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        tier1Name: tiers[1] || 'Must Have',
        tier2Name: tiers[2] || 'Priority',
        tier3Name: tiers[3] || 'Target',
        tier4Name: tiers[4] || 'Value',
        tier5Name: tiers[5] || 'Flier',
      },
      create: {
        userId,
        tier1Name: tiers[1] || 'Must Have',
        tier2Name: tiers[2] || 'Priority',
        tier3Name: tiers[3] || 'Target',
        tier4Name: tiers[4] || 'Value',
        tier5Name: tiers[5] || 'Flier',
      },
    });

    return NextResponse.json({
      success: true,
      tiers: {
        1: settings.tier1Name,
        2: settings.tier2Name,
        3: settings.tier3Name,
        4: settings.tier4Name,
        5: settings.tier5Name,
      },
    });
  } catch (error) {
    console.error('Failed to update tier settings:', error);
    return NextResponse.json(
      { error: 'Failed to update tier settings' },
      { status: 500 }
    );
  }
}
