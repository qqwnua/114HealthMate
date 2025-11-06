import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  // 1️⃣ 查找使用者
  const result = await pool.query(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: '帳號不存在' }, { status: 404 });
  }

  const user = result.rows[0];

  // 2️⃣ 驗證密碼
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return NextResponse.json({ error: '密碼錯誤' }, { status: 401 });
  }

  // 3️⃣ 成功 → 回傳 userId 或 JWT
  return NextResponse.json({ userId: user.id });
}
