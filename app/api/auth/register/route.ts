import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { users } from '@/lib/db/schema';
import { setAuthCookie } from '@/lib/auth';
import { ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(ilike(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = `user-${Date.now()}`;
    const createdAt = new Date();

    await db.insert(users).values({
      id,
      name,
      email,
      passwordHash,
      createdAt,
    });

    await setAuthCookie({ userId: id, email });

    return NextResponse.json({
      success: true,
      user: {
        id,
        name,
        email,
        createdAt: createdAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
