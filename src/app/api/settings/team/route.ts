import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get user's selected team
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id: string }).id;
    
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { myTeamName: true },
    });
    
    return NextResponse.json({ 
      team: settings?.myTeamName || null 
    });
  } catch (error) {
    console.error('Error fetching team setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team setting' },
      { status: 500 }
    );
  }
}

// PUT - Update user's team
export async function PUT(request: NextRequest) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id: string }).id;
    const { teamName } = await request.json();
    
    // Validate team name - allow null, empty string, or any string
    // (We allow custom strings for fantasy leagues)
    const cleanTeamName = teamName?.trim() || null;
    
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { myTeamName: cleanTeamName },
      create: {
        userId,
        myTeamName: cleanTeamName,
      },
    });
    
    return NextResponse.json({ 
      team: settings.myTeamName 
    });
  } catch (error) {
    console.error('Error updating team setting:', error);
    return NextResponse.json(
      { error: 'Failed to update team setting' },
      { status: 500 }
    );
  }
}
