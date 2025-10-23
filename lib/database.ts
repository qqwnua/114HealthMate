// lib/database.ts
// 簡單的檔案系統資料庫（可改用 MongoDB/PostgreSQL）

import { promises as fs } from 'fs';
import path from 'path';
import type { BertAnalysisResult } from './bertAnalyzer';

const DATA_DIR = path.join(process.cwd(), 'data', 'analyses');

export type AnalysisRecord = {
  id: string;
  user_message: string;
  bert_analysis: BertAnalysisResult;
  model_response: string;
  model_used: string;
  created_at: string;
};

/**
 * 確保資料目錄存在
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * 儲存分析結果到檔案
 */
export async function saveAnalysisToFile(record: AnalysisRecord): Promise<void> {
  await ensureDataDir();
  
  const filename = `${record.id}.json`;
  const filepath = path.join(DATA_DIR, filename);
  
  await fs.writeFile(filepath, JSON.stringify(record, null, 2), 'utf-8');
  
  console.log(`✅ 分析結果已儲存: ${filename}`);
}

/**
 * 讀取特定分析記錄
 */
export async function getAnalysisById(id: string): Promise<AnalysisRecord | null> {
  try {
    const filepath = path.join(DATA_DIR, `${id}.json`);
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 讀取所有分析記錄
 */
export async function getAllAnalyses(): Promise<AnalysisRecord[]> {
  try {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    
    const analyses = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
          return JSON.parse(data);
        })
    );
    
    return analyses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * 刪除分析記錄
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
  try {
    const filepath = path.join(DATA_DIR, `${id}.json`);
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成統計報告
 */
export async function getStatistics(): Promise<any> {
  const analyses = await getAllAnalyses();
  
  if (analyses.length === 0) {
    return {
      total: 0,
      avgRiskScore: 0,
      avgSentimentScore: 0,
      urgencyDistribution: {},
      topKeywords: [],
    };
  }
  
  const avgRiskScore = analyses.reduce((sum, a) => sum + a.bert_analysis.risk_score, 0) / analyses.length;
  const avgSentimentScore = analyses.reduce((sum, a) => sum + a.bert_analysis.sentiment_score, 0) / analyses.length;
  
  // 緊急程度分佈
  const urgencyDistribution = analyses.reduce((acc, a) => {
    const level = a.bert_analysis.urgency_level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // 統計關鍵字頻率
  const keywordFreq = new Map<string, number>();
  analyses.forEach(a => {
    a.bert_analysis.keywords.forEach(kw => {
      keywordFreq.set(kw, (keywordFreq.get(kw) || 0) + 1);
    });
  });
  
  const topKeywords = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));
  
  return {
    total: analyses.length,
    avgRiskScore: Math.round(avgRiskScore * 100) / 100,
    avgSentimentScore: Math.round(avgSentimentScore * 100) / 100,
    urgencyDistribution,
    topKeywords,
    modelUsage: analyses.reduce((acc, a) => {
      acc[a.model_used] = (acc[a.model_used] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * 匯出所有資料為 CSV（方便分析）
 */
export async function exportToCSV(): Promise<string> {
  const analyses = await getAllAnalyses();
  
  const headers = [
    'ID',
    'Created At',
    'User Message',
    'Risk Score',
    'Sentiment Score',
    'Urgency Level',
    'Keywords',
    'Categories',
    'Model Used'
  ].join(',');
  
  const rows = analyses.map(a => [
    a.id,
    a.created_at,
    `"${a.user_message.replace(/"/g, '""')}"`,
    a.bert_analysis.risk_score,
    a.bert_analysis.sentiment_score,
    a.bert_analysis.urgency_level,
    `"${a.bert_analysis.keywords.join(';')}"`,
    `"${a.bert_analysis.categories.join(';')}"`,
    a.model_used
  ].join(','));
  
  return [headers, ...rows].join('\n');
}