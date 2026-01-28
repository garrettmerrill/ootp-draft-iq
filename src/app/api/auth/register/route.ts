import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { DEFAULT_PHILOSOPHY } from '@/types';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Lazy import prisma only at runtime
    const prisma = (await import('@/lib/prisma')).default;
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with default philosophy
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        philosophies: {
          create: {
            name: 'Default',
            description: 'Your default draft philosophy',
            settings: DEFAULT_PHILOSOPHY as any,
            isActive: true,
            isPreset: false,
          },
        },
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        user: { id: user.id, username: user.username } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
