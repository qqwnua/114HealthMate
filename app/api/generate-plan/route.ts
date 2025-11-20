// app/api/generate-plan/route.ts

import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// 1. 從 .env.local 讀取 Groq API Key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 2. AI 的系統提示 (System Prompt)
const SYSTEM_PROMPT = '您是一位專業的 AI 健康管理師。\n' +
  '您的任務是根據用戶提供的健康數據和目標，生成一份個人化的健康計畫和每日排程建議。\n' +
  '您必須嚴格依照以下的 JSON 格式回傳，不要包含 "```json" 標記：\n' +
  '{\n' +
  '  "plan": [\n' +
  '    "一個具體且可行的建議 (string)，請使用 **Markdown** 格式化重點。",\n' +
  '    "第二個建議 (string)...",\n' +
  '    "第三個建議 (string)..."\n' +
  '  ],\n' +
  '  "schedule": [\n' +
  '    { "time": "HH:mm", "task": "排程的任務 (string)" },\n' +
  '    { "time": "HH:mm", "task": "排程的任務 (string)" }\n' +
  '  ],\n' +
  '  "disclaimer": "一個標準的免責聲明 (string)。"\n' +
  '}';

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