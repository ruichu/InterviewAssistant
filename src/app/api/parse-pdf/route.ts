import { NextRequest, NextResponse } from 'next/server';
import { S3Storage, FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

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

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化对象存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 将文件转换为 Buffer 并上传到对象存储
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: `pdfs/${Date.now()}_${file.name}`,
      contentType: file.type,
    });

    // 生成签名 URL
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600, // 1小时有效期
    });

    // 初始化 FetchClient 来解析 URL 内容
    const fetchConfig = new Config();
    const fetchClient = new FetchClient(fetchConfig, customHeaders);

    // 使用 fetch-url 技能解析 PDF
    const response = await fetchClient.fetch(fileUrl);

    if (response.status_code !== 0) {
      throw new Error(`解析失败: ${response.status_message}`);
    }

    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // 返回解析后的文本
    return NextResponse.json({
      text: textContent,
      pages: response.content.length,
    });
  } catch (error) {
    console.error('PDF 解析错误:', error);
    return NextResponse.json(
      { error: 'PDF 解析失败，请重试' },
      { status: 500 }
    );
  }
}
