// app/api/health/reports/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    // 1. 驗證檔案類型
    if (!file.type.match(/^(image\/|application\/pdf)/)) {
      return NextResponse.json(
        { error: '不支援的檔案格式' },
        { status: 400 }
      )
    }
    
    // 2. OCR 或 PDF 解析（可使用 Tesseract.js 或 pdf-parse）
    // 3. 使用 AI 提取健康指標
    // 4. 儲存到資料庫
    
    return NextResponse.json({
      success: true,
      reportId: 'generated-id',
      findings: []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}