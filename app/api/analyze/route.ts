import { NextRequest, NextResponse } from "next/server";
import { analyzeBERT } from "@/lib/bertAnalyzer";

export async function POST(req: NextRequest) {
  try {
    console.log("📥 收到分析請求");
    
    // 先取得原始文字來除錯
    const text = await req.text();
    console.log("📝 原始 body:", text.substring(0, 200));
    
    // 嘗試解析 JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError: any) {
      console.error("❌ JSON 解析失敗:", parseError.message);
      console.error("收到的內容:", text);
      
      return NextResponse.json({
        status: "error",
        message: "Invalid JSON format",
        received: text.substring(0, 100),
        error: parseError.message
      }, { status: 400 });
    }
    
    console.log("✅ 解析成功:", body);
    
    // 支援多種欄位名稱
    const message = body.message || body.text || "";
    
    if (!message || typeof message !== 'string') {
      console.error("❌ message 欄位無效:", { message, type: typeof message });
      return NextResponse.json(
        { 
          status: "error", 
          message: "message field is required and must be a string",
          received: body
        },
        { status: 400 }
      );
    }

    console.log("🔍 開始 BERT 分析:", message.substring(0, 50) + "...");

    // 執行完整的 BERT 分析
    const bertResult = await analyzeBERT(message);

    console.log("✅ BERT 分析完成:");
    console.log("  - 風險分數:", bertResult.risk_score);
    console.log("  - 情緒分數:", bertResult.sentiment_score);
    console.log("  - 關鍵字:", bertResult.keywords);
    console.log("  - 緊急程度:", bertResult.urgency_level);

    // 轉換為前端期望的格式（向後兼容）
    const analysis = {
      keywords: bertResult.keywords,
      outline: bertResult.outline,
      sentiment: bertResult.sentiment_score,
      polarity: bertResult.sentiment_score >= 0.6 ? "positive" 
              : bertResult.sentiment_score <= 0.4 ? "negative" 
              : "neutral",
      // 新增欄位
      risk_score: bertResult.risk_score,
      urgency_level: bertResult.urgency_level,
      categories: bertResult.categories,
    };

    return NextResponse.json({
      status: "success",
      analysis,
      bert_full_result: bertResult, // 完整的 BERT 分析結果
      debug: {
        method: "bert_analysis",
        textLength: message.length,
        timestamp: bertResult.timestamp,
      },
    });

  } catch (e: any) {
    console.error("❌ BERT 分析錯誤:", e);
    
    // 在發生未預期錯誤時，回傳一個安全的預設結果
    return NextResponse.json({
      status: "success",
      analysis: {
        keywords: [],
        outline: ["分析系統暫時無法使用"],
        sentiment: 0.5,
        polarity: "neutral",
        risk_score: 0.3,
        urgency_level: "low",
        categories: [],
      },
      debug: {
        error: e?.message || String(e),
      },
    });
  }
}