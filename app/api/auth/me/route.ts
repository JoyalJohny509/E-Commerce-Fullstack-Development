import { NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ success: false, user: null });
    }

    const db = getDb();
    await initializeDatabase();
    const result = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [session.userId]);
    const user = result.rows[0] as {
      id: string;
      name: string;
      email: string;
      created_at: string;
    } | undefined;

    if (!user) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
