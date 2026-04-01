import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { resume, jd, interviewText, supplementaryInfo } = await request.json();

    // 验证必需参数
    if (!resume || !jd || !interviewText) {
      return new Response(
        JSON.stringify({ error: '缺少必需参数：简历、职位描述（JD）和面试对话文本' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 LLM 客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示词
    const systemPrompt = `你是一位资深的面试官和人才评估专家。你的任务是根据候选人的简历、职位描述、面试对话文本以及补充信息，对候选人进行全面的面试评价。

请从以下维度进行评估：

## 评估维度
1. **技术能力**：评估候选人的技术深度、广度和实际应用能力
2. **项目经验**：评估候选人的项目背景、贡献度和问题解决能力
3. **沟通能力**：评估候选人的表达能力、逻辑思维和沟通技巧
4. **学习能力**：评估候选人的学习能力、适应性和成长潜力
5. **职业素养**：评估候选人的工作态度、责任心和团队协作能力
6. **岗位匹配度**：综合评估候选人与岗位的匹配程度

## 评价标准
- 优秀（90-100分）：各项能力突出，远超岗位要求
- 良好（80-89分）：各项能力良好，满足岗位要求
- 合格（70-79分）：基本能力达标，部分能力有待提升
- 不合格（60-69分）：部分能力不足，需要较大提升
- 不推荐（<60分）：多项能力不达标，不建议录用

## 输出格式
请按照以下格式输出评价报告：

# 面试评价报告

## 基本信息
- **候选人**：[从简历中提取姓名或标识]
- **应聘岗位**：[从JD中提取岗位名称]
- **面试时间**：[如对话中有提及]

## 综合评价
[1-2段总结性评价，给出整体印象和推荐意见]

## 详细评估

### 1. 技术能力（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 2. 项目经验（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 3. 沟通能力（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 4. 学习能力（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 5. 职业素养（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 6. 岗位匹配度（XX分）
- **评估要点**：
  - [要点1]
  - [要点2]
- **具体表现**：[结合简历、JD和面试对话说明匹配度]
- **评分依据**：[说明打分理由]

## 综合评分
**总分：XX分 / 100分**

## 推荐意见
- **推荐等级**：[强烈推荐 / 推荐 / 有条件推荐 / 不推荐]
- **推荐理由**：[2-3句话说明推荐或不推荐的主要理由]
- **关注建议**：[如果入职后需要关注或培养的方面]

## 备注说明
[如果有其他需要补充说明的内容，在此处填写]`;

    // 构建用户消息
    let userMessage = `请根据以下信息生成面试评价：

## 候选人简历
${resume}

## 职位描述（JD）
${jd}

## 面试对话文本
${interviewText}`;

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
    console.error('生成面试评价错误:', error);
    return new Response(
      JSON.stringify({ error: '生成面试评价失败，请重试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
