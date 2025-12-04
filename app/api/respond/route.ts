// app/api/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { routeToModel } from "@/lib/modelRouter";
import type { BertAnalysisResult } from "@/lib/bertAnalyzer";
// ⭐ 修改：直接引用您專案現有的 DB 連線，而不是自己建立
import { pool } from "@/lib/db"; 

type ModelChoice = "llama" | "gpt" | "auto";

export async function POST(req: NextRequest) {
  try {
    const { message, analysis, history = [], model = "auto", userId } = await req.json();
    
    if (!message) {
      return NextResponse.json(
        { status: "error", message: "message is required" },
        { status: 400 }
      );
    }

    // 1. 先執行 AI 分析與生成
    // 構建 BERT 分析結果物件
    const bertAnalysis: BertAnalysisResult = {
      sentiment_score: analysis?.sentiment_score || 0.5,
      risk_score: analysis?.risk_score || 0.3,
      outline: analysis?.outline || [],
      keywords: analysis?.keywords || [],
      categories: analysis?.categories || [],
      urgency_level: analysis?.urgency_level || "low",
      raw_text: message,
      timestamp: new Date().toISOString(),
      suicide_risk: analysis?.suicide_risk || false,
      emotion_state: analysis?.emotion_state || "情緒中性",
    };

    // 調用模型路由
    const modelResponse = await routeToModel(
      message,
      bertAnalysis,
      model as ModelChoice,
      history
    );

    // 2. 寫入資料庫 (使用 shared pool)
    let recordId = null;
    
    if (userId) {
      try {
        const insertQuery = `
          INSERT INTO consultations 
          (user_id, user_message, model_response, risk_level, risk_score, keywords, categories, model_used, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING id;
        `;
        
        const values = [
          userId,                          
          message,                         
          modelResponse.content,           
          bertAnalysis.urgency_level,      
          bertAnalysis.risk_score,         
          JSON.stringify(bertAnalysis.keywords),   
          JSON.stringify(bertAnalysis.categories), 
          modelResponse.model_used         
        ];

        // ⭐ 使用共用的 pool 查詢
        const dbRes = await pool.query(insertQuery, values);
        if (dbRes.rows.length > 0) {
          recordId = dbRes.rows[0].id;
          console.log("💾 資料已寫入資料庫 (ID):", recordId);
        }
      } catch (dbError) {
        console.error("⚠️ 資料庫寫入失敗:", dbError);
        // 不阻擋回傳，僅紀錄錯誤
      }
    }

    return NextResponse.json({
      status: "success",
      reply: modelResponse.content,
      debug: {
        record_id: recordId,
        model_used: modelResponse.model_used,
        bert_analysis: bertAnalysis,
      },
    });

  } catch (e: any) {
    console.error("❌ API Error:", e);
    return NextResponse.json(
      { status: "error", message: e.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}