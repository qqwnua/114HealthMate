// app/api/health-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// POST - 計算並更新健康分數
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userid } = body;

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    // 1. 取得最新的自我評估分數 (預設 60)
    const assessmentRes = await pool.query(`
      SELECT total_score FROM self_assessments 
      WHERE user_id = $1 
      ORDER BY completed_at DESC LIMIT 1
    `, [userid]);
    const assessmentScore = assessmentRes.rows[0]?.total_score || 60;

    // 2. 計算生活紀錄分數 (過去 7 天有寫幾篇日記)
    const recordingRes = await pool.query(`
      SELECT COUNT(*) as count FROM self_recording 
      WHERE user_id = $1 AND entry_date >= NOW() - INTERVAL '7 days'
    `, [userid]);
    const recordCount = parseInt(recordingRes.rows[0]?.count || '0');
    // 簡單算法：一篇日記 20 分，基礎 40 分，滿分 100
    const recordingScore = Math.min(recordCount * 20 + 40, 100);

    // 3. 計算情緒活躍度 (過去 7 天有幾筆情緒紀錄)
    const emotionRes = await pool.query(`
      SELECT COUNT(*) as count FROM emotion_records 
      WHERE user_id = $1 AND recorded_at >= NOW() - INTERVAL '7 days'
    `, [userid]);
    const emotionCount = parseInt(emotionRes.rows[0]?.count || '0');

    // 4. 計算整體分數 (權重：評估 40% + 紀錄 40% + 情緒活躍 20%)
    const overallScore = Math.round(
      (assessmentScore * 0.4) + (recordingScore * 0.4) + (Math.min(emotionCount * 10, 100) * 0.2)
    );

    // 5. 寫入 health_scores (注意欄位是 user_id)
    const insertSql = `
      INSERT INTO health_scores 
      (user_id, overall_score, assessment_score, recording_score, 
       emotion_record_count, recent_emotion_count, calculated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;

    const result = await pool.query(insertSql, [
      userid, 
      overallScore, 
      assessmentScore, 
      recordingScore, 
      emotionCount, // 總記錄數
      emotionCount  // 近期記錄數
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "健康分數已更新"
    });

  } catch (error: any) {
    console.error('❌ POST health-score error:', error);
    return NextResponse.json({ 
      error: '更新健康分數失敗', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET - 取得最新分數
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userid = searchParams.get('userid');

    if (!userid) {
      return NextResponse.json({ error: '缺少 userid' }, { status: 400 });
    }

    const sql = `
      SELECT * FROM health_scores 
      WHERE user_id = $1 
      ORDER BY calculated_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(sql, [userid]);

    return NextResponse.json({
      success: true,
      score: result.rows[0] || null
    });

  } catch (error: any) {
    console.error('❌ GET health-score error:', error);
    return NextResponse.json({ 
      error: '取得分數失敗', 
      details: error.message 
    }, { status: 500 });
  }
}