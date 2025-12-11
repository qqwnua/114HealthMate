// app/api/emotion-records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST - 新增情緒記錄
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userid,
      emotion_state,
      intensity,
      mood_score,
      risk_score,
      bert_analysis,
      trigger_message
    } = body;

    if (!userid || !emotion_state) {
      return NextResponse.json({ 
        error: '缺少必填欄位 (userid, emotion_state)' 
      }, { status: 400 });
    }

    const sql = `
      INSERT INTO emotion_records 
      (user_id, emotion_state, intensity, mood_score, risk_score, 
       bert_analysis, trigger_message, recorded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const params = [
      userid,
      emotion_state,
      intensity || null,
      mood_score || null,
      risk_score || null,
      bert_analysis ? JSON.stringify(bert_analysis) : null,
      trigger_message || null
    ];

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      record: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST emotion-records error:', error);
    return NextResponse.json({ 
      error: '新增情緒記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - 取得用戶的情緒記錄
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');
    const days = searchParams.get('days');
    const limit = searchParams.get('limit') || '50';

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    let sql = `
      SELECT 
        record_id, user_id, emotion_state, intensity, mood_score,
        risk_score, bert_analysis, trigger_message, recorded_at
      FROM emotion_records 
      WHERE user_id = $1
    `;

    const params: any[] = [userid];

    if (days) {
      sql += ` AND recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'`;
    }

    sql += ` ORDER BY recorded_at DESC LIMIT $2`;
    params.push(parseInt(limit));

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      records: result.rows
    });

  } catch (error: any) {
    console.error('❌ GET emotion-records error:', error);
    return NextResponse.json({ 
      error: '取得情緒記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - 刪除情緒記錄
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const record_id = searchParams.get('id');
    const userid = searchParams.get('userid');

    if (!record_id || !userid) {
      return NextResponse.json({ 
        error: '缺少 id 或 userid' 
      }, { status: 400 });
    }

    const sql = `
      DELETE FROM emotion_records 
      WHERE record_id = $1 AND user_id = $2
      RETURNING record_id
    `;

    const result = await pool.query(sql, [record_id, userid]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: '找不到該記錄或無權刪除' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '情緒記錄已刪除'
    });

  } catch (error: any) {
    console.error('❌ DELETE emotion-records error:', error);
    return NextResponse.json({ 
      error: '刪除情緒記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}