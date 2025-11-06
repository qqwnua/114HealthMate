import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );

    return NextResponse.json({ userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '註冊失敗' }, { status: 500 });
  }
}
