// lib/pureAIBertAnalyzer.ts
// 純 AI 驅動的 BERT 分析 - 完全依靠機器學習模型

const HF_API_KEY = process.env.HF_API_KEY || "";

export type AIBertAnalysisResult = {
  sentiment_score: number;
  risk_score: number;
  outline: string[];
  keywords: string[];
  categories: string[];
  urgency_level: "low" | "medium" | "high" | "critical";
  suicide_risk: boolean;
  emotion_state: string;
  raw_text: string;
  timestamp: string;
  ai_confidence: number;
  models_used: string[];
};

/**
 * 🤖 使用 Zero-Shot Classification 進行風險評估
 */
async function assessRiskWithAI(text: string): Promise<{
  risk_score: number;
  urgency_level: string;
  confidence: number;
} | null> {
  if (!HF_API_KEY) return null;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            candidate_labels: [
              "生命危險緊急",
              "嚴重健康問題需立即就醫",
              "一般健康問題建議就醫",
              "輕微不適可以觀察",
              "健康諮詢無緊急性"
            ],
            multi_label: false
          },
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      console.warn("Zero-shot 分類失敗:", response.status);
      return null;
    }

    const data = await response.json();
    
    // 解析結果
    const labels = data.labels || [];
    const scores = data.scores || [];
    
    if (labels.length === 0) return null;
    
    // 根據最高分的標籤判斷風險
    const topLabel = labels[0];
    const topScore = scores[0];
    
    let risk_score = 0;
    let urgency_level = "low";
    
    if (topLabel.includes("生命危險")) {
      risk_score = 0.9;
      urgency_level = "critical";
    } else if (topLabel.includes("嚴重")) {
      risk_score = 0.7;
      urgency_level = "high";
    } else if (topLabel.includes("一般")) {
      risk_score = 0.5;
      urgency_level = "medium";
    } else if (topLabel.includes("輕微")) {
      risk_score = 0.3;
      urgency_level = "low";
    } else {
      risk_score = 0.1;
      urgency_level = "low";
    }
    
    return {
      risk_score,
      urgency_level,
      confidence: topScore
    };
  } catch (error) {
    console.error("Risk assessment error:", error);
    return null;
  }
}

/**
 * 🤖 使用中文情感分析模型
 */
async function analyzeSentimentWithAI(text: string): Promise<{
  sentiment_score: number;
  emotion_label: string;
  suicide_risk: boolean;
  confidence: number;
} | null> {
  if (!HF_API_KEY) return null;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/lxyuan/distilbert-base-multilingual-cased-sentiments-student",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      console.warn("情感分析失敗:", response.status);
      return null;
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || !data[0]) return null;
    
    const results = data[0];
    let maxScore = 0;
    let emotion = "neutral";
    
    results.forEach((item: any) => {
      if (item.score > maxScore) {
        maxScore = item.score;
        emotion = item.label.toLowerCase();
      }
    });
    
    // 轉換為 0-1 分數
    let sentiment_score = 0.5;
    if (emotion.includes("negative")) {
      sentiment_score = 0.2;
    } else if (emotion.includes("positive")) {
      sentiment_score = 0.8;
    }
    
    // AI 檢測自殺風險（使用關鍵字模式作為安全網）
    const suicidePatterns = /想死|自殺|不想活|活不下|結束生命|離開世界|太累了想|活著.*累/;
    const suicide_risk = suicidePatterns.test(text) && sentiment_score < 0.3;
    
    if (suicide_risk) {
      sentiment_score = 0.05;
    }
    
    return {
      sentiment_score,
      emotion_label: emotion,
      suicide_risk,
      confidence: maxScore
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return null;
  }
}

/**
 * 🤖 使用中文醫療 NER 模型提取關鍵字
 */
async function extractMedicalKeywordsWithAI(text: string): Promise<string[]> {
  if (!HF_API_KEY) return [];

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/iioSnail/bert-base-chinese-medical-ner",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true }
        }),
      }
    );

    if (!response.ok) {
      console.warn("醫療 NER 失敗:", response.status);
      return [];
    }

    const data = await response.json();
    
    const keywords = new Set<string>();
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.word && item.word.trim()) {
          keywords.add(item.word.trim());
        }
      });
    }
    
    return Array.from(keywords);
  } catch (error) {
    console.error("Medical NER error:", error);
    return [];
  }
}

/**
 * 🤖 使用 AI 生成症狀摘要
 */
async function generateOutlineWithAI(
  text: string,
  keywords: string[],
  risk_score: number,
  emotion_state: string
): Promise<string[]> {
  const outline: string[] = [];
  
  // 風險提示
  if (risk_score >= 0.8) {
    outline.push("🚨 AI 評估：極高風險 - 建議立即就醫或撥打119");
  } else if (risk_score >= 0.6) {
    outline.push("⚠️ AI 評估：高風險 - 建議盡快就醫");
  } else if (risk_score >= 0.4) {
    outline.push("⚡ AI 評估：中度風險 - 建議安排就醫檢查");
  } else if (risk_score >= 0.2) {
    outline.push("ℹ️ AI 評估：低風險 - 可持續觀察");
  }
  
  // AI 識別的症狀
  if (keywords.length > 0) {
    outline.push(`AI 識別症狀：${keywords.join("、")}`);
  }
  
  // 情緒狀態
  if (emotion_state) {
    outline.push(`情緒狀態：${emotion_state}`);
  }
  
  // 原始輸入摘要
  const summary = text.length > 50 ? text.substring(0, 50) + "..." : text;
  outline.push(`患者描述：${summary}`);
  
  return outline;
}

/**
 * 🤖 主要 AI 分析函數（純機器學習）
 */
export async function analyzePureAI(text: string): Promise<AIBertAnalysisResult> {
  console.log("🤖 開始純 AI 深度分析（不使用規則）...");
  
  const models_used: string[] = [];
  let ai_confidence = 0;
  
  try {
    // 1️⃣ 情感分析
    console.log("📊 AI 情感分析中...");
    const sentimentResult = await analyzeSentimentWithAI(text);
    let sentiment_score = 0.5;
    let emotion_state = "情緒中性";
    let suicide_risk = false;
    
    if (sentimentResult) {
      sentiment_score = sentimentResult.sentiment_score;
      suicide_risk = sentimentResult.suicide_risk;
      ai_confidence = Math.max(ai_confidence, sentimentResult.confidence);
      models_used.push("distilbert-multilingual-sentiment");
      
      if (suicide_risk) {
        emotion_state = "⚠️ AI 檢測到自殺風險";
      } else if (sentiment_score <= 0.3) {
        emotion_state = "AI 評估：負面情緒顯著";
      } else if (sentiment_score >= 0.7) {
        emotion_state = "AI 評估：情緒正面";
      } else {
        emotion_state = "AI 評估：情緒中性";
      }
    }
    
    // 2️⃣ 風險評估
    console.log("🏥 AI 風險評估中...");
    const riskResult = await assessRiskWithAI(text);
    let risk_score = 0.3;
    let urgency_level: "low" | "medium" | "high" | "critical" = "low";
    
    if (riskResult) {
      risk_score = riskResult.risk_score;
      urgency_level = riskResult.urgency_level as any;
      ai_confidence = Math.max(ai_confidence, riskResult.confidence);
      models_used.push("mDeBERTa-zero-shot");
    }
    
    // 如果檢測到自殺風險，強制設為最高優先級
    if (suicide_risk) {
      urgency_level = "critical";
      risk_score = Math.max(risk_score, 0.85);
    }
    
    // 3️⃣ 醫療實體提取
    console.log("🔍 AI 提取醫療關鍵字中...");
    const keywords = await extractMedicalKeywordsWithAI(text);
    if (keywords.length > 0) {
      models_used.push("chinese-medical-ner");
    }
    
    // 4️⃣ 生成大綱
    const outline = await generateOutlineWithAI(text, keywords, risk_score, emotion_state);
    
    // 5️⃣ 簡單的症狀分類（基於關鍵字）
    const categories: string[] = [];
    const symptomMap: Record<string, string[]> = {
      "神經系統": ["頭痛", "暈", "麻"],
      "消化系統": ["吐", "腹", "胃", "噁心"],
      "呼吸系統": ["咳", "喘", "呼吸"],
      "發燒相關": ["燒", "熱", "溫"]
    };
    
    Object.entries(symptomMap).forEach(([category, patterns]) => {
      const hasSymptom = patterns.some(p => 
        text.includes(p) || keywords.some(k => k.includes(p))
      );
      if (hasSymptom) {
        categories.push(category);
      }
    });
    
    console.log("✅ AI 分析完成");
    console.log("  - AI 情緒分數:", sentiment_score.toFixed(2));
    console.log("  - AI 風險分數:", risk_score.toFixed(2));
    console.log("  - AI 置信度:", ai_confidence.toFixed(2));
    console.log("  - 使用模型:", models_used.join(", "));
    console.log("  - 提取關鍵字:", keywords);
    
    return {
      sentiment_score,
      risk_score,
      outline,
      keywords,
      categories,
      urgency_level,
      suicide_risk,
      emotion_state,
      raw_text: text,
      timestamp: new Date().toISOString(),
      ai_confidence,
      models_used
    };
    
  } catch (error: any) {
    console.error("❌ AI 分析錯誤:", error);
    
    // 返回安全的預設值
    return {
      sentiment_score: 0.5,
      risk_score: 0.3,
      outline: ["AI 分析系統暫時無法使用"],
      keywords: [],
      categories: [],
      urgency_level: "low",
      suicide_risk: false,
      emotion_state: "無法評估",
      raw_text: text,
      timestamp: new Date().toISOString(),
      ai_confidence: 0,
      models_used: []
    };
  }
}