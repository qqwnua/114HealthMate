import { NextResponse } from 'next/server';
import { pool } from "@/lib/db"; 

interface PlanRequestBody {
  userId: number; 
  userGoal: string;
  generatedPlan: {
    plan: string[];
    schedule: { time: string; task: string }[];
    disclaimer: string;
  };
}

export async function POST(req: Request) {
  const client = await pool.connect();
  
  try {
    const body: PlanRequestBody = await req.json();
    const { userId, userGoal, generatedPlan } = body;
    const { plan, schedule, disclaimer } = generatedPlan;

    if (!userId) {
      return NextResponse.json({ error: '儲存失敗：缺少 userId' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. 儲存計畫
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
      JSON.stringify(plan),
      disclaimer,
    ]);

    const newPlanId = planRes.rows[0].id;

    // 2. 儲存提醒
    const today = new Date().toISOString().split('T')[0]; 
    
    for (const item of schedule) {
      // ⚠️ 修改處：移除了 notification_enabled, repeat, advance
      // 只保留最基本的欄位，確保資料庫一定能寫入
      const reminderQuery = `
        INSERT INTO "public"."reminders"
          (user_id, plan_id, title, description, due_date, due_time, completed, created_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, NOW());
      `;
      
      const values = [
        userId,       // $1
        newPlanId,    // $2
        item.task,    // $3
        null,         // $4 description
        today,        // $5
        item.time,    // $6
        false,        // $7 completed
      ];
      
      await client.query(reminderQuery, values);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: '計畫和提醒已成功儲存',
      newPlanId: newPlanId,
      remindersAdded: schedule.length,
    });

  } catch (error) {
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
    client.release();
  }
}