// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // 讓 / 指到 public/index.html

// 健康檢查
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, method: "GET", server: "express" });
});

// 1) 分析端點（先用假資料讓流程通）
app.post("/api/analyze", (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ status: "error", message: "message is required" });

  const outline = String(message)
    .replace(/\s+/g, " ")
    .split(/[。.!?；;]\s*/).filter(Boolean)
    .slice(0, 3);

  return res.json({
    status: "success",
    analysis: { outline, sentiment: 0.5, polarity: "neutral" }
  });
});

// 2) 回覆端點（用 OpenAI 生成回覆；沒有金鑰就回固定字）
app.post("/api/respond", async (req, res) => {
  try {
    const { message, analysis, history = [], model = "gpt-4o-mini" } = req.body || {};
    if (!message) return res.status(400).json({ status: "error", message: "message is required" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      // 沒金鑰時，先回固定文字，讓前端流程不中斷
      return res.json({
        status: "success",
        reply: "（示範）目前未設定 OPENAI_API_KEY，所以回覆用假內容：收到你的訊息啦！",
        debug: { used_model: "none" }
      });
    }

    const systemPrompt =
      `You are a helpful assistant. Use the outline and sentiment to adjust tone/structure.\n` +
      `Outline: ${(analysis?.outline || []).join(" / ")}\n` +
      `SentimentScore(0-1): ${analysis?.sentiment ?? "n/a"}  Polarity: ${analysis?.polarity ?? "n/a"}`;

    const body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(Array.isArray(history) ? history : []),
        { role: "user", content: message }
      ],
      temperature: 0.7
    };

    // Node 18+ 內建 fetch；若更舊版本請自行安裝 node-fetch
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`OpenAI error: ${r.status} ${t}`);
    }

    const json = await r.json();
    const reply = json?.choices?.[0]?.message?.content ?? "(no content)";

    res.json({ status: "success", reply, debug: { used_model: model } });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message || String(e) });
  }
});

// 啟動
app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
