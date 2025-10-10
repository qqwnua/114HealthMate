import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Add system message to guide the AI to provide health-related advice
  const systemMessage = {
    role: "system",
    content: `你是一個專業的健康顧問AI助手。提供有關健康、營養、運動和生活方式的建議。
    請記住：
    1. 提供科學和循證的健康信息
    2. 對於嚴重的醫療問題，建議用戶諮詢專業醫生
    3. 保持友好和支持的語氣
    4. 回答應該簡潔明了，但要提供足夠的信息
    5. 使用中文回答用戶的問題
    6. 分析用戶提供的健康相關關鍵詞，並在回答中標記出來`,
  }

  const augmentedMessages = [systemMessage, ...messages]

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages: augmentedMessages,
  })

  return result.toDataStreamResponse()
}
