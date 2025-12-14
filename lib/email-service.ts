// /lib/email-service.ts

import nodemailer from 'nodemailer';

// --- 介面定義 (與資料庫欄位同步) ---
// 根據您最新的資料庫結構，補全 Reminder 介面
interface Reminder {
  id: number;
  user_id: number;
  plan_id: number | null;
  title: string;
  description: string | null;
  due_date: string; // 格式: YYYY-MM-DD
  due_time: string; // 格式: HH:MM:SS
  completed: boolean;
  notification_enabled: boolean;
  repeat: string;
  advance: string;
  created_at: Date;
  // ⚠️ 這是您在 DB 中新增的欄位
  is_email_sent: boolean; 
}

// --- Nodemailer Transport 設定 ---
const transporter = nodemailer.createTransport({
  // 建議使用 'smtp.gmail.com' 和 port 465 搭配 secure: true，
  // 服務名稱 'Gmail' 僅為簡寫，但直接使用 SMTP 設定更穩定。
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 這是您的應用程式密碼
  },
});

/**
 * 寄送單個提醒的 Email
 * @param recipient - 接收者的 Email 地址 (從 users 表取得)
 * @param reminder - 提醒物件 (從 reminders 表取得)
 * @returns {Promise<boolean>} - 如果成功發送，返回 true
 */
export async function sendReminderEmail(recipient: string, reminder: Reminder): Promise<boolean> {
  // 1. 環境變數檢查 (防止配置不全時運行)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[Nodemailer Setup Error] Missing EMAIL_USER or EMAIL_PASS in environment variables.");
    throw new Error("Email service not configured.");
  }

  // 2. 寄送 Email
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `【健康提醒】${reminder.title} - 預計時間: ${reminder.due_date} ${reminder.due_time}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #047857; max-width: 600px; margin: auto; border-radius: 8px;">
            <h2 style="color: #047857;">🔔 您的健康計畫提醒</h2>
            <h3 style="color: #1f2937;">${reminder.title}</h3>
            <p><strong>日期:</strong> ${reminder.due_date}</p>
            <p><strong>時間:</strong> ${reminder.due_time}</p>
            ${reminder.description ? `<p><strong>備註:</strong> ${reminder.description}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
            <p style="font-size: 14px; color: #6b7280;">提醒您別忘了今日的健康計畫。保持健康！</p>
        </div>
      `,
    });

    console.log(`[Nodemailer Success] Email sent to ${recipient}. Message ID: ${info.messageId}`);
    return true; // 成功寄出
    
  } catch (error) {
    // 3. 錯誤處理與日誌輸出
    console.error(`[Nodemailer Error] Failed to send Email to ${recipient} (Reminder ID: ${reminder.id}).`);
    
    // 輸出原始錯誤物件，這將包含 SMTP 狀態碼或連線細節
    // ⚠️ 這是您需要從終端機複製的關鍵訊息
    console.error(error); 
    
    // 拋出錯誤，讓上層的批次路由知道這次寄送失敗，從而跳過 is_email_sent 的更新
    throw new Error("Email sending failed"); 
  }
}