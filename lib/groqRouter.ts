// lib/groqRouter.ts
// Groq API 調用工具 - 超快速的 LLM API

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqOptions = {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  model?: string;
};

// 推薦的 Groq 模型（都支援中文）
export const GROQ_MODELS = {
  // 最快最推薦
  LLAMA_3_8B: "llama-3.1-8b-instant",
  // 更大更強
  LLAMA_3_70B: "llama-3.1-70b-versatile",
  // 平衡版
  MIXTRAL: "mixtral-8x7b-32768",
  // 小而快
  GEMMA_7B: "gemma2-9b-it",
  // 🔥 OpenAI 開源版本
  GPT_OSS_20B: "openai/gpt-oss-20b",
  GPT_OSS_120B: "openai/gpt-oss-120b",
};

/**
 * 調用 Groq API
 */
export async function callGroq(
  messages: Message[],
  options: GroqOptions = {}
): Promise<{ content: string; debug?: any }> {
  
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY 未設定");
  }

  const model = options.model || GROQ_MODELS.LLAMA_3_8B;

  const requestBody = {
    model,
    messages,
    temperature: options.temperature || 0.7,
    top_p: options.top_p || 0.9,
    max_tokens: options.max_tokens || 512,
    stream: false,
  };

  try {
    const response = await fetch(GROQ_API_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content || "";

    return {
      content: content.trim(),
      debug: {
        model,
        usage: data.usage,
        finish_reason: data.choices?.[0]?.finish_reason,
      },
    };
  } catch (error: any) {
    throw new Error(`Groq API 調用失敗: ${error.message}`);
  }
}

/**
 * 帶重試機制的調用（多個模型 fallback）
 */
export async function callGroqWithRetry(
  messages: Message[],
  options: GroqOptions = {}
): Promise<{ content: string; debug: any }> {
  
  // 按速度和穩定性排序的模型列表
  const models = [
    GROQ_MODELS.LLAMA_3_8B,    // 最快
    GROQ_MODELS.GEMMA_7B,       // 次快
    GROQ_MODELS.MIXTRAL,        // 備用
  ];

  const errors: any[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await callGroq(messages, { ...options, model });
      return {
        content: result.content,
        debug: {
          ...result.debug,
          attemptedModels: models.slice(0, i + 1),
          success: true,
          provider: "groq",
        },
      };
    } catch (error: any) {
      errors.push({
        model,
        error: error.message,
      });
      
      // 如果不是最後一個模型，繼續嘗試
      if (i < models.length - 1) {
        continue;
      }
    }
  }

  // 所有模型都失敗
  throw {
    message: "All Groq models failed",
    errors,
  };
}