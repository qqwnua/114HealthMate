// /app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const { email, password } = await req.json();

    // 1. 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. 開啟交易
    await client.query('BEGIN');

    // 3. 建立 users
    const result = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    const userId = result.rows[0].id;

    // 4. 建立空的個人資訊
    await client.query(
      `INSERT INTO personal_info 
       (user_id, name, gender, birthdate, address, avatar_url)
       VALUES ($1, '', '', NULL, '', '/placeholder.svg')`,
      [userId]
    );

    // 5. 建立空的健康資訊
    await client.query(
      `INSERT INTO health_info 
       (user_id, height, weight, blood_type, allergies, medications, medical_history, chronic_diseases, family_history)
       VALUES ($1, NULL, NULL, '', '', '', '', '', '')`,
      [userId]
    );

    // 6. 提交交易
    await client.query('COMMIT');

    return NextResponse.json({ userId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return NextResponse.json({ error: '註冊失敗' }, { status: 500 });
  } finally {
    client.release();
  }
}
