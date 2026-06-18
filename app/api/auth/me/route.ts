import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentUser();

    if (!session) {
      return NextResponse.json({ success: false, user: null });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(session.userId) as {
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
