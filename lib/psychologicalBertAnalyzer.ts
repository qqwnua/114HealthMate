// lib/psychologicalBertAnalyzer.ts
// 心理諮詢專用 BERT 分析器

/**
 * 心理分析結果
 */
export interface PsychologicalAnalysisResult {
  sentiment_score: number;      // 情感分數 0-1 (0=極度負面, 1=極度正面)
  risk_score: number;          // 風險分數 0-1 (0=無風險, 1=極高風險)
  emotion_state: string;       // 情緒狀態描述
  keywords: string[];          // 關鍵情緒詞彙
  urgency_level: "low" | "medium" | "high" | "critical"; // 緊急程度
  suicide_risk: boolean;       // 自殺風險
  categories: string[];        // 情緒類別
  suggestions: string[];       // 建議
  timestamp: string;
  raw_text: string;
}

// 自殺風險關鍵字
const SUICIDE_RISK_KEYWORDS = [
  "想死", "想自殺", "自殺", "了結生命", "結束生命",
  "活不下去", "生無可戀", "不想活", "活著沒意義",
  "一了百了", "解脫", "離開這世界", "告別",
  "遺書", "安排後事"
];

// 嚴重負面情緒關鍵字
const SEVERE_NEGATIVE_KEYWORDS = [
  "崩潰", "絕望", "撐不下去", "無助", "痛苦",
  "走投無路", "沒希望", "太累了", "受夠了",
  "孤單", "寂寞", "沒人理解", "沒人關心"
];

// 焦慮相關關鍵字
const ANXIETY_KEYWORDS = [
  "焦慮", "恐慌", "害怕", "擔心", "緊張",
  "不安", "惶恐", "恐懼", "壓力", "壓迫感",
  "喘不過氣", "心悸", "發抖", "冒汗"
];

// 憂鬱相關關鍵字
const DEPRESSION_KEYWORDS = [
  "憂鬱", "抑鬱", "沮喪", "難過", "悲傷",
  "低落", "消沉", "失落", "空虛", "麻木",
  "提不起勁", "沒動力", "沒意義", "疲憊",
  "失眠", "睡不著", "早醒", "嗜睡"
];

// 憤怒相關關鍵字
const ANGER_KEYWORDS = [
  "生氣", "憤怒", "暴怒", "煩躁", "暴躁",
  "受不了", "火大", "抓狂", "爆炸",
  "討厭", "恨", "不爽", "受夠"
];

// 正面情緒關鍵字
const POSITIVE_KEYWORDS = [
  "開心", "快樂", "高興", "喜悅", "幸福",
  "放鬆", "舒服", "輕鬆", "平靜", "安心",
  "有希望", "好轉", "改善", "感恩", "滿足",
  "有信心", "樂觀", "期待"
];

// 求助訊號關鍵字
const HELP_SEEKING_KEYWORDS = [
  "需要幫助", "幫幫我", "救救我", "怎麼辦",
  "不知道該怎麼辦", "請幫我", "求救", "SOS"
];

/**
 * 分析文本中的關鍵字
 */
function extractKeywords(text: string): {
  suicide_risk: boolean;
  severe_negative: number;
  anxiety: number;
  depression: number;
  anger: number;
  positive: number;
  help_seeking: boolean;
  matched_keywords: string[];
} {
  const lowerText = text.toLowerCase();
  const matchedKeywords: string[] = [];

  // 檢查自殺風險
  const suicide_risk = SUICIDE_RISK_KEYWORDS.some(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  });

  // 計算各類情緒出現次數
  const severe_negative = SEVERE_NEGATIVE_KEYWORDS.filter(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const anxiety = ANXIETY_KEYWORDS.filter(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const depression = DEPRESSION_KEYWORDS.filter(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const anger = ANGER_KEYWORDS.filter(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const positive = POSITIVE_KEYWORDS.filter(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  }).length;

  const help_seeking = HELP_SEEKING_KEYWORDS.some(keyword => {
    if (lowerText.includes(keyword)) {
      matchedKeywords.push(keyword);
      return true;
    }
    return false;
  });

  return {
    suicide_risk,
    severe_negative,
    anxiety,
    depression,
    anger,
    positive,
    help_seeking,
    matched_keywords: [...new Set(matchedKeywords)], // 去重
  };
}

/**
 * 計算情感分數和風險分數
 */
function calculateScores(keywordAnalysis: ReturnType<typeof extractKeywords>): {
  sentiment_score: number;
  risk_score: number;
  urgency_level: "low" | "medium" | "high" | "critical";
} {
  const {
    suicide_risk,
    severe_negative,
    anxiety,
    depression,
    anger,
    positive,
    help_seeking,
  } = keywordAnalysis;

  // 風險分數計算
  let risk_score = 0;

  if (suicide_risk) {
    risk_score = 1.0; // 最高風險
  } else if (severe_negative > 0) {
    risk_score = 0.7 + (severe_negative * 0.05);
  } else if (depression > 2 || anxiety > 2) {
    risk_score = 0.5 + ((depression + anxiety) * 0.05);
  } else if (depression > 0 || anxiety > 0 || anger > 0) {
    risk_score = 0.3 + ((depression + anxiety + anger) * 0.03);
  } else {
    risk_score = 0.1;
  }

  // 限制在 0-1 範圍
  risk_score = Math.min(1.0, Math.max(0.0, risk_score));

  // 情感分數計算 (0=極度負面, 1=極度正面)
  let sentiment_score = 0.5; // 預設中性

  if (suicide_risk || severe_negative > 2) {
    sentiment_score = 0.1;
  } else if (severe_negative > 0) {
    sentiment_score = 0.2;
  } else if (depression > 1 || anxiety > 1) {
    sentiment_score = 0.3;
  } else if (depression > 0 || anxiety > 0 || anger > 0) {
    sentiment_score = 0.4;
  } else if (positive > 2) {
    sentiment_score = 0.8;
  } else if (positive > 0) {
    sentiment_score = 0.6;
  }

  // 緊急程度判定
  let urgency_level: "low" | "medium" | "high" | "critical";

  if (suicide_risk) {
    urgency_level = "critical";
  } else if (risk_score >= 0.7) {
    urgency_level = "high";
  } else if (risk_score >= 0.4) {
    urgency_level = "medium";
  } else {
    urgency_level = "low";
  }

  return { sentiment_score, risk_score, urgency_level };
}

/**
 * 判定情緒狀態
 */
function determineEmotionState(keywordAnalysis: ReturnType<typeof extractKeywords>): string {
  const {
    suicide_risk,
    severe_negative,
    anxiety,
    depression,
    anger,
    positive,
  } = keywordAnalysis;

  if (suicide_risk) {
    return "極度負面（自殺風險）";
  } else if (severe_negative > 2) {
    return "極度負面（崩潰狀態）";
  } else if (depression > anxiety && depression > anger) {
    return "憂鬱";
  } else if (anxiety > depression && anxiety > anger) {
    return "焦慮";
  } else if (anger > depression && anger > anxiety) {
    return "憤怒";
  } else if (severe_negative > 0 || depression > 0 || anxiety > 0 || anger > 0) {
    return "負面情緒";
  } else if (positive > 2) {
    return "正面積極";
  } else if (positive > 0) {
    return "輕度正面";
  } else {
    return "中性";
  }
}

/**
 * 生成建議
 */
function generateSuggestions(
  keywordAnalysis: ReturnType<typeof extractKeywords>,
  scores: ReturnType<typeof calculateScores>
): string[] {
  const suggestions: string[] = [];
  const { suicide_risk, help_seeking } = keywordAnalysis;
  const { urgency_level } = scores;

  if (suicide_risk) {
    suggestions.push("立即撥打生命線 1995 或張老師 1980");
    suggestions.push("告知信任的親友您的狀況");
    suggestions.push("前往最近的醫院急診室");
    suggestions.push("不要獨處，尋求陪伴");
  } else if (urgency_level === "critical" || urgency_level === "high") {
    suggestions.push("建議盡快預約心理諮商或精神科門診");
    suggestions.push("與信任的親友談談您的感受");
    suggestions.push("若情況緊急，可撥打 1925 安心專線");
  } else if (urgency_level === "medium") {
    suggestions.push("考慮尋求專業心理諮商協助");
    suggestions.push("練習放鬆技巧，如深呼吸、冥想");
    suggestions.push("維持規律作息和適度運動");
    suggestions.push("與支持您的人保持聯繫");
  } else {
    suggestions.push("維持良好的自我照顧習慣");
    suggestions.push("持續觀察情緒變化");
    suggestions.push("必要時尋求專業協助");
  }

  if (help_seeking) {
    suggestions.push("您願意尋求協助是很勇敢的一步");
  }

  return suggestions;
}

/**
 * 主要分析函數
 */
export async function analyzePsychologicalMessage(
  text: string
): Promise<PsychologicalAnalysisResult> {
  try {
    console.log("🧠 開始心理 BERT 分析...");

    // 1. 關鍵字分析
    const keywordAnalysis = extractKeywords(text);
    console.log("  - 匹配關鍵字:", keywordAnalysis.matched_keywords.length, "個");
    console.log("  - 自殺風險:", keywordAnalysis.suicide_risk ? "⚠️ 是" : "否");

    // 2. 計算分數
    const scores = calculateScores(keywordAnalysis);
    console.log("  - 風險分數:", scores.risk_score.toFixed(2));
    console.log("  - 情感分數:", scores.sentiment_score.toFixed(2));
    console.log("  - 緊急程度:", scores.urgency_level);

    // 3. 判定情緒狀態
    const emotion_state = determineEmotionState(keywordAnalysis);
    console.log("  - 情緒狀態:", emotion_state);

    // 4. 分類
    const categories: string[] = [];
    if (keywordAnalysis.suicide_risk) categories.push("自殺風險");
    if (keywordAnalysis.severe_negative > 0) categories.push("嚴重負面");
    if (keywordAnalysis.depression > 0) categories.push("憂鬱");
    if (keywordAnalysis.anxiety > 0) categories.push("焦慮");
    if (keywordAnalysis.anger > 0) categories.push("憤怒");
    if (keywordAnalysis.positive > 0) categories.push("正面");
    if (keywordAnalysis.help_seeking) categories.push("求助訊號");

    // 5. 生成建議
    const suggestions = generateSuggestions(keywordAnalysis, scores);

    // 6. 構建結果
    const result: PsychologicalAnalysisResult = {
      sentiment_score: scores.sentiment_score,
      risk_score: scores.risk_score,
      emotion_state: emotion_state,
      keywords: keywordAnalysis.matched_keywords,
      urgency_level: scores.urgency_level,
      suicide_risk: keywordAnalysis.suicide_risk,
      categories: categories,
      suggestions: suggestions,
      timestamp: new Date().toISOString(),
      raw_text: text,
    };

    console.log("✅ 心理 BERT 分析完成");
    return result;
  } catch (error) {
    console.error("❌ 心理 BERT 分析失敗:", error);

    // 返回預設安全結果
    return {
      sentiment_score: 0.5,
      risk_score: 0.3,
      emotion_state: "中性",
      keywords: [],
      urgency_level: "medium",
      suicide_risk: false,
      categories: ["分析失敗"],
      suggestions: ["建議諮詢專業心理師"],
      timestamp: new Date().toISOString(),
      raw_text: text,
    };
  }
}

/**
 * 批次分析多條訊息
 */
export async function analyzePsychologicalMessages(
  messages: string[]
): Promise<PsychologicalAnalysisResult[]> {
  const results: PsychologicalAnalysisResult[] = [];

  for (const message of messages) {
    const result = await analyzePsychologicalMessage(message);
    results.push(result);
  }

  return results;
}

/**
 * 取得分析摘要
 */
export function getAnalysisSummary(
  results: PsychologicalAnalysisResult[]
): {
  average_sentiment: number;
  average_risk: number;
  highest_urgency: string;
  suicide_risk_detected: boolean;
  most_common_emotions: string[];
} {
  if (results.length === 0) {
    return {
      average_sentiment: 0.5,
      average_risk: 0.3,
      highest_urgency: "low",
      suicide_risk_detected: false,
      most_common_emotions: [],
    };
  }

  const average_sentiment =
    results.reduce((sum, r) => sum + r.sentiment_score, 0) / results.length;

  const average_risk =
    results.reduce((sum, r) => sum + r.risk_score, 0) / results.length;

  const urgency_levels = results.map((r) => r.urgency_level);
  const highest_urgency =
    urgency_levels.includes("critical")
      ? "critical"
      : urgency_levels.includes("high")
      ? "high"
      : urgency_levels.includes("medium")
      ? "medium"
      : "low";

  const suicide_risk_detected = results.some((r) => r.suicide_risk);

  // 統計最常見的情緒
  const emotionCounts: { [key: string]: number } = {};
  results.forEach((r) => {
    r.categories.forEach((cat) => {
      emotionCounts[cat] = (emotionCounts[cat] || 0) + 1;
    });
  });

  const most_common_emotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);

  return {
    average_sentiment,
    average_risk,
    highest_urgency,
    suicide_risk_detected,
    most_common_emotions,
  };
}