import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Add system message to guide the AI to provide health plan assistance
  const systemMessage = {
    role: "system",
    content: `你是一個專業的健康計畫智能助理。你的主要職責是：

    1. 協助用戶調整健康計畫內容
    2. 回應用戶的執行成效和身體反應
    3. 處理突發狀況（如受傷、生理異常等）
    4. 提供個人化的健康建議和動機支持
    5. 根據用戶反饋動態調整計畫難度和內容

    請記住：
    - 提供科學和循證的健康建議
    - 對於嚴重的健康問題，建議用戶諮詢專業醫師
    - 保持鼓勵和支持的語氣
    - 根據用戶的具體情況提供個人化建議
    - 使用中文回答用戶的問題
    - 當用戶報告身體不適或受傷時，優先考慮安全性
    - 提供具體可行的計畫調整建議

    你可以：
    - 調整運動強度和頻率
    - 修改飲食建議
    - 重新安排時間表
    - 提供替代運動方案
    - 給予動機支持和鼓勵
    - 解答健康相關疑問`,
  }

  const augmentedMessages = [systemMessage, ...messages]

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages: augmentedMessages,
  })

  return result.toDataStreamResponse()
}
