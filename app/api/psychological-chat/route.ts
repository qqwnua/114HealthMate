import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Add system message to guide the AI to provide psychological health advice
  const systemMessage = {
    role: "system",
    content: `你是一個專業的心理健康顧問AI助手。提供有關心理健康、情緒管理、壓力調適和心靈成長的建議。
    請記住：
    1. 提供科學和循證的心理健康信息
    2. 對於嚴重的心理健康問題，建議用戶諮詢專業心理醫師或心理諮商師
    3. 保持溫暖、同理和支持的語氣
    4. 回答應該簡潔明了，但要提供足夠的信息和實用建議
    5. 使用中文回答用戶的問題
    6. 分析用戶提供的心理健康相關關鍵詞，並在回答中標記出來
    7. 提供具體可行的自我照顧和情緒管理策略
    8. 在回答中識別用戶可能的情緒狀態，如焦慮、壓力、悲傷、憤怒等`,
  }

  const augmentedMessages = [systemMessage, ...messages]

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages: augmentedMessages,
  })

  return result.toDataStreamResponse()
}
