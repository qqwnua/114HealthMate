// lib/bertAnalyzer.ts
// 增強版 BERT 分析服務 - 醫療諮詢專用

const HF_API_KEY = process.env.HF_API_KEY || "";

// 🔥 生命危險等級關鍵字（更精準）
const CRITICAL_RISK_KEYWORDS = {
  // 極高危險（立即就醫）
  critical: [
    "無法呼吸", "呼吸困難", "喘不過氣", "窒息", 
    "劇烈胸痛", "胸口劇痛", "心臟痛", "心絞痛",
    "昏倒", "暈倒", "失去意識", "昏迷", "意識模糊",
    "大量出血", "吐血", "便血", "咳血",
    "癱瘓", "半身不遂", "手腳無力", "突然不能動",
    "抽搐", "痙攣", "全身抽搐",
    "劇烈頭痛", "爆炸性頭痛", "史上最痛",
    "想自殺", "想死", "不想活", "自殺念頭",
    "中風", "心肌梗塞", "休克"
  ],
  
  // 高危險（盡快就醫）
  high: [
    "持續發燒", "高燒不退", "燒到40度", "39度以上",
    "嚴重疼痛", "痛到受不了", "痛到無法忍受",
    "持續嘔吐", "一直吐", "吐不停",
    "嚴重腹痛", "肚子劇痛", "腹部絞痛",
    "呼吸急促", "喘", "呼吸困難",
    "胸悶", "胸口悶", "心悸嚴重",
    "視力模糊", "看不清", "眼睛突然看不見",
    "劇烈頭暈", "天旋地轉", "站不穩",
    "嚴重水腫", "全身腫脹",
    "無法排尿", "尿不出來", "血尿",
    "嚴重過敏", "全身紅疹", "呼吸道腫脹"
  ],
  
  // 中度危險（建議就醫）
  medium: [
    "持續頭痛", "頭痛3天", "頭痛不停",
    "持續咳嗽", "咳嗽兩週", "咳不停",
    "發燒", "燒到38度", "體溫偏高",
    "拉肚子", "腹瀉", "一直跑廁所",
    "噁心", "想吐", "反胃",
    "疲倦", "很累", "全身無力", "沒力氣",
    "失眠", "睡不著", "整夜未眠",
    "心跳過快", "心跳加速", "心律不整",
    "關節痛", "肌肉痠痛", "腰痛", "背痛",
    "皮膚紅腫", "過敏", "搔癢",
    "食慾不振", "吃不下", "沒胃口"
  ],
  
  // 低度關注
  low: [
    "輕微", "稍微", "一點點", "偶爾", "有時候",
    "好一些", "有改善", "比較好", "緩解"
  ]
};

// 🔥 情緒狀態關鍵字（心理健康）
const EMOTION_KEYWORDS = {
  // 極度負面（自殺風險）
  severe_negative: [
    "想死", "想自殺", "活不下去", "生無可戀",
    "絕望", "崩潰", "撐不下去", "沒希望",
    "想結束生命", "了結", "一了百了",
    "不想活", "活著沒意義", "活著好累", "太累了",
    "解脫", "離開這世界", "走了算了"
  ],
  
  // 重度負面
  negative: [
    "憂鬱", "抑鬱", "沮喪", "痛苦", "難過",
    "焦慮", "恐慌", "害怕", "擔心", "緊張",
    "孤單", "寂寞", "無助", "絕望",
    "憤怒", "生氣", "煩躁", "暴躁",
    "壓力大", "壓力", "壓迫感",
    "失眠", "睡不著", "惡夢",
    "沒動力", "提不起勁", "懶散"
  ],
  
  // 中性/輕微負面
  neutral: [
    "還好", "普通", "一般", "平常",
    "有點累", "有點煩", "有點擔心",
    "不確定", "猶豫", "困惑"
  ],
  
  // 正面
  positive: [
    "開心", "高興", "快樂", "喜悅",
    "放鬆", "舒服", "舒適", "輕鬆",
    "有精神", "有活力", "充滿活力",
    "樂觀", "希望", "期待",
    "感恩", "感謝", "幸福",
    "好轉", "改善", "恢復", "康復"
  ],
  
  // 極度正面（可能躁鬱症躁期）
  manic: [
    "無敵", "天下無敵", "什麼都能做",
    "不需要睡", "不用睡覺", "精力無限",
    "停不下來", "一直想做事", "過度興奮",
    "衝動", "莽撞", "不顧一切"
  ]
};

// 🔥 醫療症狀分類詞庫（更完整）
const SYMPTOM_CATEGORIES = {
  緊急症狀: [
    "無法呼吸", "胸痛", "昏倒", "大量出血", "抽搐", 
    "癱瘓", "中風", "心肌梗塞", "休克", "意識不清"
  ],
  
  神經系統: [
    "頭痛", "暈眩", "麻木", "刺痛", "顫抖", 
    "記憶力", "注意力", "癲癇", "偏頭痛", "神經痛"
  ],
  
  心血管: [
    "心悸", "胸悶", "胸痛", "血壓", "心跳",
    "心律不整", "心絞痛", "心臟", "血管"
  ],
  
  呼吸系統: [
    "咳嗽", "喉嚨", "呼吸", "氣喘", "鼻塞",
    "痰", "肺", "支氣管", "哮喘", "肺炎"
  ],
  
  消化系統: [
    "腹痛", "腹瀉", "便秘", "噁心", "嘔吐", 
    "消化", "胃痛", "胃", "腸", "食慾", "脹氣"
  ],
  
  肌肉骨骼: [
    "關節", "肌肉", "酸痛", "僵硬", "腰痛", 
    "背痛", "骨頭", "脊椎", "扭傷", "拉傷"
  ],
  
  心理健康: [
    "焦慮", "憂鬱", "失眠", "壓力", "緊張", 
    "恐慌", "強迫", "躁鬱", "精神", "情緒"
  ],
  
  皮膚: [
    "紅疹", "搔癢", "過敏", "水腫", "腫脹",
    "皮膚", "濕疹", "蕁麻疹", "傷口", "潰瘍"
  ],
  
  內分泌代謝: [
    "糖尿病", "甲狀腺", "血糖", "體重", "肥胖",
    "瘦", "激素", "荷爾蒙", "代謝"
  ],
  
  泌尿生殖: [
    "頻尿", "尿痛", "血尿", "腎", "膀胱",
    "月經", "生理期", "陰道", "攝護腺"
  ],
  
  其他: [
    "發燒", "疲勞", "虛弱", "盜汗", "寒顫",
    "淋巴", "免疫", "過敏", "感染", "發炎"
  ]
};

export type BertAnalysisResult = {
  sentiment_score: number;      // 0-1, 情緒分數（0=極度負面, 0.5=中性, 1=極度正面）
  risk_score: number;            // 0-1, 生命危險分數
  outline: string[];             // 大綱分析
  keywords: string[];            // 醫療關鍵字
  categories: string[];          // 症狀分類
  urgency_level: "low" | "medium" | "high" | "critical";  // 緊急程度
  suicide_risk: boolean;         // 自殺風險
  emotion_state: string;         // 情緒狀態描述
  raw_text: string;
  timestamp: string;
};

/**
 * 🔥 提取醫療關鍵字（增強版）
 */
function extractMedicalKeywords(text: string): string[] {
  const keywords = new Set<string>();
  
  // 從所有症狀分類中提取
  Object.values(SYMPTOM_CATEGORIES).flat().forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  // 從危險關鍵字中提取（這些很重要）
  Object.values(CRITICAL_RISK_KEYWORDS).flat().forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  // 特殊處理：部位 + 症狀的組合
  const bodyParts = ["頭", "胸", "腹", "背", "腰", "手", "腳", "眼", "耳", "鼻", "喉"];
  const symptoms = ["痛", "麻", "腫", "紅", "癢", "酸"];
  
  bodyParts.forEach(part => {
    symptoms.forEach(symptom => {
      const combo = part + symptom;
      if (text.includes(combo)) {
        keywords.add(combo);
      }
    });
  });
  
  return Array.from(keywords).slice(0, 15);
}

/**
 * 🔥 計算生命危險分數（精準版 + 語義分析）
 */
function calculateLifeRiskScore(text: string, keywords: string[]): number {
  let score = 0;
  
  // 🔥 語義模式匹配
  const riskPatterns = {
    critical: [
      /無法.*呼吸/, /不能.*呼吸/, /呼吸.*困難/,
      /胸.*劇痛/, /心臟.*痛/, /胸口.*痛/,
      /昏.*倒/, /暈.*倒/, /失.*意識/,
      /大量.*出血/, /血.*不停/, /流.*血/,
      /癱.*瘓/, /不能.*動/, /動不了/
    ],
    high: [
      /持續.*發燒/, /高.*燒/, /燒.*不退/,
      /嚴重.*痛/, /痛.*受不了/, /劇.*痛/,
      /一直.*吐/, /吐.*不停/, /持續.*嘔吐/,
      /嚴重.*腹痛/, /肚子.*劇痛/
    ],
    medium: [
      /持續.*頭痛/, /頭.*痛.*天/, /一直.*頭痛/,
      /咳.*不停/, /咳.*週/, /持續.*咳/,
      /一直.*拉/, /腹瀉.*天/
    ]
  };
  
  // 檢查語義模式
  riskPatterns.critical.forEach(pattern => {
    if (pattern.test(text)) {
      score += 0.8;
    }
  });
  
  riskPatterns.high.forEach(pattern => {
    if (pattern.test(text)) {
      score += 0.3;
    }
  });
  
  riskPatterns.medium.forEach(pattern => {
    if (pattern.test(text)) {
      score += 0.15;
    }
  });
  
  // 原有的關鍵字匹配
  CRITICAL_RISK_KEYWORDS.critical.forEach(word => {
    if (text.includes(word)) {
      score += 0.8;
    }
  });
  
  CRITICAL_RISK_KEYWORDS.high.forEach(word => {
    if (text.includes(word)) {
      score += 0.3;
    }
  });
  
  CRITICAL_RISK_KEYWORDS.medium.forEach(word => {
    if (text.includes(word)) {
      score += 0.15;
    }
  });
  
  // 低危險詞降低分數
  CRITICAL_RISK_KEYWORDS.low.forEach(word => {
    if (text.includes(word)) {
      score -= 0.1;
    }
  });
  
  // 時間描述加成
  if (text.match(/持續|連續|一直|不停|整天|好幾天|一週|兩週|三天以上/)) {
    score += 0.1;
  }
  
  // 程度描述加成
  if (text.match(/劇烈|嚴重|很痛|非常|極度|受不了|無法忍受|快要.*了/)) {
    score += 0.15;
  }
  
  // 數字提取（發燒溫度、天數等）
  const tempMatch = text.match(/(\d+)度/);
  if (tempMatch) {
    const temp = parseInt(tempMatch[1]);
    if (temp >= 39) score += 0.3;
    else if (temp >= 38) score += 0.15;
  }
  
  const daysMatch = text.match(/(\d+)天/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    if (days >= 7) score += 0.15;
    else if (days >= 3) score += 0.1;
  }
  
  // 多重症狀
  if (keywords.length >= 5) {
    score += 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * 🔥 計算情緒分數（精準版 + 語義分析）
 */
function calculateEmotionScore(text: string): { 
  score: number; 
  state: string;
  suicide_risk: boolean;
} {
  let score = 0.5; // 中性起點
  let suicide_risk = false;
  
  // 🔥 語義分析：檢查整體語境
  const lowerText = text.toLowerCase();
  
  // 檢查自殺風險（最優先）
  EMOTION_KEYWORDS.severe_negative.forEach(word => {
    if (text.includes(word)) {
      score = 0.05; // 接近0但不是0，保留微小希望
      suicide_risk = true;
    }
  });
  
  // 🔥 語義模式匹配（即使沒有關鍵字也能檢測）
  const semanticPatterns = {
    suicidal: [
      /不想.*活/, /活.*意義/, /活.*價值/, /活.*累/,
      /人生.*沒/, /存在.*意義/, /為什麼.*活/,
      /離開.*世界/, /消失.*算了/
    ],
    severe_depression: [
      /好.*累/, /很.*累/, /太.*累/,
      /撐不.*下/, /受不.*了/, /沒.*力/,
      /沒.*希望/, /看不.*希望/, /一片.*黑/
    ],
    depression: [
      /憂鬱/, /沮喪/, /難過/, /痛苦/,
      /孤單/, /寂寞/, /無助/,
      /失眠/, /睡不/, /惡夢/
    ],
    anxiety: [
      /焦慮/, /緊張/, /害怕/, /擔心/,
      /恐慌/, /不安/, /煩躁/
    ]
  };
  
  // 檢查語義模式
  if (!suicide_risk) {
    semanticPatterns.suicidal.forEach(pattern => {
      if (pattern.test(text)) {
        score = 0.1;
        suicide_risk = true;
      }
    });
  }
  
  if (!suicide_risk) {
    // 重度憂鬱
    let severeDepressionCount = 0;
    semanticPatterns.severe_depression.forEach(pattern => {
      if (pattern.test(text)) {
        severeDepressionCount++;
        score -= 0.2;
      }
    });
    
    // 一般憂鬱
    semanticPatterns.depression.forEach(pattern => {
      if (pattern.test(text)) {
        score -= 0.15;
      }
    });
    
    // 焦慮
    semanticPatterns.anxiety.forEach(pattern => {
      if (pattern.test(text)) {
        score -= 0.1;
      }
    });
    
    // 如果有多個重度憂鬱指標，視為自殺風險
    if (severeDepressionCount >= 2) {
      suicide_risk = true;
      score = 0.15;
    }
  }
  
  if (!suicide_risk) {
    // 重度負面 -0.15（原有的關鍵字匹配）
    EMOTION_KEYWORDS.negative.forEach(word => {
      const count = (text.match(new RegExp(word, "g")) || []).length;
      score -= count * 0.15;
    });
    
    // 正面 +0.15
    EMOTION_KEYWORDS.positive.forEach(word => {
      const count = (text.match(new RegExp(word, "g")) || []).length;
      score += count * 0.15;
    });
    
    // 躁症檢測
    let manicCount = 0;
    EMOTION_KEYWORDS.manic.forEach(word => {
      if (text.includes(word)) {
        manicCount++;
      }
    });
    
    if (manicCount >= 2) {
      score = 0.95;
    }
  }
  
  score = Math.max(0, Math.min(1, score));
  
  // 判斷情緒狀態
  let state = "";
  if (suicide_risk) {
    state = "⚠️ 極度危險 - 檢測到自殺風險";
  } else if (score <= 0.2) {
    state = "重度憂鬱 - 需要專業協助";
  } else if (score <= 0.35) {
    state = "中度憂鬱 - 建議尋求支持";
  } else if (score <= 0.45) {
    state = "負面情緒 - 需要關注";
  } else if (score <= 0.55) {
    state = "情緒中性";
  } else if (score <= 0.7) {
    state = "情緒正面";
  } else if (score <= 0.85) {
    state = "情緒良好";
  } else {
    state = "⚠️ 極度興奮 - 注意躁症可能";
  }
  
  return { score, state, suicide_risk };
}

/**
 * 🔥 症狀分類（精準版）
 */
function categorizeSymptoms(keywords: string[]): string[] {
  const categories = new Set<string>();
  
  // 優先檢查緊急症狀
  const hasEmergency = SYMPTOM_CATEGORIES["緊急症狀"].some(s => keywords.includes(s));
  if (hasEmergency) {
    categories.add("⚠️ 緊急症狀");
  }
  
  Object.entries(SYMPTOM_CATEGORIES).forEach(([category, symptoms]) => {
    if (category === "緊急症狀") return; // 已處理
    
    const matchCount = symptoms.filter(symptom => keywords.includes(symptom)).length;
    if (matchCount > 0) {
      categories.add(category);
    }
  });
  
  return Array.from(categories);
}

/**
 * 🔥 生成大綱（增強版）
 */
function generateOutline(
  text: string,
  keywords: string[],
  categories: string[],
  riskScore: number,
  emotionState: string,
  suicideRisk: boolean
): string[] {
  const outline: string[] = [];
  
  // 1. 緊急警示（最優先）
  if (suicideRisk) {
    outline.push("🚨 【緊急】檢測到自殺風險，請立即撥打1925（自殺防治專線）或119");
  } else if (riskScore >= 0.8) {
    outline.push("🚨 【緊急】生命危險等級極高，請立即就醫或撥打119");
  } else if (riskScore >= 0.6) {
    outline.push("⚠️ 【高風險】建議立即前往急診就醫");
  } else if (riskScore >= 0.4) {
    outline.push("⚡ 【中風險】建議盡快就醫檢查");
  }
  
  // 2. 主要症狀
  if (keywords.length > 0) {
    outline.push(`主要症狀：${keywords.slice(0, 5).join("、")}`);
  }
  
  // 3. 涉及系統
  if (categories.length > 0) {
    outline.push(`涉及系統：${categories.join("、")}`);
  }
  
  // 4. 心理狀態
  if (emotionState !== "情緒中性") {
    outline.push(`心理狀態：${emotionState}`);
  }
  
  // 5. 持續時間分析
  if (text.match(/\d+天|一週|兩週|一個月|好幾天/)) {
    outline.push("症狀持續時間較長，建議醫療評估");
  }
  
  // 6. 多重症狀警示
  if (keywords.length >= 5) {
    outline.push("多重症狀同時出現，建議全面健康檢查");
  }
  
  return outline;
}

/**
 * 🔥 主要分析函數（增強版）
 */
export async function analyzeBERT(text: string): Promise<BertAnalysisResult> {
  try {
    // 1. 提取醫療關鍵字
    const keywords = extractMedicalKeywords(text);
    
    // 2. 計算生命危險分數
    const risk_score = calculateLifeRiskScore(text, keywords);
    
    // 3. 計算情緒分數
    const { score: sentiment_score, state: emotion_state, suicide_risk } = calculateEmotionScore(text);
    
    // 4. 症狀分類
    const categories = categorizeSymptoms(keywords);
    
    // 5. 判斷緊急程度
    const urgency_level: "low" | "medium" | "high" | "critical" = 
      suicide_risk || risk_score >= 0.8 ? "critical" :
      risk_score >= 0.6 ? "high" :
      risk_score >= 0.4 ? "medium" : "low";
    
    // 6. 生成大綱
    const outline = generateOutline(text, keywords, categories, risk_score, emotion_state, suicide_risk);
    
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
    };
  } catch (error: any) {
    console.error("BERT 分析錯誤:", error);
    
    // 返回安全的預設值
    return {
      sentiment_score: 0.5,
      risk_score: 0.3,
      outline: ["分析系統暫時無法使用，請描述您的症狀"],
      keywords: [],
      categories: [],
      urgency_level: "low",
      suicide_risk: false,
      emotion_state: "情緒中性",
      raw_text: text,
      timestamp: new Date().toISOString(),
    };
  }
}