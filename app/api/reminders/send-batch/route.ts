// /api/reminders/send-batch/route.ts
import { NextResponse } from 'next/server';
import { pool } from "@/lib/db"; 
import { sendReminderEmail } from '@/lib/email-service'; 

// 輔助函式：取得今日日期 (YYYY-MM-DD 格式)
const getTodayDateString = () => {
    const today = new Date();
    // 確保日期是本地的「今天」
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}

// 輔助函式：根據 userId 取得使用者 Email
const getUserEmail = async (userId: string): Promise<string | null> => {
    const client = await pool.connect();
    try {
        // ⚠️ 假設您有一個 'users' 表格，包含 'id' 和 'email' 欄位
        const result = await client.query('SELECT email FROM "public"."users" WHERE id = $1', [userId]);
        return result.rows.length > 0 ? result.rows[0].email : null;
    } catch (e) {
        console.error("Failed to fetch user email:", e);
        return null;
    } finally {
        client.release();
    }
}


export async function POST(req: Request) {
    const client = await pool.connect();
    let emailSentCount = 0;
    
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
        }
        
        const todayStr = getTodayDateString();

        // 1. 查詢今日未完成、開啟通知、且 Email 尚未發送的提醒
        const selectQuery = `
            SELECT * FROM "public"."reminders" 
            WHERE user_id = $1 
            AND due_date = $2 
            AND completed = FALSE 
            AND is_email_sent = FALSE;
        `;
        const result = await client.query(selectQuery, [userId, todayStr]);
        const remindersToSend = result.rows;

        if (remindersToSend.length === 0) {
            return NextResponse.json({ 
                message: "今日無待發送的 Email 提醒。", 
                count: 0 
            });
        }
        
        // 2. 取得收件人 Email
        const userEmail = await getUserEmail(userId);
        if (!userEmail) {
            return NextResponse.json({ error: "找不到該使用者的 Email，無法發送" }, { status: 404 });
        }


        // 3. 批次發送 Email 並更新狀態
        await client.query('BEGIN');
        
        for (const reminder of remindersToSend) {
            try {
                // 寄送 Email
                await sendReminderEmail(userEmail, reminder); 
                
                // 更新 is_email_sent 狀態，標記為已發送
                const updateQuery = `
                    UPDATE "public"."reminders" 
                    SET is_email_sent = TRUE 
                    WHERE id = $1;
                `;
                await client.query(updateQuery, [reminder.id]);
                emailSentCount++;

            } catch (emailError) {
                // 記錄失敗但繼續執行下一個
                console.warn(`寄送 Email 失敗 (ID: ${reminder.id})，跳過並繼續下一個。`);
            }
        }
        
        await client.query('COMMIT');
        
        return NextResponse.json({ 
            message: `成功發送 ${emailSentCount} 個 Email 提醒。`, 
            count: emailSentCount 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[API /send-batch POST] Error:', error);
        return NextResponse.json({ error: '批次發送失敗', details: error instanceof Error ? error.message : "未知錯誤" }, { status: 500 });
    } finally {
        client.release();
    }
}