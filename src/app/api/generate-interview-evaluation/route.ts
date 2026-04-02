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
1. **经验知识技能**：重点部分，评估候选人的技术深度、广度和实际应用能力。并考虑项目背景、贡献度和问题解决能力。
2. **能力**：评估候选人的学习创新、逻辑思维方面的能力
3. **价值观**：评估候选人的勤奋与韧性、开放方面的价值观
4. **自驱力**：评估候选人的目标感、目标忠诚度方面的自驱力
5. **岗位匹配度**：综合评估候选人与岗位的匹配程度

如果我给评估维度设定了打分标准，请按照标准打分。

## 输出格式
请按照以下格式输出评价报告：

# 面试评价报告

## 基本信息
- **候选人**：[从简历中提取姓名或标识]
- **应聘岗位**：[从JD中提取岗位名称]

## 综合评价
[1-2段总结性评价，给出整体印象和推荐意见]

## 详细评估

### 1. 经验知识技能
1. 行业知识
S (5 分)：行业认知极深，熟悉趋势、痛点与前沿，能深度洞察并给出专业判断
A (3 分)：行业知识扎实，熟悉主流业务与规则，能独立理解业务场景
B (1 分)：具备基础行业认知，了解基本常识，对复杂场景理解有限
C (0 分)：行业知识匮乏，对业务、规则、场景基本不了解
2. 专业技能
S (5 分)：专业能力突出，能独立解决高难度问题，有可验证的优秀成果
A (3 分)：专业技能扎实，能独立完成核心工作，应对常规复杂问题
B (1 分)：掌握基础技能，可完成简单任务，复杂工作需指导
C (0 分)：专业基础薄弱，无法胜任岗位基本工作要求
3. 管理技能（管理岗）
S (5 分)：统筹、激励、目标管控能力强，有成功团队管理与业绩案例
A (3 分)：具备成熟管理意识，能带团队落地目标，处理常规管理问题
B (1 分)：有基础管理经验，能执行安排，团队统筹能力一般
C (0 分)：无管理思路，无法带队、协调与推进团队目标

- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 2. 能力
1. 学习创新
S (5 分)：学习能力极强，主动迭代，能提出创新性方案并落地
A (3 分)：学习速度快，接受新知识强，有一定优化改进意识
B (1 分)：愿意学习，能掌握基础内容，创新与举一反三较弱
C (0 分)：学习被动迟缓，思维固化，不愿接受新方法
2. 逻辑思维
S (5 分)：逻辑严密，结构化分析，抓核心精准，表达条理极强
A (3 分)：思路清晰，分析有条理，能准确推导问题与解决方案
B (1 分)：逻辑基本通顺，能简单分析，复杂问题易混乱
C (0 分)：逻辑混乱，表达无重点，无法有效分析问题

- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 3. 价值观
1. 勤奋与韧性
S (5 分)：高度自律抗压，面对困难坚持到底，主动补位攻坚
A (3 分)：踏实肯干，抗压性较好，挫折后能快速调整完成目标
B (1 分)：态度端正，能完成本职，压力下偶有退缩需督促
C (0 分)：懒散敷衍，抗压差，遇困难易放弃
2. 开放
S (5 分)：心态开放包容，主动倾听不同意见，善于协作改进
A (3 分)：能接受合理建议，沟通顺畅，具备团队协作意识
B (1 分)：能听取意见但较保守，协作配合度一般
C (0 分)：固执自我，排斥不同观点，难以协作

- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 4. 自驱力
1. 目标感
S (5 分)：目标感极强，主动规划推进，结果导向，自我要求高
A (3 分)：目标清晰，主动执行，能自我驱动达成工作结果
B (1 分)：有基本目标意识，需提醒推动，主动性一般
C (0 分)：目标模糊，被动应付，无自我要求
2. 目标忠诚度
S (5 分)：目标坚定，持续投入，不受干扰，坚决完成承诺
A (3 分)：围绕目标稳定执行，偶有波动仍能达成结果
B (1 分)：能跟进目标，易受影响，需外部监督
C (0 分)：易放弃目标，执行力差，无法兑现结果

- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

### 5. 意愿（求职意向度）
S (5 分)：意向极强，高度认可公司岗位，入职迫切，稳定性极佳
A (3 分)：意向积极，认可度高，入职意愿明确，稳定性较好
B (1 分)：有一定意向，态度尚可，仍在观望对比
C (0 分)：意向极低，动机不足，稳定性差，入职可能性极小

- **具体表现**：[结合面试对话中的具体事例说明]
- **评分依据**：[说明打分理由]

## 综合意见
- **优势**：[请具体说明]
- **劣势**：[请具体说明]


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
