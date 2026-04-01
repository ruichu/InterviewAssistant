import { NextRequest, NextResponse } from 'next/server';

// 使用 require 导入 pdf-parse 以避免类型问题
const pdfParse = require('pdf-parse');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '没有找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: '不支持的文件格式，请上传 PDF 文件' }, { status: 400 });
    }

    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 解析 PDF
    const data = await pdfParse(buffer);

    // 返回解析后的文本
    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
    });
  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败，请重试' },
      { status: 500 }
    );
  }
}
