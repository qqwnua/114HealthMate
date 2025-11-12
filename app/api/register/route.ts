import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1. 檢查 email 是否已存在
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rowCount && checkResult.rowCount > 0) {
      return NextResponse.json({ error: 'Email 已存在' }, { status: 400 });
    }

    // 2. hash 密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. 新增使用者
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
