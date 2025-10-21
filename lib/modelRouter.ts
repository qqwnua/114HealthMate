// lib/modelRouter.ts
// 智能模型路由 - 根據用戶選擇調用對應 AI 模型

import { callGroqWithRetry, GROQ_MODELS } from './groqRouter';
import { callWithRetry as callHF } from './hfRouter';
import type { BertAnalysisResult } from './bertAnalyzer';

type ModelChoice = "llama" | "gpt" | "auto";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ModelResponse = {
  content: string;
  model_used: string;
  provider: string;
  debug: any;
};

/**
 * 構建系統提示詞（根據 BERT 分析結果）
 */
function buildSystemPrompt(analysis: BertAnalysisResult): string {
  const { risk_score, sentiment_score, outline, keywords, urgency_level } = analysis;
  
  let prompt = [
    "你是一位專業、同理心強的中文醫療諮詢助理。",
    "",
    "【重要規則】",
    "1. 不做診斷，僅提供一般健康資訊",
    "2. 使用清晰、溫和、易懂的語言",
    "3. 先用 1-2 句話表達理解，再提供 3-5 點具體建議",
    "4. 回答要實用、可執行",
    "",
    "【患者情況分析】",
    `- 風險評分：${(risk_score * 100).toFixed(0)}%`,
    `- 情緒狀態：${sentiment_score < 0.4 ? '焦慮/負面' : sentiment_score > 0.6 ? '正面/穩定' : '中性'}`,
    `- 緊急程度：${urgency_level === 'high' ? '⚠️ 高（建議立即就醫）' : urgency_level === 'medium' ? '⚡ 中等（建議盡快就醫）' : 'ℹ️ 低（可觀察）'}`,
  ];
  
  if (keywords.length > 0) {
    prompt.push(`- 關鍵症狀：${keywords.join('、')}`);
  }
  
  if (outline.length > 0) {
    prompt.push(`- 分析大綱：${outline.join('；')}`);
  }
  
  prompt.push("");
  
  // 根據風險等級調整回應策略
  if (risk_score >= 0.7) {
    prompt.push("⚠️ 【高風險警示】此患者可能需要緊急醫療照護，請在回應中明確建議立即就醫或撥打119。");
  } else if (risk_score >= 0.5) {
    prompt.push("⚡ 【中等風險】建議患者盡快安排就醫檢查，不要拖延。");
  }
  
  return prompt.join("\n");
}

/**
 * 根據模型選擇調用對應的 AI
 */
export async function routeToModel(
  userMessage: string,
  analysis: BertAnalysisResult,
  modelChoice: ModelChoice,
  history: Message[] = []
): Promise<ModelResponse> {
  
  const systemPrompt = buildSystemPrompt(analysis);
  
  // 構建完整對話
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-4), // 只保留最近2輪對話
    { role: "user", content: userMessage },
  ];
  
  try {
    if (modelChoice === "llama" || modelChoice === "auto") {
      // 使用 Groq 的 Llama 3 模型
      const { content, debug } = await callGroqWithRetry(messages, {
        model: modelChoice === "llama" 
          ? GROQ_MODELS.LLAMA_3_8B 
          : GROQ_MODELS.LLAMA_3_8B, // auto 也用 Llama（速度快）
        temperature: 0.7,
        max_tokens: 512,
      });
      
      return {
        content: content.trim(),
        model_used: debug.model || "llama-3-8b",
        provider: "groq",
        debug,
      };
    } 
    
    if (modelChoice === "gpt") {
      // 🔥 使用 Groq 提供的 GPT-OSS 模型
      const { content, debug } = await callGroqWithRetry(messages, {
        model: GROQ_MODELS.GPT_OSS_120B, // 使用 120B 大模型
        temperature: 0.8,
        max_tokens: 768,
      });
      
      return {
        content: content.trim(),
        model_used: "gpt-oss-120b",
        provider: "groq",
        debug,
      };
    }
    
    throw new Error("未知的模型選擇");
    
  } catch (error: any) {
    console.error("模型調用失敗:", error);
    
    // 嘗試 HF 作為備用（如果 Groq 失敗）
    try {
      const { content, debug } = await callHF(
        "gpt2",
        "distilgpt2",
        messages,
        { temperature: 0.7, max_tokens: 512 }
      );
      
      return {
        content: content.trim(),
        model_used: "gpt2-fallback",
        provider: "huggingface",
        debug,
      };
    } catch {
      // 所有外部 API 都失敗，使用本地生成
      return {
        content: generateLocalResponse(userMessage, analysis),
        model_used: "local-fallback",
        provider: "local",
        debug: { error: error.message },
      };
    }
  }
}

/**
 * 本地生成回應（當所有 API 都失敗時）
 */
function generateLocalResponse(message: string, analysis: BertAnalysisResult): string {
  const { risk_score, keywords, outline, urgency_level } = analysis;
  
  let response = ["感謝您的諮詢。讓我為您分析：", ""];
  
  // 理解與摘要
  if (keywords.length > 0) {
    response.push(`**您提到的主要症狀**：${keywords.slice(0, 3).join('、')}`);
    response.push("");
  }
  
  // 風險評估
  if (urgency_level === "high") {
    response.push("⚠️ **重要提醒**：根據您描述的症狀，建議您立即就醫或撥打119。這些症狀可能需要緊急醫療處置。");
    response.push("");
  } else if (urgency_level === "medium") {
    response.push("⚡ **建議**：您的症狀需要醫療專業人員評估，請盡快安排就醫檢查。");
    response.push("");
  }
  
  // 一般建議
  response.push("**基本建議**：");
  response.push("");
  response.push("1. **觀察記錄**：留意症狀的變化、頻率和嚴重程度");
  response.push("");
  response.push("2. **日常保健**：");
  response.push("   - 保持充足睡眠和水分");
  response.push("   - 避免過度勞累");
  response.push("   - 注意飲食均衡");
  response.push("");
  response.push("3. **就醫時機**：");
  response.push("   - 症狀持續或加重");
  response.push("   - 出現新的症狀");
  response.push("   - 影響日常生活");
  response.push("");
  
  if (risk_score >= 0.5) {
    response.push("⚠️ **重要**：以上建議不能替代專業醫療診斷，請務必就醫檢查。");
  } else {
    response.push("💡 **提醒**：這些是一般性建議，如有疑慮請諮詢醫療專業人員。");
  }
  
  return response.join("\n");
}