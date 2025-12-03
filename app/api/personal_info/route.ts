import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 🟢 POST: 建立或更新使用者基本資料
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. 接收前端資料 (CamelCase)
    let { 
      userId, 
      name, 
      gender, 
      birthDate, 
      address, 
      phone,            
      emergencyContact, // 前端傳來的緊急聯絡人姓名
      emergencyPhone    // 前端傳來的緊急聯絡人電話
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 2. 資料清洗 (空字串轉 null)
    const safeValue = (v: string | null | undefined) =>
      v && v.trim() !== "" ? v.trim() : null;

    name = safeValue(name);
    let birthdate = safeValue(birthDate); 
    address = safeValue(address);
    let dbPhone = safeValue(phone);
    
    // 關鍵：將前端變數轉為 DB 變數
    let dbEmergencyContact = safeValue(emergencyContact);
    let dbEmergencyPhone = safeValue(emergencyPhone);

    // 性別處理
    if (gender) {
      const g = gender.toLowerCase();
      if (g === "male" || g === "m") gender = "M";
      else if (g === "female" || g === "f") gender = "F";
      else gender = "O";
    } else {
      gender = null;
    }

    // 3. 寫入資料庫 (personal_info 表格)
    // 注意：這裡明確寫入 emergency_contact 和 emergency_phone
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

    await pool.query(query, [
      userId, 
      name, 
      gender, 
      birthdate, 
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

// 🟢 GET: 取得使用者完整資料
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. SQL 查詢
    // 這裡我們明確選取 personal_info (別名 p) 裡面的欄位
    const query = `
      SELECT 
        u.email,
        p.name,
        p.gender,
        p.birthdate,
        p.address,
        p.phone,
        p.emergency_contact,  -- 這是您要抓的欄位
        p.emergency_phone,    -- 這是您要抓的欄位
        h.smoking_status,
        h.alcohol_consumption,
        h.exercise_frequency,
        h.medical_history,
        h.medications
      FROM users u
      LEFT JOIN personal_info p ON p.user_id = u.id
      LEFT JOIN health_info h ON h.user_id = u.id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = result.rows[0];

    // 2. 格式轉換
    let genderFrontend = "";
    if (row.gender) {
      const dbGender = String(row.gender).toUpperCase();
      if (["F", "FEMALE"].includes(dbGender)) genderFrontend = "female";
      else if (["M", "MALE"].includes(dbGender)) genderFrontend = "male";
      else if (["O", "OTHER"].includes(dbGender)) genderFrontend = "other";
    }

    let birthdateFrontend = "";
    if (row.birthdate) {
      const dateObj = row.birthdate instanceof Date ? row.birthdate : new Date(row.birthdate);
      if (!isNaN(dateObj.getTime())) {
        birthdateFrontend = dateObj.toISOString().split("T")[0];
      }
    }

    // 3. 回傳資料 (Mapping)
    // 這裡將資料庫的 snake_case 轉為前端 CamelCase
    const responseData = {
      // --- 設定頁面 (Personalization Settings) 用 ---
      name: row.name ?? "",
      email: row.email ?? "",
      birthDate: birthdateFrontend, 
      gender: genderFrontend,
      address: row.address ?? "",
      phone: row.phone ?? "",
      
      // 關鍵修正：這裡對應 SQL 撈出來的 emergency_contact
      emergencyContact: row.emergency_contact ?? "", 
      emergencyPhone: row.emergency_phone ?? "",     
      
      // --- 健康 AI (Health Management) 用 ---
      birthdate: birthdateFrontend, 
      smoking_status: row.smoking_status ?? "unknown", 
      smoking: row.smoking_status ?? "unknown",        
      alcohol: row.alcohol_consumption ?? "unknown",   
      alcohol_consumption: row.alcohol_consumption,
      exercise: row.exercise_frequency ?? "unknown",   
      exercise_frequency: row.exercise_frequency,
      medicalHistory: row.medical_history ?? "",
      medical_history: row.medical_history ?? "",
      medications: row.medications ?? ""
    };

    return NextResponse.json(responseData);

  } catch (err) {
    console.error("❌ personal_info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}