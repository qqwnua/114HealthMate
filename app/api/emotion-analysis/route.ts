import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

const emotionSchema = z.object({
  emotions: z.object({
    joy: z.number().min(0).max(1).describe("喜悅程度 (0-1)"),
    sadness: z.number().min(0).max(1).describe("悲傷程度 (0-1)"),
    anger: z.number().min(0).max(1).describe("憤怒程度 (0-1)"),
    fear: z.number().min(0).max(1).describe("恐懼/焦慮程度 (0-1)"),
    surprise: z.number().min(0).max(1).describe("驚訝程度 (0-1)"),
    disgust: z.number().min(0).max(1).describe("厭惡程度 (0-1)"),
  }),
  primaryEmotion: z.string().describe("主要情緒"),
  confidence: z.number().min(0).max(1).describe("分析信心度"),
  reasoning: z.string().describe("分析理由"),
})

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "無效的文本輸入" }, { status: 400 })
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: emotionSchema,
      prompt: `
        請分析以下中文文本的情緒內容，並提供詳細的情緒分析：

        文本: "${text}"

        請分析文本中表達的情緒，包括：
        1. 六種基本情緒的強度 (喜悅、悲傷、憤怒、恐懼、驚訝、厭惡)
        2. 主要情緒
        3. 分析的信心度
        4. 分析理由

        注意：
        - 每種情緒的數值應該在 0-1 之間
        - 主要情緒應該是最突出的情緒
        - 如果文本情緒不明顯，所有數值應該較低
        - 考慮中文語境和文化背景
      `,
    })

    return Response.json(result.object)
  } catch (error) {
    console.error("情緒分析錯誤:", error)
    return Response.json({ error: "情緒分析失敗" }, { status: 500 })
  }
}
