import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 新增或更新使用者偏好設定
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, notifications, notifyMethods, language, consentAI } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // ✅ 資料清理與安全處理
    const safeArray = (arr: any) =>
      Array.isArray(arr) && arr.length > 0 ? arr : [];

    const safeText = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    notifications = notifications === true || notifications === "true";
    consentAI = consentAI === true || consentAI === "true";
    notifyMethods = safeArray(notifyMethods);
    language = safeText(language) || "zh"; // 預設中文

    const query = `
      INSERT INTO preferences
      (user_id, notifications, notify_methods, language, consent_ai)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
        SET notifications = EXCLUDED.notifications,
            notify_methods = EXCLUDED.notify_methods,
            language = EXCLUDED.language,
            consent_ai = EXCLUDED.consent_ai
    `;

    await pool.query(query, [
      userId,
      notifications,
      JSON.stringify(notifyMethods),
      language,
      consentAI,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ preferences POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 取得使用者偏好設定
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM preferences WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    const data = result.rows[0];

    // ✅ JSON 欄位轉回陣列
    data.notify_methods = data.notify_methods
      ? JSON.parse(data.notify_methods)
      : [];

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ preferences GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
