// /app/api/personal_info/route.ts
// ---------------- 
// 🔴 完整修正版 🔴
// ----------------
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 建立或更新使用者基本資料
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 🔴 修正 #1: 接收前端 state 傳來的 camelCase 欄位
    let { 
      userId, 
      name, 
      gender, 
      birthDate, // <--- 接收 camelCase
      address, 
      phone,            // <--- 新增
      emergencyContact, // <--- 新增 (camelCase)
      emergencyPhone    // <--- 新增 (camelCase)
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 🔹 將空字串或 undefined 統一轉為 null，避免錯誤
    const safeValue = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    name = safeValue(name);
    let birthdate = safeValue(birthDate); // 🔴 修正 #2: 將 birthDate 轉為 birthdate 變數
    address = safeValue(address);
    let dbPhone = safeValue(phone); // <--- 新增
    let dbEmergencyContact = safeValue(emergencyContact); // <--- 新增
    let dbEmergencyPhone = safeValue(emergencyPhone); // <--- 新增
    // avatarUrl 已移除

    // 🔹 gender 儲存資料庫時統一轉 M/F/O
    if (gender) {
      const g = gender.toLowerCase();
      if (g === "male" || g === "m") gender = "M";
      else if (g === "female" || g === "f") gender = "F";
      else gender = "O";
    } else {
      gender = null;
    }

    // 🔴 修正 #3: 更新 SQL 查詢 (移除 avatar_url, 新增 phone, emergency_contact, emergency_phone)
    const query = `
      INSERT INTO personal_info (
        user_id, name, gender, birthdate, address, 
        phone, emergency_contact, emergency_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE
        SET name = EXCLUDED.name,
            gender = EXCLUDED.gender,
            birthdate = EXCLUDED.birthdate,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            emergency_contact = EXCLUDED.emergency_contact,
            emergency_phone = EXCLUDED.emergency_phone
    `;

    // 🔴 修正 #4: 傳入正確的參數
    await pool.query(query, [
      userId, 
      name, 
      gender, 
      birthdate, // <--- 使用轉換後的 'birthdate'
      address, 
      dbPhone, 
      dbEmergencyContact, 
      dbEmergencyPhone
    ]);

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

    // 🔴 修正 #5: 更新 SELECT 查詢
    const query = `
      SELECT 
        u.email,
        p.name,
        p.gender,
        p.birthdate,
        p.address,
        p.phone,              -- <--- 新增
        p.emergency_contact,  -- <--- 新增
        p.emergency_phone     -- <--- 新增
      FROM users u
      LEFT JOIN personal_info p ON p.user_id = u.id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      // 即使 personal_info 沒有資料，也要回傳 users 裡的 email
      const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [userId]);
      if (userResult.rows.length > 0) {
        return NextResponse.json({ email: userResult.rows[0].email });
      }
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

    // 🔴 修正 #6: 更新 responseData
    const responseData = {
      name: row.name ?? "",
      email: row.email ?? "",
      birthdate: birthdateFrontend, // 欄位名 'birthdate' (前端 useEffect 會處理)
      gender: genderFrontend,
      address: row.address ?? "",
      phone: row.phone ?? "",                        // <--- 新增
      emergency_contact: row.emergency_contact ?? "", // <--- 新增
      emergency_phone: row.emergency_phone ?? "",     // <--- 新增
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("❌ personal_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}