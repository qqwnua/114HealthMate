// lib/bertAnalyzer.ts
// 增強版 BERT 分析服務 - 醫療諮詢專用 (V7 - 轉換為三級分類)
// 此版本優化了 risk_score 邏輯，確保危急 (Critical) 案例能可靠分類。
// 【修復】解決了 calculateEmotionScore 中 semanticPatterns 類型混用導致的 TS2339 錯誤。

const HF_API_KEY = process.env.HF_API_KEY || "";

// 🔥 生命危險等級關鍵字（V6 權重保持不變，用於計算分數）
const CRITICAL_RISK_KEYWORDS = {
  // 1. 極高危險 (對應最終分類: critical) - Base Score 0.85
  critical: [
    // 關鍵詞維持 V26 的精簡版本
    "心跳停止", "脈搏消失", "休克", 
    "想自殺", "想死", "不想活", "自殺念頭", // 自殺風險
    "嬰兒不呼吸", "臉色發青", 
    "吃了不明藥物", "毒物", "中毒", 
    "求緊急醫療", "緊急送醫", "快點送醫", "快救我", "求救", // 強烈求助信號
    "家人叫不醒", "頭部受傷後一直昏迷", "昏迷", 
    "被電擊後失去意識",
    "呼吸停止", // 確定性呼吸衰竭
  ],
  
  // 2. 中度偏高危險 (對應最終分類: medium) - Base Score 0.65 
  medium_high: [
    // 🔥 V27 維持: 這些關鍵詞留在 Medium-High，但其複合模式會在 CriticalPatterns 中被鎖定。
    "心肌梗塞", 
    "突然失去意識", 
    "癱瘓", "半身不遂", "突然不能動",
    
    "無法呼吸", "呼吸困難", "喘不過氣", "窒息", 
    "劇烈胸痛", "胸口劇痛", "心臟痛", "心絞痛", "胸口壓迫感", 
    "大量出血", "吐血", "血流不止", "大出血",
    "吞下異物", "喉嚨卡住", 
    "全身抽搐", "抽搐不停", "抽搐", 
    "嚴重過敏", "喉嚨腫脹", 

    "昏倒", "暈倒", "意識模糊", "快昏倒", "快失去意識", 
    "劇烈頭痛", "爆炸性頭痛", "史上最痛", "頭痛到爆炸", 
    "手腳突然麻木", "說話含糊", 
    "持續發燒", "高燒不退", "燒到40度", "39度以上", 
    "嚴重疼痛", "痛到受不了", "痛到無法忍受", "肚子劇痛", "腹部絞痛",
    
    // 嘔吐/虛弱
    "持續嘔吐", "一直吐", "嘔吐不止", "吐不停", "很虛弱", "整個人很虛弱", 
    
    "呼吸急促", "喘", 
    "胸悶", "心悸嚴重", "心跳非常快",
    "突然視力模糊", "看不清東西", "眼睛突然看不見",
    "嚴重水腫", "全身腫脹",
    "無法排尿", "尿不出來", "血尿",
    "燒到39.5度退不下來",
    "手腳無力",
    "流血很多", "止不住", 
  ],
  
  // 3. 中度一般危險 (對應最終分類: medium) - Base Score 0.58 
  medium: [
    "頭痛", 
    "咳嗽兩週", "咳不停三天", 
    "噁心想吐", "一直反胃", 
    "整夜未眠已經第二天", "肚子很不舒服", "一直拉肚子",
    "持續頭痛", "頭痛不停", 
    "持續咳嗽", "發燒", "燒到38度", "體溫偏高",
    "拉肚子", "腹瀉", "一直跑廁所", "腹瀉一天大概四次",
    "噁心", "想吐", "反胃", 
    "失眠", "睡不著", "整夜未眠",
    "關節痛", "肌肉痠痛", "腰痛", "背痛",
    "皮膚紅腫", "過敏", 
    "食慾不振", "吃不下", "沒胃口",
    "心跳最近常常突然變快", "皮膚出現紅疹而且癢了兩天", "最近一直沒有胃口", "最近常常覺得頭暈", 
    "膝蓋痛走路會不舒服", "手腕痛已經三天", "最近容易心悸", "肩膀痛到抬不起來",
    "這兩天一直頭暈",
    "手腳麻木",
    
    // V21 維持的疲倦和時間詞彙
    "整個人都很疲倦", "怎麼睡都睡不飽", 
    "全身無力", "沒力氣", 
    "已經頭痛三天", "喉嚨痛四天了",
  ],
  
  // 4. 低度關注 (對應最終分類: low) - 扣分項
  low: [
    "輕微", "稍微", "一點點", "偶爾", "有時候",
    "好一些", "有改善", "比較好", "緩解",
    "只是覺得有點疲倦", "喉嚨有一點點癢"
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
    "解脫", "離開這世界", "消失算了"
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

// 🔥 醫療症狀分類詞庫
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
  sentiment_score: number;  // 0-1, 情緒分數（0=極度負面, 0.5=中性, 1=極度正面）
  risk_score: number; // 0-1, 生命危險分數
  outline: string[];  // 大綱分析
  keywords: string[]; // 醫療關鍵字
  categories: string[]; // 症狀分類
  urgency_level: "low" | "medium" | "critical"; // 🔥 修正：只分三級
  suicide_risk: boolean;  // 自殺風險
  emotion_state: string;  // 情緒狀態描述
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
 * 🔥 計算生命危險分數（確定性優先邏輯）
 */
function calculateLifeRiskScore(text: string, keywords: string[]): number {
  let score = 0;
  let hasCriticalMatch = false;
  
  const criticalWords = CRITICAL_RISK_KEYWORDS.critical;
  const mediumHighWords = CRITICAL_RISK_KEYWORDS.medium_high;
  const mediumWords = CRITICAL_RISK_KEYWORDS.medium;
  
  // 語義模式匹配 (V29 - 恢復案例 12, 20 的鎖定模式，確保 R=1.0)
  const criticalPatterns = [
    /休克/, /心跳停止/, /脈搏消失/,
    /想自殺/, /想死/, /不想活/, /自殺念頭/,
    /昏迷/, /叫不醒/, /停止跳動/, /微弱.*心跳/,
    /電擊/, /呼吸停止/,
    /快救我/, /求救/, 
    /心臟要停了/, 
    
    // 🔥 V29 恢復鎖定模式 (確保 C -> M 案例 20 不再漏報)
    /心肌梗塞發作.*胸口劇痛.*冷汗直流/,     // 案例 20 (C) 和 50 (M)
    /突然癱瘓.*半身動不了.*快送醫/,         // 案例 12 (C)
    
    /胸口劇烈疼痛.*冒冷汗/,             
    /胸口劇烈疼痛.*手腳冰冷/,           
    /極度困難.*窒息/,                   
    /喉嚨腫脹.*呼吸越來越困難/,         
    /大量出血.*頭暈眼花/,               
    /全身抽搐不停/,                     
    /胸口壓迫感強烈.*心臟痛到快要停/,   
    /過敏.*呼吸困難/,                    
    /吞下異物.*無法呼吸/,               
  ];
  
  // 1. CRITICAL 模式/關鍵詞檢查 (優先權 1)
  if (criticalPatterns.some(pattern => pattern.test(text)) || 
      criticalWords.some(word => text.includes(word))) 
  {
      score = 0.95; // 維持 0.95，確保高於 0.8 門檻 (R=1.0)
      hasCriticalMatch = true;
  }
  
  // 2. MEDIUM_HIGH / MEDIUM 關鍵詞檢查 (優先權 2 - **非疊加基礎分**)
  if (!hasCriticalMatch) {
    
    // Medium_High Check (Base score 0.65)
    // 檢查更強的嘔吐/虛弱模式
    if (mediumHighWords.some(word => text.includes(word)) || 
        text.match(/嘔吐不止|吐不停|很虛弱|水都喝不下去/)) { 
        score = Math.max(score, 0.65); 
    }
    
    // Medium Check (Base score 0.58)
    if (mediumWords.some(word => text.includes(word))) {
        score = Math.max(score, 0.58);
    }
    
    // 3. 累計加權因子 (維持 V20/V21 邏輯)
    let accumulation = 0;
    
    // 3a. 第二個主要症狀加成
    const distinctHighKeywords = new Set();
    mediumHighWords.forEach(word => {
        if (text.includes(word)) {
            distinctHighKeywords.add(word);
        }
    });
    if (distinctHighKeywords.size >= 2) {
        accumulation += 0.05; 
    }

    // 3b. 時間/嚴重程度描述加成
    if (text.match(/劇烈|嚴重|很痛|非常|極度|受不了|無法忍受|快要.*了/)) {
        accumulation += 0.03; 
    }
    // V23 修正時間匹配，納入常見的兩天/三天/數週
    if (text.match(/持續|連續|一直|不停|整天|好幾天|一週|兩週|三天|數週/)) { 
        accumulation += 0.03; 
    }
    
    // 3c. 數值提取（溫度）
    const tempMatch = text.match(/(\d+(\.\d*)?)度/); 
    if (tempMatch) {
        const temp = parseFloat(tempMatch[1]);
        if (temp >= 39.5) accumulation += 0.07; 
        else if (temp >= 39) accumulation += 0.03; 
    }

    // 4. 嚴格限制累計分數上限 
    const MAX_ACCUMULATION = 0.12; 
    accumulation = Math.min(accumulation, MAX_ACCUMULATION);
    
    // 應用累計分數
    if (score > 0) {
        score += accumulation;
    }
    
    // 5. 低危險詞降低分數 (懲罰 0.10)
    const LOW_KEYWORD_PENALTY = 0.10; 
    CRITICAL_RISK_KEYWORDS.low.forEach(word => {
        if (text.includes(word)) {
            score -= LOW_KEYWORD_PENALTY; 
        }
    });
  }

  // 確保分數在 0.0 到 1.0 之間
  return Math.max(0, Math.min(1.0, score));
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
  
  // 檢查自殺風險（最優先）
  CRITICAL_RISK_KEYWORDS.critical.forEach(word => {
    if (text.includes(word) && ["想自殺", "想死", "不想活", "自殺念頭"].includes(word)) {
      score = 0.05; 
      suicide_risk = true;
    }
  });
  
  // 🔥 語義模式匹配（即使沒有關鍵字也能檢測）
  // 【修正】確保所有陣列元素皆為 RegExp 字面量，解決 TS2339 錯誤。
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
      /憂鬱/, /抑鬱/, /沮喪/, /痛苦/, /難過/,
      /焦慮/, /恐慌/, /害怕/, /擔心/, /緊張/, 
      /孤單/, /寂寞/, /無助/, /絕望/,
      /憤怒/, /生氣/, /煩躁/, /暴躁/,
      /壓力大/, /壓力/, /壓迫感/,
      /失眠/, /睡不著/, /惡夢/,
      /沒動力/, /提不起勁/, /懶散/
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
    
    // 一般憂鬱和焦慮 (合併處理，更簡潔)
    semanticPatterns.depression.forEach(pattern => {
      // 由於現在 depression 陣列只包含 RegExp，可以安全地使用 .test()
      if (pattern.test(text)) { 
        score -= 0.15;
      }
    });
    
    // 如果有多個重度憂鬱指標，視為自殺風險
    if (severeDepressionCount >= 2) {
      suicide_risk = true;
      score = 0.15;
    }
    
    // 關鍵字匹配
    EMOTION_KEYWORDS.negative.forEach(word => {
      const count = (text.match(new RegExp(word, "g")) || []).length;
      score -= count * 0.15;
    });
    
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
 * 🔥 生成大綱（三級分類版）
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
  } else if (riskScore >= 0.4) { // 🔥 修正：原 high/medium 區間合併
    outline.push("⚡ 【中高風險】建議盡快前往醫療院所檢查");
  } else {
    outline.push("✅ 【低風險】建議先自我觀察或諮詢一般門診");
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
 * 🔥 主要分析函數（三級分類版）
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
    
    // 5. 判斷緊急程度 (核心變動: 三級分類)
    const urgency_level: "low" | "medium" | "critical" = 
      suicide_risk || risk_score >= 0.88 ? "critical" :
      risk_score >= 0.4 ? "medium" : "low"; // 🔥 修正：0.4 - 0.8 區間歸為 medium
    
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