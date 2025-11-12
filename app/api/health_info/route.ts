import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // 你的資料庫連線設定

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      height,
      weight,
      bloodType,
      allergies,
      medications,
      medicalHistory,
      familyHistory,
      // 🔴 1. 在此接收前端傳來的三個新欄位 (Camel Case)
      smokingStatus,
      alcoholConsumption,
      exerciseFrequency,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    // 檢查是否已有資料
    const checkQuery = `SELECT user_id FROM health_info WHERE user_id = $1`;
    const checkResult = await pool.query(checkQuery, [userId]);

    const alreadyExists = (checkResult.rowCount ?? 0) > 0;

    // 🔴 2. 統一定義要傳給 SQL 的參數陣列
    // 參數順序對應 $1, $2, ... $10
    const params = [
      height || null,
      weight || null,
      bloodType || null, // $3
      allergies || null, // $4
      medications || null, // $5
      medicalHistory || null, // $6
      familyHistory || null, // $7
      smokingStatus || null, // $8 👈 對應資料庫的 smoking_status
      alcoholConsumption || null, // $9 👈 對應資料庫的 alcohol_consumption
      exerciseFrequency || null, // $10 👈 對應資料庫的 exercise_frequency
    ];

    if (alreadyExists) {
      // 🔴 3. 更新資料：將新的欄位和參數加入 SET 區塊
      const updateQuery = `
        UPDATE health_info
        SET height = $1,
            weight = $2,
            blood_type = $3,
            allergies = $4,
            medications = $5,
            medical_history = $6,
            family_history = $7,
            smoking_status = $8,         
            alcohol_consumption = $9,      
            exercise_frequency = $10     
        WHERE user_id = $11               -- 🔴 userId 成為第 11 個參數
      `;
      
      // 執行更新，將 userId 放在陣列最後面作為 $11
      await pool.query(updateQuery, [...params, userId]);
      
    } else {
      // 🔴 4. 新增資料：將新的欄位和參數加入 INSERT 區塊
      const insertQuery = `
        INSERT INTO health_info
          (user_id, height, weight, blood_type, allergies, medications, medical_history, family_history, smoking_status, alcohol_consumption, exercise_frequency)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      // 執行新增，將 userId 放在陣列最前面作為 $1
      await pool.query(insertQuery, [
        userId, 
        ...params
      ]);
    }

    return NextResponse.json({ message: "✅ 健康資料儲存成功" });
  } catch (error: any) {
    console.error("❌ health_info POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🟢 GET 函式保持不變
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
    }

    const query = `SELECT * FROM health_info WHERE user_id = $1`;
    const result = await pool.query(query, [userId]);

    // 🔴 包含新的欄位 (smoking_status, alcohol_consumption, exercise_frequency)
    // 由於是 SELECT *，只要資料庫有欄位，就會自動回傳。

    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "查無健康資料" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("❌ health_info GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}