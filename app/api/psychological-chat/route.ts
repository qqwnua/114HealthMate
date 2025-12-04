import { NextRequest, NextResponse } from "next/server";
import { analyzePsychologicalMessage } from "@/lib/psychologicalBertAnalyzer";
import { callGroqWithRetry, GROQ_MODELS } from "@/lib/groqRouter";

export const maxDuration = 30;

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * 構建系統提示詞（溫暖陪伴風格）
 */
function buildSystemPrompt(analysis: any): string {
  const { risk_score, emotion_state, keywords, urgency_level, suicide_risk } = analysis;
  
  let prompt = [
    "你是一位溫暖、善解人意的心理健康陪伴者，就像一個值得信賴的好朋友。",
    "",
    "【對話風格】",
    "1. 用輕鬆、自然的語氣聊天，就像朋友之間的對話",
    "2. 不要用條列式或教科書式的回答",
    "3. 先同理和理解對方的感受",
    "4. 用故事、比喻或個人化的方式分享想法",
    "5. 提問引導對方思考，而不是直接給答案",
    "6. 語氣要溫暖、支持，但不過度熱情",
    "7. ⭐ 回應長度保持簡短自然：",
    "   - 簡單問候或確認：1-2 句話 (20-40 字)",
    "   - 一般對話：2-3 句話 (50-80 字)",
    "   - 需要深入回應：3-4 句話 (80-120 字)",
    "   - ❗ 重要：不要一次說太多,讓對話保持來回互動",
    "   - ❗ 寧可簡短有力,也不要長篇大論",
    "8. 使用繁體中文，語氣親切但不過度口語",
    "",
    "【禁止】",
    "- ❌ 不要用「1. 2. 3.」條列式建議",
    "- ❌ 不要用「**粗體**」標題",
    "- ❌ 不要一次給太多建議",
    "- ❌ 不要聽起來像教科書或專家",
    "- ❌ 不要輕易說「沒關係」或「想開點」",
    "",
    "【情緒敏感度】",
    "⚠️ 對負面情緒保持高度敏感：",
    "- 即使是輕微的不安、疲倦、煩躁都要給予關注",
    "- 「累」、「煩」、「不太好」都可能是求助信號",
    "- 寧可多關心，也不要輕描淡寫",
    "",
    "【當前用戶狀況】",
    `- 情緒：${emotion_state || '一般'}`,
    `- 風險程度：${(risk_score * 100).toFixed(0)}%`,
  ];
  
  if (keywords && keywords.length > 0) {
    prompt.push(`- 提到：${keywords.slice(0, 3).join('、')}`);
  }
  
  prompt.push("");
  
  // 根據風險調整
  if (suicide_risk || risk_score >= 0.7) {
    prompt.push("🚨 【危機處理模式】");
    prompt.push("此刻用戶可能處於危機中。請：");
    prompt.push("- 用溫暖但認真的語氣表達你的擔心");
    prompt.push("- 直接但溫柔地詢問是否有自傷念頭");
    prompt.push("- 強烈建議立即撥打生命線 1995");
    prompt.push("- 提供具體的當下行動步驟");
    prompt.push("");
  } else if (risk_score >= 0.5) {
    prompt.push("⚠️ 用戶情緒較低落，需要更多同理和陪伴。建議以傾聽為主，適時提及專業資源。");
    prompt.push("");
  } else if (urgency_level === "low" && risk_score < 0.3) {
    prompt.push("✨ 用戶狀態不錯，可以用輕鬆愉快的語氣互動，分享正向想法。");
    prompt.push("");
  }
  
  // 對話範例
  prompt.push("【對話範例】");
  prompt.push("用戶：「我最近壓力好大」");
  prompt.push("你：「聽起來你最近過得蠻辛苦的。壓力大的時候真的很不好受對吧？想聊聊是什麼讓你感到壓力嗎？有時候說出來會感覺好一點。」");
  prompt.push("");
  prompt.push("用戶：「工作很忙，睡不好」");
  prompt.push("你：「工作忙碌又睡不好，這兩個加在一起真的會讓人很累。我好奇，你晚上躺在床上的時候，腦袋是不是還在想工作的事？」");
  
  return prompt.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, messages, history } = body;

    // 支援兩種格式
    let userMessage: string;
    let conversationHistory: Message[] = [];

    if (message) {
      // 單一訊息格式（推薦）
      userMessage = message;
      conversationHistory = history || [];
    } else if (messages && Array.isArray(messages)) {
      // messages 陣列格式（useChat 格式）
      const lastMsg = messages[messages.length - 1];
      userMessage = lastMsg?.content || "";
      conversationHistory = messages.slice(0, -1);
    } else {
      return NextResponse.json(
        { error: '無效的請求格式' },
        { status: 400 }
      );
    }

    if (!userMessage) {
      return NextResponse.json(
        { error: '找不到用戶消息' },
        { status: 400 }
      );
    }

    console.log("🧠 開始心理分析...");
    console.log("  - 用戶訊息:", userMessage.substring(0, 50) + "...");

    // BERT 分析
    let bertAnalysis;
    try {
      const rawAnalysis = await analyzePsychologicalMessage(userMessage);
      
      // 🔧 智能情緒判斷系統
      // 判斷訊息是否包含情緒內容
      const isEmotionalMessage = detectEmotionalContent(userMessage, conversationHistory);
      
      // 如果是非情緒性訊息(如單純回答問題),使用上下文情緒
      let finalRiskScore;
      let finalEmotionState;
      let shouldTrackEmotion = true;
      
      if (!isEmotionalMessage.hasEmotion) {
        // 非情緒性訊息:使用最近的情緒狀態
        const lastEmotionalContext = getLastEmotionalContext(conversationHistory);
        finalRiskScore = lastEmotionalContext.risk_score;
        finalEmotionState = lastEmotionalContext.emotion_state;
        shouldTrackEmotion = false; // 不列入情緒追蹤
        
        console.log("  ⚠️ 偵測到非情緒性訊息,繼承上文情緒");
        console.log("    * 原因:", isEmotionalMessage.reason);
        console.log("    * 繼承情緒:", finalEmotionState);
      } else {
        // 情緒性訊息:正常分析並調整
        let adjustedRiskScore = Math.min(rawAnalysis.risk_score * 1.35, 1.0);
        
        // 🔧 基於關鍵字的情緒強化判斷
        // 某些強烈情緒關鍵字應該直接提升風險分數
        const strongNegativeKeywords = {
          // 極度負面 (risk_score 至少 0.7)
          extreme: [
            "崩潰", "絕望", "想死", "活不下去", "受不了", "撐不下去",
            "沒意義", "沒希望", "放棄", "結束生命", "自殺"
          ],
          // 強烈負面 (risk_score 至少 0.5)
          strong: [
            "煩躁", "憤怒", "生氣", "痛苦", "難過", "憂鬱", "焦慮", "恐懼", 
            "暴怒", "抓狂", "悲傷", "傷心", "心痛", "絕望感", "無力感"
          ],
          // 中度負面 (risk_score 至少 0.4)
          moderate: [
            "煩", "累", "壓力", "擔心", "緊張", "不安", "沮喪", "失望", "疲憊",
            "低落", "鬱悶", "煩惱", "孤單", "寂寞", "空虛", "迷茫"
          ]
        };
        
        // 🔧 自我否定語句 (表達低自尊/失敗感) - 強烈負面
        const selfNegativePatterns = [
          "失敗", "沒用", "廢物", "垃圾", "差勁", "糟糕",
          "做不到", "做不好", "不行", "不配", "不夠好",
          "沒價值", "沒能力", "很爛", "很差", "太糟",
          "對不起", "愧疚", "內疚", "自責", "後悔"
        ];
        
        // 🔧 命令式負面語句 (表達煩躁/憤怒)
        const negativeCommands = [
          "別煩我", "不要煩我", "別吵", "閉嘴", "滾開", "走開",
          "別管我", "不要管我", "讓我靜靜", "別說了", "夠了"
        ];
        
        const hasNegativeCommand = negativeCommands.some(cmd => userMessage.includes(cmd));
        const hasSelfNegative = selfNegativePatterns.some(pattern => userMessage.includes(pattern));
        
        // 檢查是否包含強烈負面關鍵字
        const hasExtremeKeyword = strongNegativeKeywords.extreme.some(k => userMessage.includes(k));
        const hasStrongKeyword = strongNegativeKeywords.strong.some(k => userMessage.includes(k));
        const hasModerateKeyword = strongNegativeKeywords.moderate.some(k => userMessage.includes(k));
        
        if (hasExtremeKeyword) {
          adjustedRiskScore = Math.max(adjustedRiskScore, 0.75);
          console.log("    * 偵測到極度負面關鍵字,提升風險分數至:", adjustedRiskScore.toFixed(3));
        } else if (hasNegativeCommand || hasStrongKeyword || hasSelfNegative) {
          adjustedRiskScore = Math.max(adjustedRiskScore, 0.55);
          if (hasSelfNegative) {
            console.log("    * 偵測到自我否定語句,提升風險分數至:", adjustedRiskScore.toFixed(3));
          } else {
            console.log("    * 偵測到強烈負面情緒(命令式/關鍵字),提升風險分數至:", adjustedRiskScore.toFixed(3));
          }
        } else if (hasModerateKeyword) {
          adjustedRiskScore = Math.max(adjustedRiskScore, 0.4);
          console.log("    * 偵測到中度負面關鍵字,提升風險分數至:", adjustedRiskScore.toFixed(3));
        }
        
        // 重新評估情緒狀態
        if (adjustedRiskScore > 0.7) {
          finalEmotionState = "焦慮/憂鬱";
        } else if (adjustedRiskScore > 0.5) {
          finalEmotionState = "低落/不安";
        } else if (adjustedRiskScore > 0.35) {
          finalEmotionState = "一般偏負";
        } else if (adjustedRiskScore > 0.25) {
          finalEmotionState = "一般";
        } else {
          finalEmotionState = "平穩/正向";
        }
        
        finalRiskScore = adjustedRiskScore;
      }
      
      bertAnalysis = {
        ...rawAnalysis,
        risk_score: finalRiskScore,
        emotion_state: finalEmotionState,
        original_risk_score: rawAnalysis.risk_score,
        should_track: shouldTrackEmotion, // 新增:是否應該列入情緒追蹤
        is_emotional_message: isEmotionalMessage.hasEmotion,
      };
      
      console.log("  ✅ BERT 分析完成");
      console.log("    * 是否為情緒訊息:", isEmotionalMessage.hasEmotion);
      console.log("    * 原始風險分數:", rawAnalysis.risk_score.toFixed(3));
      console.log("    * 最終分數:", finalRiskScore.toFixed(3));
      console.log("    * 情緒狀態:", finalEmotionState);
      console.log("    * 列入追蹤:", shouldTrackEmotion);
    } catch (error) {
      console.log("  ⚠️ BERT 分析失敗，使用預設值");
      bertAnalysis = {
        sentiment_score: 0.5,
        risk_score: 0.4,
        emotion_state: "一般",
        urgency_level: "low",
        suicide_risk: false,
        keywords: [],
        should_track: false, // 分析失敗不列入追蹤
      };
    }

    // 構建系統提示
    const systemPrompt = buildSystemPrompt(bertAnalysis);

    // 準備對話（限制歷史記錄避免回覆過長）
    // 🔧 修正：只保留最近 3 輪對話(6 則訊息)
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6).map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: userMessage },
    ];

    console.log("🤖 開始生成回應（Groq）...");

    // 調用 Groq（限制 token 數來控制回覆長度）
    const { content, debug } = await callGroqWithRetry(conversationMessages, {
      model: GROQ_MODELS.LLAMA_3_8B,
      temperature: 0.7,
      max_tokens: 256, // 🔧 修正：降低至 256 來保持簡短
    });

    console.log("✅ 回應生成完成");
    console.log("  - 回應內容:", content.substring(0, 100) + "...");
    console.log("  - 使用模型:", debug.model || "llama-3.1-8b-instant");

    // 🔥 關鍵：返回 JSON 格式（和醫病諮詢一樣）
    return NextResponse.json({
      status: "success",
      reply: content.trim(),
      debug: {
        model_used: debug.model || "llama-3.1-8b-instant",
        provider: "groq",
        bert_analysis: bertAnalysis,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (e: any) {
    console.error("❌ Psychological Chat API Error:", e);

    // 備用回應
    return NextResponse.json(
      {
        status: "error",
        error: '心理諮詢服務暫時無法使用',
        reply: [
          "非常抱歉，系統目前遇到問題。",
          "",
          "如果您正處於情緒困擾中，建議您：",
          "",
          "📞 **24小時危機專線**：",
          "- 生命線：1995",
          "- 張老師：1980",
          "- 1925 安心專線",
          "",
          "💙 請記住，您不孤單，隨時都有人願意傾聽和協助。"
        ].join("\n"),
        debug: {
          error: e.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 偵測訊息是否包含情緒內容
 */
function detectEmotionalContent(message: string, history: any[]): { hasEmotion: boolean; reason: string } {
  const lowerMsg = message.toLowerCase().trim();
  
  // 🔧 優先檢查: 包含明確情緒關鍵字 → 一定是情緒訊息 (最高優先級)
  if (containsEmotionKeywords(message)) {
    return { hasEmotion: true, reason: "包含情緒關鍵字" };
  }
  
  // 1. 太短的訊息(可能只是簡單回應)
  if (message.length < 5) {
    return { hasEmotion: false, reason: "訊息過短" };
  }
  
  // 2. 常見的非情緒性回應模式
  const nonEmotionalPatterns = [
    /^(好|ok|okay|嗯|是|對|沒有|不是|不會|可以|謝謝|感謝)$/i,
    /^(收到|了解|知道了|明白)$/i,
    /^\d+$/,  // 純數字
  ];
  
  for (const pattern of nonEmotionalPatterns) {
    if (pattern.test(lowerMsg)) {
      return { hasEmotion: false, reason: "簡單確認回應" };
    }
  }
  
  // 3. 偵測是否在回答機器人的問題
  if (history.length > 0) {
    const lastMessage = history[history.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage?.content) {
      const botContent = lastMessage.content.toLowerCase();
      
      // 機器人問了問題
      const hasQuestion = botContent.includes("?") || 
                         botContent.includes("嗎") || 
                         botContent.includes("想") ||
                         botContent.includes("可以") ||
                         botContent.includes("聊聊");
      
      // 用戶的回答很簡短且無情緒關鍵字 (這裡已經確認無關鍵字)
      if (hasQuestion && message.length < 20) {
        return { hasEmotion: false, reason: "回答問題(無情緒關鍵字)" };
      }
    }
  }
  
  // 4. 預設:較長的訊息視為可能包含情緒
  if (message.length >= 15) {
    return { hasEmotion: true, reason: "訊息長度足夠" };
  }
  
  // 5. 其他情況視為非情緒性
  return { hasEmotion: false, reason: "無明確情緒內容" };
}

/**
 * 檢查是否包含情緒關鍵字
 */
function containsEmotionKeywords(message: string): boolean {
  const emotionKeywords = [
    // 負面情緒
    "煩", "累", "焦慮", "壓力", "難過", "痛苦", "憂鬱", "絕望", 
    "害怕", "恐懼", "擔心", "緊張", "不安", "煩躁", "生氣", "憤怒",
    "孤單", "寂寞", "無助", "失望", "沮喪", "挫折", "悲傷",
    "想哭", "崩潰", "受不了", "撐不下去", "沒力氣", "疲憊",
    "低落", "鬱悶", "煩惱", "空虛", "迷茫", "傷心", "心痛",
    
    // 自我否定
    "失敗", "沒用", "廢物", "差勁", "糟糕", "做不到", "做不好",
    "不行", "不配", "不夠好", "沒價值", "沒能力", "很爛", "很差",
    "愧疚", "內疚", "自責", "後悔",
    
    // 正面情緒
    "開心", "快樂", "高興", "興奮", "期待", "放鬆", "平靜",
    "滿足", "感動", "溫暖", "幸福", "愉快", "舒服",
    
    // 情緒狀態描述
    "心情", "感覺", "覺得", "情緒", "狀態", "最近"
  ];
  
  return emotionKeywords.some(keyword => message.includes(keyword));
}

/**
 * 獲取最近的情緒上下文
 */
function getLastEmotionalContext(history: any[]): { risk_score: number; emotion_state: string } {
  // 從最近的對話中尋找情緒性訊息
  // 往回查找最多 10 條訊息
  for (let i = history.length - 1; i >= Math.max(0, history.length - 10); i--) {
    const msg = history[i];
    if (msg?.role === "user" && msg?.content) {
      // 檢查這條訊息是否包含情緒內容
      if (containsEmotionKeywords(msg.content)) {
        // 找到情緒性訊息,返回保守的負面評估
        // 如果用戶之前說「很煩」,現在只是回答問題,情緒應該維持「煩」的狀態
        return {
          risk_score: 0.5, // 保持中性偏負
          emotion_state: "低落/不安" // 保守估計
        };
      }
    }
  }
  
  // 如果找不到情緒性訊息,返回中性值
  return {
    risk_score: 0.4,
    emotion_state: "一般"
  };
}