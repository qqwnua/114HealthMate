import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1", 
});

export async function POST(request: Request) {
  try {
    const { records, profile } = await request.json();

    console.log("AI Analysis Request Received:", { 
      recordCount: records.length, 
      latestBP: records[records.length-1]?.systolic 
    });

    // 資料清洗與預處理
    const safeProfile = {
      age: profile.age || "未知",
      gender: profile.gender || "未知",
      smoking: profile.smoking || "未知",
      alcohol: profile.alcohol || "未知",
      exercise: profile.exercise || "未知",
      medicalHistory: profile.medicalHistory || "無",
      medications: profile.medications || "無"
    };

    // 構建 Context
    const dataContext = JSON.stringify({
      userProfile: safeProfile,
      recentHealthRecords: records.slice(-7) // 傳送最近 7 筆
    });

    // --- 針對「只有血壓」也能分析的強力 Prompt ---
    const systemPrompt = `
      You are a strict medical AI analyst.
      
      【CRITICAL: PARTIAL DATA HANDLING】
      The user may ONLY have Blood Pressure (systolic/diastolic) data.
      1. IF BP data exists: You **MUST** assess Hypertension Risk, Stroke Risk, and Trend Analysis. **DO NOT** say "Insufficient data" for these specific fields.
      2. IF BP is trending up (e.g., 130 -> 135 -> 145): You **MUST** explicitly state "Blood pressure is rising" in the trend analysis.
      3. IF other data (Lipids/Sugar) is missing: Mark those specific risks as "未評估" (Unassessed), but **Complete the rest**.

      【Risk Rules】
      - Hypertension: Systolic > 140 is "高風險".
      - Stroke: High BP + Diabetes History = "高風險". If only High BP, "中高風險".
      - Metabolic: Requires at least 3 indicators. If missing data, result is "未評估".

      【RESPONSE JSON FORMAT】
      Return ONLY valid JSON. No markdown.
      {
        "riskLevel": "高風險" | "中風險" | "低風險",
        "summary": "Summary in Traditional Chinese. Be direct. E.g., '血壓持續上升，已達高血壓標準'.",
        "metabolicRisk": { "status": boolean, "detail": "Reason or '資料不足'" },
        "framinghamRisk": { "percentage": "e.g. --%", "level": "未評估" },
        "strokeRisk": { "level": "高風險/中風險/低風險/未評估", "detail": "Reason" },
        "diabetesRisk": { "level": "高風險/中風險/低風險/未評估", "detail": "Reason" },
        "hypertensionRisk": { "level": "高風險/中風險/低風險/未評估", "detail": "Reason" },
        "trendAnalysis": "Specific trend analysis in Traditional Chinese. Mention the numbers (e.g., '從 130 上升至 145').",
        "suggestions": [
           "Suggestion 1 (Must be specific to the data)",
           "Suggestion 2",
           "Suggestion 3"
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze these records: ${dataContext}` }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.1, // 極低溫度，強迫它聽話
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from AI");
    
    const analysisResult = JSON.parse(content);
    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('AI Analysis Error:', error);
    // 回傳錯誤時的備用資料，方便除錯
    return NextResponse.json({
      riskLevel: "未評估",
      summary: "系統分析發生錯誤，請檢查後端日誌。",
      metabolicRisk: { status: false, detail: "分析失敗" },
      framinghamRisk: { percentage: "--", level: "未評估" },
      strokeRisk: { level: "未評估", detail: "--" },
      diabetesRisk: { level: "未評估", detail: "--" },
      hypertensionRisk: { level: "未評估", detail: "--" },
      trendAnalysis: "無法連接 AI 服務。",
      suggestions: ["請稍後再試"]
    });
  }
}