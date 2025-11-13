// /app/api/personal_info/route.ts
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

    // 🔹 將空字串或 undefined 統一轉為 null，避免錯誤
    const safeValue = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    name = safeValue(name);
    gender = safeValue(gender);
    birthdate = safeValue(birthdate);
    address = safeValue(address);
    avatarUrl = safeValue(avatarUrl);

    // 🔹 gender 儲存資料庫時統一轉 M/F/O
    if (gender) {
      const g = gender.toLowerCase();
      if (g === "male" || g === "m") gender = "M";
      else if (g === "female" || g === "f") gender = "F";
      else gender = "O";
    } else {
      gender = null;
    }

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
  } catch (err) {
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

    const query = `
      SELECT 
        u.email,
        p.name,
        p.gender,
        p.birthdate,
        p.address,
        p.avatar_url
      FROM users u
      LEFT JOIN personal_info p ON p.user_id = u.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({}, { status: 404 });
    }

    const row = result.rows[0];

    // 🔹 性別轉換支援 M/F/O 以及 male/female/other
    let genderFrontend = "";
    if (row.gender) {
      const dbGender = String(row.gender).toUpperCase();
      if (["F", "FEMALE"].includes(dbGender)) genderFrontend = "female";
      else if (["M", "MALE"].includes(dbGender)) genderFrontend = "male";
      else if (["O", "OTHER"].includes(dbGender)) genderFrontend = "other";
    }

    // 🔹 生日格式轉換 (YYYY-MM-DD)
    let birthdateFrontend = "";
    if (row.birthdate) {
      const dateObj = row.birthdate instanceof Date ? row.birthdate : new Date(row.birthdate);
      if (!isNaN(dateObj.getTime())) {
        birthdateFrontend = dateObj.toISOString().split("T")[0];
      }
    }

    const responseData = {
      name: row.name ?? "",
      email: row.email ?? "",
      avatar_url: row.avatar_url ?? "/placeholder.svg",
      birthdate: birthdateFrontend,
      gender: genderFrontend,
      address: row.address ?? "",
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("❌ personal_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
