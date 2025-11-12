import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 新增或更新健康資料
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      userId,
      bloodType,
      chronicDiseases,
      allergies,
      medications,
      familyHistory,
      height,
      weight,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ 安全處理空值
    const safeText = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    const safeArray = (arr: any) =>
      Array.isArray(arr) && arr.length > 0 ? arr : [];

    const safeNumber = (v: any) =>
      v === "" || v === null || v === undefined ? null : parseFloat(v);

    bloodType = safeText(bloodType);
    medications = safeText(medications);
    chronicDiseases = safeArray(chronicDiseases);
    allergies = safeArray(allergies);
    familyHistory = safeArray(familyHistory);
    height = safeNumber(height);
    weight = safeNumber(weight);

    const query = `
      INSERT INTO health_info 
      (user_id, blood_type, chronic_diseases, allergies, medications, family_history, height, weight)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE
        SET blood_type = EXCLUDED.blood_type,
            chronic_diseases = EXCLUDED.chronic_diseases,
            allergies = EXCLUDED.allergies,
            medications = EXCLUDED.medications,
            family_history = EXCLUDED.family_history,
            height = EXCLUDED.height,
            weight = EXCLUDED.weight
    `;

    await pool.query(query, [
      userId,
      bloodType,
      JSON.stringify(chronicDiseases),
      JSON.stringify(allergies),
      medications,
      JSON.stringify(familyHistory),
      height,
      weight,
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ health_info POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 取得健康資料（設定頁用）
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM health_info WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const data = result.rows[0];

    // 將 JSON 欄位轉回陣列
    data.chronic_diseases = data.chronic_diseases
      ? JSON.parse(data.chronic_diseases)
      : [];
    data.allergies = data.allergies ? JSON.parse(data.allergies) : [];
    data.family_history = data.family_history
      ? JSON.parse(data.family_history)
      : [];

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ health_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
