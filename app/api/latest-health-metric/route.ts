// app/api/latest-health-metric/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // 依照您的專案結構引用連線池

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // SQL 查詢邏輯：
    // 1. 從 health_records 表格
    // 2. 篩選該 user_id
    // 3. 依照 record_date (日期) 降序排列，若日期相同則依照 id 降序 (確保抓到最新寫入的)
    // 4. LIMIT 1 只取一筆
    const query = `
      SELECT 
        systolic_bp, 
        diastolic_bp, 
        blood_sugar
      FROM health_records
      WHERE user_id = $1
      ORDER BY record_date DESC, id DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    // 如果沒有紀錄，回傳 null 值以免前端報錯
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ 
        systolic_bp: null, 
        diastolic_bp: null, 
        blood_sugar: null 
      });
    }

    // 回傳最新的一筆數據
    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error("❌ latest-health-metric GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}