import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: process.env.DB_USER || "postgres",      // 建議用環境變數
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "healthmate",
  password: process.env.DB_PASSWORD || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
});

// 連線測試 (開發用)
pool
  .connect()
  .then(() => console.log("✅ PostgreSQL 連線成功"))
  .catch((err) => console.error("❌ PostgreSQL 連線失敗:", err));
