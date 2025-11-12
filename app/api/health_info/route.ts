import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // 你的資料庫連線設定

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, height, weight, bloodType, allergies, medications, medical_history } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // 檢查是否已有資料
    const checkQuery = `SELECT user_id FROM health_info WHERE user_id = $1`;
    const checkResult = await pool.query(checkQuery, [userId]);

    const alreadyExists = (checkResult.rowCount ?? 0) > 0; // ✅ 安全處理

    if (alreadyExists) {
      // 更新資料
      const updateQuery = `
        UPDATE health_info
        SET height = $1,
            weight = $2,
            blood_type = $3,
            allergies = $4,
            medications = $5,
            medical_history = $6
        WHERE user_id = $7
      `;
      await pool.query(updateQuery, [
        height || null,
        weight || null,
        bloodType || null,
        allergies || null,
        medications || null,
        medical_history || null,
        userId,
      ]);
    } else {
      // 新增資料
      const insertQuery = `
        INSERT INTO health_info (user_id, height, weight, blood_type, allergies, medications, medical_history)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await pool.query(insertQuery, [
        userId,
        height || null,
        weight || null,
        bloodType || null,
        allergies || null,
        medications || null,
        medical_history || null,
      ]);
    }

    return NextResponse.json({ message: "✅ 健康資料儲存成功" });
  } catch (error: any) {
    console.error("❌ health_info POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const query = `SELECT * FROM health_info WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);

    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "查無健康資料" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ health_info GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
