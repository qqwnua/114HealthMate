// app/api/self-recording/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - 取得用戶的心靈便籤記錄
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const mood = searchParams.get('mood');

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    let sql = `
      SELECT 
        id, user_id, entry_date, title, content, mood, weather, 
        tags, attachments, sleep_hours, exercise_minutes, water_ml, 
        stress_level, mood_score, created_at, updated_at
      FROM self_recording 
      WHERE user_id = $1
    `;
    const params: any[] = [userid];
    let paramIndex = 2;

    if (start_date) {
      sql += ` AND entry_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      sql += ` AND entry_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    if (mood) {
      sql += ` AND mood = $${paramIndex}`;
      params.push(mood);
      paramIndex++;
    }

    sql += ' ORDER BY entry_date DESC, created_at DESC';

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      entries: result.rows
    });

  } catch (error: any) {
    console.error('❌ GET self-recording error:', error);
    return NextResponse.json({ 
      error: '取得記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - 新增心靈便籤記錄
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userid, 
      entry_date,
      title, 
      content, 
      mood, 
      weather, 
      tags, 
      attachments,
      sleep_hours,
      exercise_minutes,
      water_ml,
      stress_level
    } = body;

    if (!userid || !title || !content) {
      return NextResponse.json({ 
        error: '缺少必填欄位 (userid, title, content)' 
      }, { status: 400 });
    }

    // 計算 mood_score (根據心情)
    const moodScores: Record<string, number> = {
      'happy': 80,
      'excited': 85,
      'neutral': 60,
      'anxious': 40,
      'sad': 30
    };
    const mood_score = moodScores[mood] || 60;

    const sql = `
      INSERT INTO self_recording 
      (user_id, entry_date, title, content, mood, weather, tags, attachments, 
       sleep_hours, exercise_minutes, water_ml, stress_level, mood_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      userid,
      entry_date || new Date().toISOString().split('T')[0],
      title,
      content,
      mood || 'neutral',
      weather || 'sunny',
      JSON.stringify(tags || []),
      JSON.stringify(attachments || []),
      sleep_hours || null,
      exercise_minutes || null,
      water_ml || null,
      stress_level || null,
      mood_score
    ];

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST self-recording error:', error);
    return NextResponse.json({ 
      error: '新增記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - 更新心靈便籤記錄
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      userid, 
      title, 
      content, 
      mood, 
      weather, 
      tags, 
      attachments,
      sleep_hours,
      exercise_minutes,
      water_ml,
      stress_level
    } = body;

    if (!id || !userid) {
      return NextResponse.json({ 
        error: '缺少 id 或 userid' 
      }, { status: 400 });
    }

    const sql = `
      UPDATE self_recording 
      SET 
        title = COALESCE($3, title),
        content = COALESCE($4, content),
        mood = COALESCE($5, mood),
        weather = COALESCE($6, weather),
        tags = COALESCE($7, tags),
        attachments = COALESCE($8, attachments),
        sleep_hours = COALESCE($9, sleep_hours),
        exercise_minutes = COALESCE($10, exercise_minutes),
        water_ml = COALESCE($11, water_ml),
        stress_level = COALESCE($12, stress_level),
        updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const params = [
      id,
      userid,
      title,
      content,
      mood,
      weather,
      tags ? JSON.stringify(tags) : null,
      attachments ? JSON.stringify(attachments) : null,
      sleep_hours,
      exercise_minutes,
      water_ml,
      stress_level
    ];

    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: '找不到該記錄或無權限修改' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ PUT self-recording error:', error);
    return NextResponse.json({ 
      error: '更新記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - 刪除心靈便籤記錄
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userid = searchParams.get('userid');

    if (!id || !userid) {
      return NextResponse.json({ 
        error: '缺少 id 或 userid' 
      }, { status: 400 });
    }

    const sql = `
      DELETE FROM self_recording 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(sql, [id, userid]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: '找不到該記錄或無權限刪除' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '記錄已刪除'
    });

  } catch (error: any) {
    console.error('❌ DELETE self-recording error:', error);
    return NextResponse.json({ 
      error: '刪除記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}