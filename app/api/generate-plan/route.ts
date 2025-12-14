// app/api/generate-plan/route.ts

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// 1. 從 .env.local 讀取 Groq API Key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 2. AI 的系統提示 (System Prompt)
const SYSTEM_PROMPT = `
  您是一位專業的 AI 健康管理師。
  您的任務是根據用戶提供的健康數據和目標，生成一份個人化的健康計畫和每日排程建議。

  請嚴格遵守以下規則：
  1. 回傳格式必須是 JSON。
  2. JSON 內不要包含 "\`\`\`json" 或其他標記。
  3. "plan" 陣列中的每一項建議，必須嚴格遵守此格式： "**標題**：內容"。
    - 範例： "**飲食控制**：減少高鹽食物的攝取，多吃深色蔬菜。"
    - 注意：請務必在冒號前的標題加上雙星號 (**)，不要在字串開頭加上數字編號 (如 1. 2.)。

  JSON 結構如下：
  {
    "plan": [
      "**建議標題**：具體的建議內容...",
      "**建議標題**：具體的建議內容...",
      "**建議標題**：具體的建議內容..."
    ],
    "schedule": [
      { "time": "08:00", "task": "早餐：燕麥片加堅果" },
      { "time": "12:00", "task": "午餐：雞胸肉沙拉" }
    ],
    "disclaimer": "本計畫僅供參考，請諮詢專業醫師..."
  }
  `;

export async function POST(req: Request) {
  try {
    // 3. [已修改] 解析從前端傳來的資料
    // 我們現在直接接收 healthData (由前端整理好的真實數據) 和 userGoal
    const { healthData, userGoal } = await req.json();

    // 檢查必要欄位
    if (!healthData || !userGoal) {
      return NextResponse.json(
        { error: 'Missing healthData or userGoal' },
        { status: 400 }
      );
    }

    // 4. 組合給 AI 的使用者提示
    const userPrompt = '[用戶健康數據]:\n' +
      JSON.stringify(healthData, null, 2) + '\n\n' +
      '[用戶目標]:\n' +
      '"' + userGoal + '"' + '\n\n' +
      '請根據以上數據和目標，生成一份個人化健康計畫。';

    // 5. 呼叫 Groq API (使用 Llama 3.1 8B)
    const chatCompletion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' }, // 開啟 JSON 模式
      temperature: 0.7,
      max_tokens: 3000,
    });

    // 6. 取得 AI 回傳的 JSON 字串並解析
    const responseJson = JSON.parse(
      chatCompletion.choices[0].message.content || '{}'
    );

    // 7. 將解析後的 JSON 物件回傳給前端
    return NextResponse.json(responseJson);

  } catch (error) {
    console.error('[API /generate-plan] Error:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: 'Failed to generate health plan', details: errorMessage },
      { status: 500 }
    );
  }
}