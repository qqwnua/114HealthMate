import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1", 
});

export async function POST(request: Request) {
  try {
    const { records, profile } = await request.json();

    console.log("AI 收到資料筆數:", records.length); // 確認一下後端真的有收到多筆資料

    // 資料清洗與預處理 (維持不變)
    const safeProfile = {
      age: profile.age || "未知",
      gender: profile.gender || "未知",
      smoking: profile.smoking || "未知",
      alcohol: profile.alcohol || "未知",
      exercise: profile.exercise || "未知",
      medicalHistory: profile.medicalHistory || "無",
      medications: profile.medications || "無"
    };

    const dataContext = JSON.stringify({
      userProfile: safeProfile,
      recentHealthRecords: records.slice(-7) // 傳送最近 7 筆
    });

    // --- 【修正重點】全能型 AI 醫生指令 ---
    const systemPrompt = `
      You are an experienced family physician AI. Your task is to analyze the user's health records comprehensively.

      【DATA CONTEXT】
      You will receive:
      1. User Profile (Age, habits, history)
      2. Recent Health Records (May contain: Blood Pressure, Blood Sugar, Lipids, Weight)

      【ANALYSIS RULES】
      1. **SCAN ALL METRICS**: Do NOT focus only on Blood Pressure. You MUST check for Blood Sugar (Glucose), Lipids (Cholesterol/Triglycerides), and Weight in the records.
      
      2. **TREND LOGIC**:
         - If values are increasing: "呈上升趨勢"
         - If values are decreasing: "呈下降趨勢"
         - If values are stable (e.g., 145 -> 145): "數值持平 (Stable)"
         - If only 1 record exists: "目前僅有一筆資料，持續觀察中"
         - **NEVER** say "Rising from X to X" if the numbers are the same.

      3. **RISK ASSESSMENT (Strict Criteria)**:
         - **Hypertension**: Sys > 140 or Dia > 90 is "High Risk".
         - **Diabetes**: Fasting Sugar > 126 or Random > 200 is "High Risk".
         - **Dyslipidemia**: LDL > 130 or Triglycerides > 150 is "Risk".
         - **Metabolic Syndrome**: Assess if user has 3+ risk factors (High BP, High Sugar, High TG, Low HDL, Obesity).

      【RESPONSE JSON FORMAT】(Return ONLY raw JSON, no markdown)
      {
        "riskLevel": "高風險" | "中風險" | "低風險",
        "summary": "Comprehensive summary in Traditional Chinese. Mention BP, Sugar, and Lipids status explicitly. E.g., '血壓偏高且呈現上升趨勢，血糖與血脂目前控制在正常範圍...'",
        
        "metabolicRisk": { 
            "status": true/false, 
            "detail": "Explain why (e.g., '已符合高血壓與高血糖兩項指標...')" 
        },
        
        "strokeRisk": { "level": "Grade", "detail": "Explain based on BP and Profile" },
        "diabetesRisk": { "level": "Grade", "detail": "Analyze Blood Sugar trends" },
        "hypertensionRisk": { "level": "Grade", "detail": "Analyze BP trends" },
        
        "trendAnalysis": "Detailed trend text in Traditional Chinese. Separate by metric. E.g., '【血壓】從 130 上升至 145... 【血糖】維持在 100 上下... 【體重】持平...'",
        
        "suggestions": [
           "Actionable advice 1 (Diet/Exercise)",
           "Actionable advice 2 (Medical)",
           "Actionable advice 3 (Lifestyle)"
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", // 或你原本使用的模型
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze these records: ${dataContext}` }
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.2, 
      max_tokens: 1500,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from AI");
    
    const analysisResult = JSON.parse(content);
    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({
      // 錯誤時的回傳 (保持不變)
      riskLevel: "未評估",
      summary: "AI 分析暫時無法使用，請稍後再試。",
      // ... 其他欄位
      suggestions: ["請檢查網路連線"]
    });
  }
}