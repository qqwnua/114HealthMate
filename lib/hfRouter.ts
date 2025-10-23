// lib/hfRouter.ts
// Hugging Face API 調用工具

const HF_API_KEY = process.env.HF_API_KEY || "";
const HF_API_BASE = "https://api-inference.huggingface.co/models/";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type HFOptions = {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  max_new_tokens?: number;
};

/**
 * 調用 Hugging Face Inference API
 */
async function callHuggingFace(
  model: string,
  messages: Message[],
  options: HFOptions = {}
): Promise<{ content: string; debug?: any }> {
  
  // 處理模型名稱 (移除可能的 provider 後綴)
  const modelName = model.split(":")[0];
  
  // 構建 prompt (因為很多模型不支持 messages 格式)
  let prompt = "";
  for (const msg of messages) {
    if (msg.role === "system") {
      prompt += `System: ${msg.content}\n\n`;
    } else if (msg.role === "user") {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === "assistant") {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }
  prompt += "Assistant: ";

  const requestBody = {
    inputs: prompt,
    parameters: {
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 0.9,
      max_new_tokens: options.max_new_tokens || options.max_tokens || 512,
      return_full_text: false,
    },
  };

  const response = await fetch(`${HF_API_BASE}${modelName}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HF API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  // HF 返回格式可能是數組
  let content = "";
  if (Array.isArray(data) && data[0]?.generated_text) {
    content = data[0].generated_text;
  } else if (data.generated_text) {
    content = data.generated_text;
  } else {
    content = JSON.stringify(data);
  }

  return {
    content: content.trim(),
    debug: { model: modelName, status: response.status },
  };
}

/**
 * 帶重試機制的調用函數
 */
export async function callWithRetry(
  primaryModel: string,
  fallbackModels: string,
  messages: Message[],
  options: HFOptions = {}
): Promise<{ content: string; debug: any }> {
  
  const models = [primaryModel];
  
  // 解析 fallback 模型列表
  if (fallbackModels) {
    const fallbacks = fallbackModels.split(",").map(m => m.trim()).filter(Boolean);
    models.push(...fallbacks);
  }

  const errors: any[] = [];

  // 逐個嘗試模型
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await callHuggingFace(model, messages, options);
      return {
        content: result.content,
        debug: {
          ...result.debug,
          attemptedModels: models.slice(0, i + 1),
          success: true,
        },
      };
    } catch (error: any) {
      errors.push({
        model,
        error: error.message || String(error),
      });
      
      // 如果不是最後一個模型，繼續嘗試
      if (i < models.length - 1) {
        continue;
      }
    }
  }

  // 所有模型都失敗
  throw {
    message: "All models failed",
    errors,
  };
}

/**
 * 用於文本分析的簡單調用 (BERT 類模型)
 */
export async function analyzeText(
  text: string,
  model: string = "ckiplab/bert-base-chinese"
): Promise<any> {
  
  const response = await fetch(`${HF_API_BASE}${model}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }

  return await response.json();
}