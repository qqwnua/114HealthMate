// /app/api/user/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔹 GET /api/user/[id] called with params:", params);

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      console.log("❌ Invalid user id:", params.id);
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // 使用者基本資料
    const userRes = await pool.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId]
    );
    console.log("🔹 userRes.rows:", userRes.rows);

    if (!userRes.rowCount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 個人資料
    const personalRes = await pool.query(
      "SELECT name, gender, birthdate, address, avatar_url FROM personal_info WHERE user_id = $1",
      [userId]
    );
    console.log("🔹 personalRes.rows:", personalRes.rows);

    // 緊急聯絡人（只取第一筆）
    const emergencyRes = await pool.query(
      "SELECT name, phone, relation FROM emergency_contacts WHERE user_id=$1 ORDER BY id LIMIT 1",
      [userId]
    );
    console.log("🔹 emergencyRes.rows:", emergencyRes.rows);

    // 健康資料
    const healthRes = await pool.query(
      "SELECT height, weight, blood_type, allergies, medications, medical_history, family_history FROM health_info WHERE user_id=$1",
      [userId]
    );
    console.log("🔹 healthRes.rows:", healthRes.rows);

    // gender 轉換
    let personalData = personalRes.rows[0] || null;
    if (personalData && personalData.gender) {
      const g = personalData.gender.toString().toLowerCase();
      personalData.gender =
        g === "f" || g === "female"
          ? "female"
          : g === "m" || g === "male"
          ? "male"
          : "other";
    }

    return NextResponse.json({
      user: { ...userRes.rows[0], ...personalData },
      emergencyContact: emergencyRes.rows[0] || null,
      healthInfo: healthRes.rows[0] || null,
    });
  } catch (err) {
    console.error("❌ GET user error:", err);
    return NextResponse.json({ error: "Fetch user failed" }, { status: 500 });
  }
}
