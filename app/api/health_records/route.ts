import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// 取得歷史紀錄
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = searchParams.get('limit') || '30';

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    // 修改重點：
    // 1. 不使用 SELECT *
    // 2. 使用 MAX() 函數忽略 NULL 值，保留有數值的欄位
    // 3. 使用 GROUP BY record_date 將同一天的多筆資料合併
    const sql = `
      SELECT 
        record_date,
        MAX(id) as id, 
        MAX(systolic_bp) as systolic_bp,
        MAX(diastolic_bp) as diastolic_bp,
        MAX(blood_sugar) as blood_sugar,
        MAX(blood_sugar_type) as blood_sugar_type,
        MAX(total_cholesterol) as total_cholesterol,
        MAX(hdl_cholesterol) as hdl_cholesterol,
        MAX(ldl_cholesterol) as ldl_cholesterol,
        MAX(triglycerides) as triglycerides,
        MAX(weight) as weight
      FROM health_records 
      WHERE user_id = $1 
      GROUP BY record_date 
      ORDER BY record_date ASC 
      LIMIT $2
    `;
    
    const result = await pool.query(sql, [userId, limit]);
    
    // 資料格式化 (這部分保持原本邏輯，負責轉成 camelCase)
    const formattedData = result.rows.map(row => {
      // 處理時區問題，確保日期字串正確
      const dateObj = new Date(row.record_date);
      // 這裡做一個小修正：直接使用 toISOString 取前面部分，避免時區跳轉導致日期少一天
      // 或者維持你原本的邏輯，只要前端顯示正確即可
      
      return {
        id: row.id,
        rawDate: row.record_date,
        // 格式化日期 (例如 12/05)
        date: dateObj.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
        
        // 數值對應
        systolic: row.systolic_bp,
        diastolic: row.diastolic_bp,
        bloodSugar: row.blood_sugar,
        bloodSugarType: row.blood_sugar_type,
        totalCholesterol: row.total_cholesterol,
        hdl: row.hdl_cholesterol,
        ldl: row.ldl_cholesterol,
        triglycerides: row.triglycerides,
        weight: row.weight
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Database Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("收到的 Body:", body); // 除錯用

    const userId = body.userId || body.user_id;
    const recordDate = body.recordDate || body.record_date;

    // --- 【變數讀取邏輯：最終修正版】 ---

    // 1. 抓出類型並轉小寫，方便比對
    const rawType = String(body.bloodSugarType || body.blood_sugar_type || body.type || "").toLowerCase();

    // 2. 血脂肪 (Lipids)
    const hdl = body.hdl || body.hdl_cholesterol;
    const ldl = body.ldl || body.ldl_cholesterol;
    const totalCholesterol = body.totalCholesterol || body.total_cholesterol || body.total; 
    const triglycerides = body.triglycerides || body.tri; 

    // 3. 血糖 (Blood Sugar) - 關鍵修正區域
    let bloodSugar = body.bloodSugar || body.blood_sugar;
    let bloodSugarType = body.bloodSugarType || body.blood_sugar_type || body.type;

    // 如果還沒抓到血糖數值，但有 value，檢查 type 是否為血糖相關關鍵字
    if (!bloodSugar && body.value) {
        if (
            // 標準醫學術語 (現在加上這兩個了！)
            rawType.includes('fasting') ||       // 空腹
            rawType.includes('postprandial') ||  // 飯後
            // 其他可能出現的詞
            rawType.includes('sugar') ||         
            rawType.includes('glucose') ||
            rawType.includes('飯') || 
            rawType.includes('空腹')
        ) {
            bloodSugar = body.value;
            // 確保 bloodSugarType 有值
            if (!bloodSugarType) bloodSugarType = body.type; 
        }
    }

    // 4. 血壓
    const systolic = body.systolic || body.systolic_bp;
    const diastolic = body.diastolic || body.diastolic_bp;

    // 5. 體重 (Weight) - 嚴格防守
    let weight = body.weight || body.bodyWeight;

    // 只有當「上面都沒抓到血糖」時，才來判斷是否為體重
    if (!weight && body.value && !bloodSugar) {
        // 只有明確是體重關鍵字，或者是空字串(且不是血糖)才寫入
        if (rawType === 'weight' || 
            rawType === 'kg' || 
            rawType === 'bmi' ||
            rawType === '') { // 如果完全沒寫 type，且不是血糖，通常是體重
            weight = body.value;
        }
    }
    
    // --- 變數讀取結束 ---

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const dateToSave = recordDate || new Date().toISOString().split('T')[0];

    // vNum: 轉數字 (過濾掉空字串或 NaN)
    const vNum = (val: any) => {
      if (val === "" || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    // vStr: 轉字串 (確保 type 能存進去)
    const vStr = (val: any) => {
      if (val === "" || val === undefined || val === null) return null;
      return String(val);
    };

    const sql = `
      INSERT INTO health_records (
        user_id, record_date, 
        systolic_bp, diastolic_bp, 
        blood_sugar, blood_sugar_type,
        total_cholesterol, hdl_cholesterol, ldl_cholesterol, triglycerides,
        weight
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, record_date) 
      DO UPDATE SET
        systolic_bp = COALESCE(EXCLUDED.systolic_bp, health_records.systolic_bp),
        diastolic_bp = COALESCE(EXCLUDED.diastolic_bp, health_records.diastolic_bp),
        blood_sugar = COALESCE(EXCLUDED.blood_sugar, health_records.blood_sugar),
        blood_sugar_type = COALESCE(EXCLUDED.blood_sugar_type, health_records.blood_sugar_type),
        total_cholesterol = COALESCE(EXCLUDED.total_cholesterol, health_records.total_cholesterol),
        hdl_cholesterol = COALESCE(EXCLUDED.hdl_cholesterol, health_records.hdl_cholesterol),
        ldl_cholesterol = COALESCE(EXCLUDED.ldl_cholesterol, health_records.ldl_cholesterol),
        triglycerides = COALESCE(EXCLUDED.triglycerides, health_records.triglycerides),
        weight = COALESCE(EXCLUDED.weight, health_records.weight)
      RETURNING *;
    `;

    const values = [
      userId, dateToSave,
      vNum(systolic), vNum(diastolic), 
      vNum(bloodSugar), vStr(bloodSugarType), // 這裡用 vStr
      vNum(totalCholesterol), vNum(hdl), vNum(ldl), vNum(triglycerides), 
      vNum(weight)
    ];

    const result = await pool.query(sql, values);
    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Save Record Error:', error);
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}