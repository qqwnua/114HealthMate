// lib/db.ts
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',         // Docker PostgreSQL 帳號
  host: 'localhost',
  database: 'healthmate',
  password: 'postgres',     // Docker PostgreSQL 密碼
  port: 5432,
});