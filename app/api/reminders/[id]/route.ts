import { NextResponse } from 'next/server';
import { pool } from "@/lib/db"; // 使用您現有的 DB 連線

interface Params {
  params: { id: string };
}

// --- PUT /api/reminders/[id] ---
// 完整更新一個提醒 (用於編輯 Dialog)
export async function PUT(req: Request, { params }: Params) {
  const { id } = params;
  const client = await pool.connect();
  
  try {
    // 這些是從前端 editingReminder state 傳來的欄位
    const {
      userId, // [重要] 用於驗證
      title,
      description,
      due_date,
      due_time,
      notification_enabled,
      repeat,
      advance,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 401 });
    }

    await client.query('BEGIN');

    const query = `
      UPDATE "public"."reminders" SET
        title = $1,
        description = $2,
        due_date = $3,
        due_time = $4,
        notification_enabled = $5,
        "repeat" = $6,
        advance = $7
      WHERE
        id = $8 AND user_id = $9
      RETURNING *;
    `;
    const values = [
      title,
      description,
      due_date,
      due_time,
      notification_enabled,
      repeat,
      advance,
      id,
      userId, // 確保使用者只能更新自己的提醒
    ];

    const result = await client.query(query, values);

    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: '提醒不存在或權限不足' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json(result.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[API /reminders/${id} PUT] Error:`, error);
    let errorMessage = '更新提醒時發生未知錯誤';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: '更新提醒失敗', details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}


// --- PATCH /api/reminders/[id] ---
// 部分更新 (用於標記完成)
export async function PATCH(req: Request, { params }: Params) {
  const { id } = params;
  const client = await pool.connect();
  
  try {
    const { userId, completed } = await req.json();

    if (!userId || typeof completed !== 'boolean') {
      return NextResponse.json({ error: '缺少 userId 或 completed 狀態' }, { status: 400 });
    }

    await client.query('BEGIN');
    
    const query = `
      UPDATE "public"."reminders" SET
        completed = $1
      WHERE
        id = $2 AND user_id = $3
      RETURNING *;
    `;
    const result = await client.query(query, [completed, id, userId]);

    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: '提醒不存在或權限不足' }, { status: 404 });
    }
    
    await client.query('COMMIT');
    return NextResponse.json(result.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[API /reminders/${id} PATCH] Error:`, error);
    let errorMessage = '更新提醒時發生未知錯誤';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: '更新提醒失敗', details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

// --- DELETE /api/reminders/[id] ---
// 刪除一個提醒
export async function DELETE(req: Request, { params }: Params) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId"); // 從 URL 參數獲取 userId

  const client = await pool.connect();

  try {
    if (!userId) {
      return NextResponse.json({ error: '缺少 userId' }, { status: 401 });
    }

    await client.query('BEGIN');
    
    const query = `
      DELETE FROM "public"."reminders"
      WHERE id = $1 AND user_id = $2;
    `;
    const result = await client.query(query, [id, userId]);

    if ((result.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: '提醒不存在或權限不足' }, { status: 404 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: '提醒已刪除' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[API /reminders/${id} DELETE] Error:`, error);
    let errorMessage = '刪除提醒時發生未知錯誤';
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ error: '刪除提醒失敗', details: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}