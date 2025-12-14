import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// --- 輔助函式：安全取得數值 (支援多種欄位命名) ---
function getValue(record: any, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return Number(record[key]);
    }
  }
  return null;
}

// --- 新增：風險等級判斷函式 ---
function getRiskLevel(percentage: number) {
  if (percentage < 10) return "低風險";
  if (percentage < 20) return "中風險";
  return "高風險";
}

// --- Framingham 計算核心 ---
function calculateFramingham(profile: any, record: any) {
  // 1. 嘗試取得關鍵數值
  const chol = getValue(record, ['total_cholesterol', 'totalCholesterol', 'tc']);
  const hdl = getValue(record, ['hdl_cholesterol', 'hdl', 'hdlC']);
  const sbp = getValue(record, ['systolic_bp', 'systolic', 'sbp']);
  
  // 如果缺任何一項，直接返回 null
  if (chol === null || hdl === null || sbp === null) {
      console.log("Framingham 計算失敗: 缺數據", { chol, hdl, sbp });
      return null;
  }

  const age = Number(profile.age);
  const gender = (profile.gender || '').toLowerCase(); 
  
  // 2. 判斷是否吸菸
  const smokingInput = profile.smoking || profile.smoking_status;
  const isSmoker = smokingInput === true || smokingInput === 'true' || smokingInput === 'yes' || smokingInput === '1';

  // 3. 判斷是否服用高血壓藥物
  const meds = (profile.medications || "").toString();
  const isTreated = meds.includes("血壓") || meds.includes("hypertension") || meds.includes("BP");

  console.log("計算參數:", { isSmoker, isTreated, gender, age, chol, hdl, sbp });

  let points = 0;

  // --- 開始計分 ---
  if (gender === 'male' || gender === 'm') {
    // 男性
    if (age <= 34) points += -9;
    else if (age <= 39) points += -4;
    else if (age <= 44) points += 0;
    else if (age <= 49) points += 3;
    else if (age <= 54) points += 6;
    else if (age <= 59) points += 8;
    else if (age <= 64) points += 10;
    else if (age <= 69) points += 11;
    else if (age <= 74) points += 12;
    else points += 13;

    // 膽固醇
    if (chol < 160) points += 0;
    else if (chol <= 199) points += 4;
    else if (chol <= 239) points += 7;
    else if (chol <= 279) points += 9;
    else points += 11;

    // 吸菸
    if (isSmoker) {
      if (age <= 39) points += 8;
      else if (age <= 49) points += 5;
      else if (age <= 59) points += 3;
      else points += 1;
    }

    // HDL
    if (hdl >= 60) points += -1;
    else if (hdl >= 50) points += 0;
    else if (hdl >= 40) points += 1;
    else points += 2;

    // 收縮壓
    if (isTreated) {
        if (sbp < 120) points += 0;
        else if (sbp <= 129) points += 1;
        else if (sbp <= 139) points += 2;
        else points += 3; 
    } else {
        if (sbp < 120) points += 0;
        else if (sbp <= 129) points += 0;
        else if (sbp <= 139) points += 1;
        else if (sbp <= 159) points += 1;
        else points += 2;
    }

    // 風險轉換 (男性)
    if (points <= 0) return 1;
    else if (points <= 4) return 1;
    else if (points <= 6) return 2;
    else if (points === 7) return 3;
    else if (points === 8) return 4;
    else if (points === 9) return 5;
    else if (points === 10) return 6;
    else if (points === 11) return 8;
    else if (points === 12) return 10;
    else if (points === 13) return 12;
    else if (points === 14) return 16;
    else if (points === 15) return 20;
    else return 25;

  } else {
    // 女性
    if (age <= 34) points += -7;
    else if (age <= 39) points += -3;
    else if (age <= 44) points += 0;
    else if (age <= 49) points += 3;
    else if (age <= 54) points += 6;
    else if (age <= 59) points += 8;
    else if (age <= 64) points += 10;
    else if (age <= 69) points += 12;
    else if (age <= 74) points += 14;
    else points += 16;

    // 膽固醇
    if (chol < 160) points += 0;
    else if (chol <= 199) points += 4;
    else if (chol <= 239) points += 8;
    else if (chol <= 279) points += 11;
    else points += 13;

    // 吸菸
    if (isSmoker) {
      if (age <= 39) points += 9;
      else if (age <= 49) points += 7;
      else if (age <= 59) points += 4;
      else points += 2;
    }

    // HDL
    if (hdl >= 60) points += -1;
    else if (hdl >= 50) points += 0;
    else if (hdl >= 40) points += 1;
    else points += 2;

    // 收縮壓
    if (isTreated) {
        if (sbp < 120) points += 0;
        else if (sbp <= 129) points += 3;
        else if (sbp <= 139) points += 4;
        else points += 5; 
    } else {
        if (sbp < 120) points += 0;
        else if (sbp <= 129) points += 1;
        else if (sbp <= 139) points += 2;
        else if (sbp <= 159) points += 3;
        else points += 4;
    }

    // 風險轉換 (女性)
    if (points <= 9) return 1;
    else if (points <= 12) return 1;
    else if (points <= 14) return 2;
    else if (points === 15) return 3;
    else if (points === 16) return 4;
    else if (points === 17) return 5;
    else if (points === 18) return 6;
    else if (points === 19) return 8;
    else if (points === 20) return 11;
    else if (points === 21) return 14;
    else if (points === 22) return 17;
    else if (points === 23) return 22;
    else if (points === 24) return 27;
    else return 30;
  }
}

export async function POST(request: Request) {
  try {
    const { records, profile } = await request.json();
    console.log("AI 收到 Profile:", profile);

    // 1. 尋找最新有效資料 (從最後一筆往回找)
    let latestValidRecord = null;
    
    for (let i = records.length - 1; i >= 0; i--) {
        const r = records[i];
        if (getValue(r, ['total_cholesterol', 'totalCholesterol']) !== null &&
            getValue(r, ['hdl_cholesterol', 'hdl']) !== null &&
            getValue(r, ['systolic_bp', 'systolic']) !== null) {
            latestValidRecord = r;
            break; 
        }
    }

    // 2. 計算分數
    let framinghamScore = null;
    let framinghamNote = "資料不足 (需總膽固醇、HDL、血壓)";

    if (latestValidRecord) {
        console.log("找到有效紀錄:", latestValidRecord);
        const score = calculateFramingham(profile, latestValidRecord);
        if (score !== null) {
            framinghamScore = score;
            framinghamNote = `${score}% (基於 ${latestValidRecord.record_date || latestValidRecord.date || '最新'} 的數據)`;
        }
    } else {
        console.log("未找到包含完整三項數據的紀錄");
    }

    const safeProfile = {
      age: profile.age || "未知",
      gender: profile.gender || "未知",
      smoking: profile.smoking || profile.smoking_status || "未知",
      alcohol: profile.alcohol || profile.alcohol_consumption || "未知",
      exercise: profile.exercise || profile.exercise_frequency || "未知",
      medicalHistory: profile.medicalHistory || profile.medical_history || "無",
      medications: profile.medications || "無"
    };

    const dataContext = JSON.stringify({
      userProfile: safeProfile,
      recentHealthRecords: records.slice(-7),
      calculatedFraminghamRisk: framinghamNote 
    });

    const systemPrompt = `
      You are an experienced family physician AI. Analyze the user's health records.
      
      【DATA CONTEXT】
      - Framingham Risk Score: ${framinghamNote}
      (If a score exists, you MUST present it clearly.)

      【ANALYSIS RULES】
      - Hypertension: Sys > 140 or Dia > 90
      - Diabetes: Fasting > 126
      - Dyslipidemia: LDL > 130 or Triglycerides > 150
      
      【RESPONSE JSON FORMAT】
      {
        "riskLevel": "高風險" | "中風險" | "低風險",
        "summary": "Summary in Traditional Chinese...",
        "framinghamRisk": "${framinghamScore !== null ? framinghamScore + '%' : '未評估'}", 
        "metabolicRisk": { "status": boolean, "detail": "string" },
        "strokeRisk": { "level": "string", "detail": "string" },
        "diabetesRisk": { "level": "string", "detail": "string" },
        "hypertensionRisk": { "level": "string", "detail": "string" },
        "trendAnalysis": "string",
        "suggestions": ["string"]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
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
    
    // 【修正重點】回傳物件結構以配合前端介面
    if (framinghamScore !== null) {
        analysisResult.framinghamRisk = {
            percentage: `${framinghamScore}%`,
            level: getRiskLevel(framinghamScore)
        };
    } else {
        // 如果沒算出來，也回傳物件結構，避免前端報錯
        analysisResult.framinghamRisk = {
            percentage: "--",
            level: "未評估"
        };
    }

    return NextResponse.json(analysisResult);

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({
      riskLevel: "未評估",
      summary: "AI 分析暫時無法使用，請稍後再試。",
      suggestions: ["請檢查網路連線"],
      framinghamRisk: { percentage: "--", level: "系統忙碌" }
    });
  }
}