import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';
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

    const db = getDb();
    await initializeDatabase();
    const existingResult = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    const existing = existingResult.rows[0];

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = `user-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.query(
      'INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, passwordHash, createdAt]
    );

    setAuthCookie({ userId: id, email });

    return NextResponse.json({
      success: true,
      user: {
        id,
        name,
        email,
        createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
