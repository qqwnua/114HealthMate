import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 建立或更新使用者基本資料
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, name, gender, birthdate, address, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 🔹 將空字串或 undefined 統一轉為 null，避免 date parse error
    const safeValue = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    name = safeValue(name);
    gender = safeValue(gender);
    birthdate = safeValue(birthdate);
    address = safeValue(address);
    avatarUrl = safeValue(avatarUrl);

    const query = `
      INSERT INTO personal_info (user_id, name, gender, birthdate, address, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE
        SET name = EXCLUDED.name,
            gender = EXCLUDED.gender,
            birthdate = EXCLUDED.birthdate,
            address = EXCLUDED.address,
            avatar_url = EXCLUDED.avatar_url
    `;

    await pool.query(query, [userId, name, gender, birthdate, address, avatarUrl]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ personal_info POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 取得使用者基本資料（設定頁用）
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const query = "SELECT * FROM personal_info WHERE user_id = $1";
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error("❌ personal_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
