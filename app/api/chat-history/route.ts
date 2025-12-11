// app/api/chat-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - 取得對話歷史
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');
    const session_id = searchParams.get('session_id');
    const limit = searchParams.get('limit') || '50';

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    let sql = `
      SELECT 
        message_id, user_id, session_id, role, content,
        emotion_detected, risk_score, bert_analysis, created_at
      FROM psych_messages 
      WHERE user_id = $1
    `;
    const params: any[] = [userid];

    if (session_id) {
      sql += ` AND session_id = $2`;
      params.push(session_id);
      sql += ` ORDER BY created_at ASC LIMIT $3`;
      params.push(parseInt(limit));
    } else {
      sql += ` ORDER BY created_at DESC LIMIT $2`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      messages: session_id ? result.rows : result.rows.reverse()
    });

  } catch (error: any) {
    console.error('❌ GET chat-history error:', error);
    return NextResponse.json({ 
      error: '取得對話記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - 儲存對話訊息
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userid, 
      session_id, 
      role, 
      content, 
      emotion_detected, 
      risk_score,
      bert_analysis 
    } = body;

    if (!userid || !session_id || !role || !content) {
      return NextResponse.json({ 
        error: '缺少必填欄位 (userid, session_id, role, content)' 
      }, { status: 400 });
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json({ 
        error: 'role 必須是 user, assistant 或 system' 
      }, { status: 400 });
    }

    const sql = `
      INSERT INTO psych_messages 
      (user_id, session_id, role, content, emotion_detected, risk_score, bert_analysis)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      userid,
      session_id,
      role,
      content,
      emotion_detected || null,
      risk_score || null,
      bert_analysis ? JSON.stringify(bert_analysis) : null
    ];

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      message: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST chat-history error:', error);
    return NextResponse.json({ 
      error: '儲存對話失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - 刪除對話記錄
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');
    const session_id = searchParams.get('session_id');
    const message_id = searchParams.get('message_id');

    if (!userid) {
      return NextResponse.json({ 
        error: '缺少 userid' 
      }, { status: 400 });
    }

    let sql: string;
    let params: any[];

    if (message_id) {
      // 刪除單一訊息
      // 🔧 修正 3：WHERE 條件將 userid 改為 user_id
      sql = `
        DELETE FROM psych_messages 
        WHERE message_id = $1 AND user_id = $2
        RETURNING message_id
      `;
      params = [message_id, userid];
    } else if (session_id) {
      // 刪除整個 session
      // 🔧 修正 4：WHERE 條件將 userid 改為 user_id
      sql = `
        DELETE FROM psych_messages 
        WHERE session_id = $1 AND user_id = $2
        RETURNING message_id
      `;
      params = [session_id, userid];
    } else {
      return NextResponse.json({ 
        error: '需要提供 session_id 或 message_id' 
      }, { status: 400 });
    }

    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: '找不到該對話記錄或無權限刪除' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '對話記錄已刪除',
      deletedCount: result.rows.length
    });

  } catch (error: any) {
    console.error('❌ DELETE chat-history error:', error);
    return NextResponse.json({ 
      error: '刪除對話記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}