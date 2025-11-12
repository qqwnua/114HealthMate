import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 建立或更新使用者基本資料 (POST 保持不變)
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

    // gender 儲存資料庫為 M/F (確保 'other' 或 null 的情況)
    if (gender) {
        if (gender.toLowerCase() === "male") gender = "M";
        else if (gender.toLowerCase() === "female") gender = "F";
        else gender = "O"; // 🔴 建議：如果前端傳 'other'，後端存 'O' 或其他標記
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
  } catch (err: any) {
    console.error("❌ personal_info POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// 🟢 修正後的取得使用者基本資料（設定頁用）
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 🔴 修正：使用 LEFT JOIN 連結 users 表格，以獲取 email 和 phone (如果 phone 存在 users 表)
    const query = `
      SELECT 
        u.email,
        p.name, 
        p.gender, 
        p.birthdate, 
        p.address, 
        p.avatar_url
        -- 假設 phone 不在 personal_info，如果 phone 在 users 表中，可以在 users 表格中 SELECT u.phone
      FROM users u
      LEFT JOIN personal_info p ON p.user_id = u.id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // 找不到 user 紀錄
      return NextResponse.json({}, { status: 404 }); 
    }
    
    const row = result.rows[0];

    // --- 🔴 處理欄位轉換 ---

    // 1. 性別轉換：DB 值 (M/F/O) -> 前端值 (male/female/other/"" )
    let genderFrontend = "";
    if (row.gender) {
        const dbGender = String(row.gender).toUpperCase();
        if (dbGender === "F") genderFrontend = "female";
        else if (dbGender === "M") genderFrontend = "male";
        else if (dbGender === "O" || dbGender === "OTHER") genderFrontend = "other"; // 處理 '其他'
    }
    
    // 2. 日期轉換：將資料庫的 date 轉為 YYYY-MM-DD 格式 (讓 Input type='date' 可以正確顯示)
    let birthdateFrontend = row.birthdate;
    if (row.birthdate) {
        // 確保 row.birthdate 是有效的日期物件或字串
        const dateObj = (row.birthdate instanceof Date) ? row.birthdate : new Date(row.birthdate);
        // 檢查日期是否有效
        if (!isNaN(dateObj.getTime())) {
            birthdateFrontend = dateObj.toISOString().split('T')[0];
        } else {
            birthdateFrontend = "";
        }
    } else {
        birthdateFrontend = "";
    }
    
    const responseData = {
        name: row.name ?? "",
        email: row.email ?? "", // 來自 users 表格
        phone: row.phone ?? "", // 假設 phone 在 users 表格，若不在請檢查
        avatar_url: row.avatar_url ?? "/placeholder.svg",
        birthdate: birthdateFrontend, // 修正後的 YYYY-MM-DD 格式
        gender: genderFrontend,       // 修正後的 male/female/other
        address: row.address ?? "",
    }

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("❌ personal_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}