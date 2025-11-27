import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // 修正：新增 alcohol_consumption 和 exercise_frequency
    const sql = `
      SELECT 
        p.birthdate, 
        p.gender, 
        h.smoking_status, 
        h.alcohol_consumption,
        h.exercise_frequency,
        h.medical_history,
        h.medications
      FROM personal_info p
      LEFT JOIN health_info h ON p.user_id = h.user_id
      WHERE p.user_id = $1
    `;
    
    const result = await pool.query(sql, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}