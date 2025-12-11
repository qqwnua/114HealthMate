// app/api/self-assessment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// GET - 取得用戶的自我評估記錄
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');
    const days = searchParams.get('days');

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    let sql = `
      SELECT 
        assessment_id, user_id, assessment_type, answers,
        total_score, anxiety_score as anxiety_level, stress_score as stress_level, 
        mood_score as mood_stability, happiness_score as happiness_level, 
        social_score as social_satisfaction, confidence_score as confidence_level,
        notes, completed_at
      FROM self_assessments 
      WHERE user_id = $1
    `;

    const params: any[] = [userid];

    if (days) {
      sql += ` AND completed_at >= NOW() - INTERVAL '${parseInt(days)} days'`;
    }

    sql += ' ORDER BY completed_at DESC';

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      assessments: result.rows
    });

  } catch (error: any) {
    console.error('❌ GET self-assessment error:', error);
    return NextResponse.json({ 
      error: '取得評估記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST - 新增自我評估記錄
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userid,
      anxiety_level,
      stress_level,
      mood_stability,
      happiness_level,
      social_satisfaction,
      confidence_level,
      notes,
      total_score
    } = body;

    if (!userid) {
      return NextResponse.json({ 
        error: '缺少 userid' 
      }, { status: 400 });
    }

    // 使用前端傳來的 total_score
    const finalScore = total_score || Math.round(
      ((anxiety_level || 0) + (stress_level || 0) + (mood_stability || 0) + 
       (happiness_level || 0) + (social_satisfaction || 0) + (confidence_level || 0)) / 6
    );

    const sql = `
      INSERT INTO self_assessments 
      (user_id, assessment_type, answers, total_score,
      anxiety_score, stress_score, mood_score, happiness_score, 
      social_score, confidence_score, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      userid,
      'daily',
      JSON.stringify({
        anxiety: anxiety_level,
        stress: stress_level,
        mood: mood_stability,
        happiness: happiness_level,
        social: social_satisfaction,
        confidence: confidence_level
      }),
      finalScore,
      anxiety_level || 0,
      stress_level || 0,
      mood_stability || 0,
      happiness_level || 0,
      social_satisfaction || 0,
      confidence_level || 0,
      notes || null
    ];

    const result = await pool.query(sql, params);

    return NextResponse.json({
      success: true,
      assessment: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ POST self-assessment error:', error);
    return NextResponse.json({ 
      error: '新增評估記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE - 刪除自我評估記錄
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assessment_id = searchParams.get('id');
    const userid = searchParams.get('userid');

    if (!assessment_id || !userid) {
      return NextResponse.json({ 
        error: '缺少 id 或 userid' 
      }, { status: 400 });
    }

    const sql = `
      DELETE FROM self_assessments 
      WHERE assessment_id = $1 AND user_id = $2
      RETURNING assessment_id
    `;

    const result = await pool.query(sql, [assessment_id, userid]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: '找不到該評估記錄或無權刪除' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '評估記錄已刪除'
    });

  } catch (error: any) {
    console.error('❌ DELETE self-assessment error:', error);
    return NextResponse.json({ 
      error: '刪除評估記錄失敗', 
      details: error.message 
    }, { status: 500 });
  }
}