// app/api/statistics/route.ts
import { NextResponse } from 'next/server';
import { getStatistics, getAllAnalyses, exportToCSV } from '@/lib/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format');

    // 如果請求 CSV 格式
    if (format === 'csv') {
      const csv = await exportToCSV();
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="medical-analysis.csv"',
        },
      });
    }

    // 獲取統計數據
    const stats = await getStatistics();
    const recentAnalyses = (await getAllAnalyses()).slice(0, 10);

    return NextResponse.json({
      success: true,
      statistics: stats,
      recent_analyses: recentAnalyses.map(a => ({
        id: a.id,
        created_at: a.created_at,
        user_message: a.user_message.substring(0, 100) + (a.user_message.length > 100 ? '...' : ''),
        risk_score: a.bert_analysis.risk_score,
        urgency_level: a.bert_analysis.urgency_level,
        model_used: a.model_used,
      })),
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}