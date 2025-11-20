import { NextResponse } from 'next/server';
// [已修改] 使用您現有的資料庫連線
import { pool } from "@/lib/db"; 

// --- TypeScript 類型定義 ---
// 這是從前端 body 接收的資料結構
interface PlanRequestBody {
  userId: number; // 我們現在期望從 body 接收 userId
  userGoal: string;
  generatedPlan: {
    plan: string[];
    schedule: { time: string; task: string }[];
    disclaimer: string;
  };
}

export async function POST(req: Request) {
  // 取得資料庫連線
  const client = await pool.connect();
  
  try {
    // 1. 從前端取得資料
    const body: PlanRequestBody = await req.json();
    const { userId, userGoal, generatedPlan } = body;
    const { plan, schedule, disclaimer } = generatedPlan;

    // 2. 驗證 userId
    if (!userId) {
      return NextResponse.json({ error: '儲存失敗：缺少 userId' }, { status: 400 });
    }

    // 3. 開始 SQL 交易 (Transaction)
    await client.query('BEGIN');

    // 4. 步驟 A: 將 AI 生成的「計畫」存入 'health_plans' 表
    const planQuery = `
      INSERT INTO "public"."health_plans"
        (user_id, user_goal, plan_details, disclaimer, created_at)
      VALUES
        ($1, $2, $3, $4, NOW())
      RETURNING id;
    `;
    const planRes = await client.query(planQuery, [
      userId,
      userGoal,
      JSON.stringify(plan), // 將 plan 陣列轉為 JSONB 格式
      disclaimer,
    ]);

    const newPlanId = planRes.rows[0].id; // 取得新建立的計畫 ID

    // 5. 步驟 B: 遍歷 AI 生成的「排程」，存入 'reminders' 表
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // 準備一個批次插入
    for (const item of schedule) {
      const reminderQuery = `
        INSERT INTO "public"."reminders"
          (user_id, plan_id, title, description, due_date, due_time, completed, notification_enabled, "repeat", advance, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW());
      `;
      // 欄位名稱要與您的資料庫完全一致 (due_date, due_time)
      const values = [
        userId,       // user_id
        newPlanId,    // plan_id (連結到剛剛建立的計畫)
        item.task,    // title (來自 AI 的任務)
        null,         // description (AI 沒提供，預設為 null)
        today,        // due_date (AI 沒提供，預設為今天，使用者可稍後修改)
        item.time,    // due_time
        false,        // completed
        true,         // notification_enabled
        'none',       // repeat
        'none',       // advance
      ];
      
      await client.query(reminderQuery, values);
    }

    // 6. 提交交易 (Commit)
    await client.query('COMMIT');

    // 7. 回傳成功訊息
    return NextResponse.json({
      success: true,
      message: '計畫和提醒已成功儲存',
      newPlanId: newPlanId,
      remindersAdded: schedule.length,
    });

  } catch (error) {
    // 8. 如果發生任何錯誤，執行 Rollback
    await client.query('ROLLBACK');
    
    let errorMessage = '儲存計畫時發生未知錯誤';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('[API /save-plan] Error:', errorMessage);

    return NextResponse.json(
      { error: '儲存計畫失敗', details: errorMessage },
      { status: 500 }
    );

  } finally {
    // 9. 無論成功或失敗，最後都要釋放資料庫連線
    client.release();
  }
}