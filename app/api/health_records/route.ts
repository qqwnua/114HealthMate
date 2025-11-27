import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// 取得歷史紀錄
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = searchParams.get('limit') || '30';

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const sql = `
      SELECT * FROM health_records 
      WHERE user_id = $1 
      ORDER BY record_date ASC 
      LIMIT $2
    `;
    const result = await pool.query(sql, [userId, limit]);
    
    // 關鍵修正：將資料庫欄位 (snake_case) 轉換為 前端欄位 (camelCase)
    const formattedData = result.rows.map(row => {
      const dateObj = row.record_date instanceof Date ? row.record_date : new Date(row.record_date);
      
      return {
        id: row.id,
        // 保留原始日期供排序用
        rawDate: row.record_date,
        // 格式化日期供圖表顯示 (MM/DD)
        date: dateObj.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
        
        // --- 欄位對應修正 ---
        systolic: row.systolic_bp,        // 對應 DB: systolic_bp
        diastolic: row.diastolic_bp,      // 對應 DB: diastolic_bp
        bloodSugar: row.blood_sugar,      // 對應 DB: blood_sugar
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

// 儲存新紀錄 (保持不變，但為完整性一併提供)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userId, recordDate,
      systolic, diastolic, 
      bloodSugar, bloodSugarType, 
      totalCholesterol, hdl, ldl, triglycerides, 
      weight 
    } = body;

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const dateToSave = recordDate || new Date().toISOString().split('T')[0];

    const sql = `
      INSERT INTO health_records (
        user_id, record_date, 
        systolic_bp, diastolic_bp, 
        blood_sugar, blood_sugar_type,
        total_cholesterol, hdl_cholesterol, ldl_cholesterol, triglycerides,
        weight
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const v = (val: any) => (val === "" || val === undefined ? null : val);

    const values = [
      userId, dateToSave,
      v(systolic), v(diastolic), 
      v(bloodSugar), v(bloodSugarType), 
      v(totalCholesterol), v(hdl), v(ldl), v(triglycerides), 
      v(weight)
    ];

    await pool.query(sql, values);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save Record Error:', error);
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}