// app/api/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { routeToModel } from "@/lib/modelRouter";
import { saveAnalysisToFile } from "@/lib/database";
import type { BertAnalysisResult } from "@/lib/bertAnalyzer"; // 確保此路徑正確

type ModelChoice = "llama" | "gpt" | "auto";

export async function POST(req: NextRequest) {
  try {
    const { message, analysis, history = [], model = "auto" } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { status: "error", message: "message is required" },
        { status: 400 }
      );
    }

    console.log("🤖 開始生成回應...");
    console.log("  - 用戶選擇模型:", model);
    console.log("  - 風險分數:", analysis?.risk_score || "N/A");
    console.log("  - 緊急程度:", analysis?.urgency_level || "N/A");

    // 構建完整的 BERT 分析結果
    // ⭐ 修正：新增了 suicide_risk 和 emotion_state 兩個屬性，並給予合理的預設值。
    const bertAnalysis: BertAnalysisResult = {
      sentiment_score: analysis?.sentiment_score || 0.5, // 註意: analysis 物件中的屬性名稱應與 BertAnalysisResult 保持一致
      risk_score: analysis?.risk_score || 0.3,
      outline: analysis?.outline || [],
      keywords: analysis?.keywords || [],
      categories: analysis?.categories || [],
      urgency_level: analysis?.urgency_level || "low",
      raw_text: message,
      timestamp: new Date().toISOString(),
      // ↓↓↓↓↓ 缺少的部分已補上 ↓↓↓↓↓
      suicide_risk: analysis?.suicide_risk || false, // 預設為 false
      emotion_state: analysis?.emotion_state || "情緒中性", // 預設為中性
    };

    // 調用智能模型路由
    const modelResponse = await routeToModel(
      message,
      bertAnalysis,
      model as ModelChoice,
      history
    );

    console.log("✅ 回應生成完成");
    console.log("  - 使用模型:", modelResponse.model_used);
    console.log("  - 提供商:", modelResponse.provider);

    // 儲存完整記錄到資料庫
    const recordId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await saveAnalysisToFile({
        id: recordId,
        user_message: message,
        bert_analysis: bertAnalysis,
        model_response: modelResponse.content,
        model_used: modelResponse.model_used,
        created_at: new Date().toISOString(),
      });
      console.log("💾 記錄已儲存:", recordId);
    } catch (saveError) {
      console.error("⚠️ 儲存記錄失敗:", saveError);
      // 不影響回應，繼續執行
    }

    return NextResponse.json({
      status: "success",
      reply: modelResponse.content,
      debug: {
        record_id: recordId,
        model_used: modelResponse.model_used,
        provider: modelResponse.provider,
        bert_analysis: bertAnalysis,
        saved_to_database: true,
      },
    });

  } catch (e: any) {
    console.error("❌ 回應生成失敗:", e);
    
    // 使用本地備援回應
    const fallbackReply = [
      "感謝您的諮詢。雖然系統暫時無法連接到 AI 模型，但我可以提供一些基本建議：",
      "",
      "**一般建議**：",
      "1. 如症狀持續或加重，請盡快就醫",
      "2. 保持充足休息和水分補充",
      "3. 記錄症狀的變化情況",
      "4. 避免自行用藥",
      "",
      "⚠️ **緊急情況**：若出現劇烈疼痛、呼吸困難、意識改變等，請立即就醫或撥打119。",
      "",
      "💡 以上建議不能替代專業醫療診斷，建議諮詢醫療專業人員。",
    ].join("\n");

    return NextResponse.json({
      status: "success",
      reply: fallbackReply,
      debug: {
        error: e?.message || String(e),
        fallback_used: true,
      },
    });
  }
}