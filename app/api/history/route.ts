// app/api/history/route.ts
import { NextResponse } from 'next/server';
import { pool } from "@/lib/db"; // 確保這是您正確的資料庫連線路徑

// 🟢 GET: 取得歷史紀錄 (這部分保持不變)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const query = `
      SELECT id, user_message, model_response, keywords, created_at, risk_level 
      FROM consultations 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);

    const history = result.rows.map(row => ({
      id: row.id.toString(),
      date: row.created_at,
      messages: [
        { role: "user", content: row.user_message, timestamp: row.created_at },
        { role: "assistant", content: row.model_response, timestamp: row.created_at }
      ],
      keywords: row.keywords || [], 
      riskLevel: row.risk_level
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

// 🔴 DELETE: 刪除指定的諮詢紀錄 (新增這段)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  try {
    // 執行 SQL 刪除指令
    const query = `DELETE FROM consultations WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Delete API Error:", error);
    return NextResponse.json({ error: "Database delete failed" }, { status: 500 });
  }
}