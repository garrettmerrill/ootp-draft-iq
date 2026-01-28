import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { philosophyId } = body;

    if (!philosophyId) {
      return NextResponse.json({ error: 'Philosophy ID is required' }, { status: 400 });
    }

    // Lazy import Prisma
    const prisma = (await import('@/lib/prisma')).default;
    
    // Verify philosophy belongs to user
    const philosophy = await prisma.draftPhilosophy.findFirst({
      where: {
        id: philosophyId,
        userId: session.user.id,
      },
    });

    if (!philosophy) {
      return NextResponse.json({ error: 'Philosophy not found' }, { status: 404 });
    }

    // Deactivate all other philosophies for this user
    await prisma.draftPhilosophy.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate the selected philosophy
    const updatedPhilosophy = await prisma.draftPhilosophy.update({
      where: {
        id: philosophyId,
      },
      data: {
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      philosophy: {
        ...updatedPhilosophy,
        settings: JSON.parse(JSON.stringify(updatedPhilosophy.settings)),
      },
    });
  } catch (error) {
    console.error('Error activating philosophy:', error);
    return NextResponse.json(
      { error: 'Failed to activate philosophy' },
      { status: 500 }
    );
  }
}
