import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { resume, jd, supplementaryInfo } = await request.json();

    // 验证必需参数
    if (!resume || !jd) {
      return new Response(
        JSON.stringify({ error: '缺少必需参数：简历和职位描述（JD）' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示词
    const systemPrompt = `你是一位资深的面试官和人才评估专家。你的任务是根据候选人的简历和职位描述，生成一套全面、有针对性的面试题。

请遵循以下原则：
1. 生成 10-15 个面试题，覆盖不同维度（技术能力、项目经验、软技能、职业规划等）
2. 问题应该具有针对性和深度，能够有效评估候选人的实际能力
3. 每个问题后面简要说明该问题的考察目的
4. 问题的难度应该适中，既不要太简单也不要过于刁钻
5. 如果职位描述中有特定的技术栈或技能要求，确保相关问题涵盖这些要求
6. 如果补充信息中有特定的关注点，确保相关问题能够体现这些关注点

请按照以下格式输出面试题：

# 面试题

## 技术能力类
1. [问题内容]
   - 考察目的：[说明]

## 项目经验类
2. [问题内容]
   - 考察目的：[说明]

## 软技能类
3. [问题内容]
   - 考察目的：[说明]

## 职业规划类
4. [问题内容]
   - 考察目的：[说明]

## 其他类
5. [问题内容]
   - 考察目的：[说明]`;

    // 构建用户消息
    let userMessage = `请根据以下信息生成面试题：

## 候选人简历
${resume}

## 职位描述（JD）
${jd}`;

    if (supplementaryInfo) {
      userMessage += `

## 补充信息
${supplementaryInfo}`;
    }

    // 构建消息列表
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    // 创建流式响应
    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.5,
    });

    // 返回 SSE 流式响应
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('流式输出错误:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('生成面试题错误:', error);
    return new Response(
      JSON.stringify({ error: '生成面试题失败，请重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
