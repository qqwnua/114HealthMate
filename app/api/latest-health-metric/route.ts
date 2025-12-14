// app/api/latest-health-metric/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // 🟢 修改後的 SQL：使用 Subquery 分別找最新的非空值
    // 這樣就算你今天只量體重，昨天量血壓，這裡也會顯示昨天的血壓，不會變成 N/A
    const query = `
      SELECT 
        (
          SELECT systolic_bp 
          FROM health_records 
          WHERE user_id = $1 AND systolic_bp IS NOT NULL 
          ORDER BY record_date DESC, id DESC 
          LIMIT 1
        ) as systolic_bp,
        (
          SELECT diastolic_bp 
          FROM health_records 
          WHERE user_id = $1 AND diastolic_bp IS NOT NULL 
          ORDER BY record_date DESC, id DESC 
          LIMIT 1
        ) as diastolic_bp,
        (
          SELECT blood_sugar 
          FROM health_records 
          WHERE user_id = $1 AND blood_sugar IS NOT NULL 
          ORDER BY record_date DESC, id DESC 
          LIMIT 1
        ) as blood_sugar
    `;

    const result = await pool.query(query, [userId]);

    // 如果完全沒有資料
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ 
        systolic_bp: null, 
        diastolic_bp: null, 
        blood_sugar: null 
      });
    }

    // 回傳結果
    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error("❌ latest-health-metric GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}