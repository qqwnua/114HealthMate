import { NextResponse } from 'next/server';
import { pool } from "@/lib/db"; // 使用您現有的 DB 連線

// --- GET /api/reminders?userId=... ---
// 獲取某個使用者的所有提醒
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT * FROM "public"."reminders" 
      WHERE user_id = $1 
      ORDER BY due_date, due_time ASC;
    `;
    const result = await client.query(query, [userId]);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('[API /reminders GET] Error:', error);
    let errorMessage = '讀取提醒時發生未知錯誤';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: '讀取提醒失敗', details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

// --- POST /api/reminders ---
// 新增一個提醒
export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    // 欄位名稱應與 'reminders' 表和前端傳來的 body 匹配
    const {
      userId,
      plan_id,
      title,
      description,
      due_date,
      due_time,
    } = await req.json();

    if (!userId || !title || !due_date || !due_time) {
      return NextResponse.json({ error: '缺少必要欄位 (userId, title, due_date, due_time)' }, { status: 400 });
    }

    await client.query('BEGIN');

    const query = `
      INSERT INTO "public"."reminders"
        (user_id, plan_id, title, description, due_date, due_time, completed, notification_enabled, "repeat", advance, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *;
    `;
    const values = [
      userId,
      plan_id || null,
      title,
      description || null,
      due_date,
      due_time,
      false,  // completed
      true,   // notification_enabled
      'none', // repeat
      'none'  // advance
    ];

    const result = await client.query(query, values);
    const newReminder = result.rows[0];
    
    await client.query('COMMIT');
    
    // 將新建立的完整提醒物件回傳
    return NextResponse.json(newReminder, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[API /reminders POST] Error:', error);
    let errorMessage = '新增提醒時發生未知錯誤';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: '新增提醒失敗', details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}