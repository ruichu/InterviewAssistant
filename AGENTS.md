# 智能面试助手 - 项目文档

## 项目概览

智能面试助手是一个基于 AI 的单页面应用，旨在帮助面试官自动生成面试题和面试评价。该应用可以嵌入到飞书应用中，依赖飞书授权，支持文件上传（TXT、PDF）和文本粘贴两种方式输入候选人简历、职位描述（JD）和面试对话文本。

## 核心功能

1. **生成面试题**：根据候选人简历、职位描述（JD）和补充信息，自动生成一套全面的面试题
2. **生成面试评价**：根据候选人简历、职位描述（JD）、面试对话文本和补充信息，自动生成详细的面试评价报告
3. **文件上传与解析**：支持上传 TXT 和 PDF 格式的文件，自动解析并填充到对应的文本框
4. **流式输出**：使用 SSE 协议实现流式输出，提供更好的用户体验

## 技术栈

- **框架**：Next.js 16 (App Router)
- **语言**：TypeScript 5
- **UI 组件**：shadcn/ui (基于 Radix UI)
- **样式**：Tailwind CSS 4
- **AI 能力**：coze-coding-dev-sdk (LLM + Fetch + Storage)
- **文件解析**：FetchClient + S3Storage (PDF 文件解析)
- **状态管理**：React Hooks (useState, useRef, useEffect)
- **消息提示**：Sonner

## 项目结构

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── parse-pdf/
│   │   │   │   └── route.ts          # PDF 解析接口
│   │   │   ├── generate-interview-questions/
│   │   │   │   └── route.ts          # 生成面试题接口
│   │   │   └── generate-interview-evaluation/
│   │   │       └── route.ts          # 生成面试评价接口
│   │   ├── layout.tsx                 # 根布局（包含 Toaster）
│   │   ├── page.tsx                   # 主页面（面试助手界面）
│   │   └── globals.css                # 全局样式
│   ├── components/
│   │   └── ui/                        # shadcn/ui 组件库
│   ├── hooks/                         # 自定义 Hooks
│   ├── lib/                           # 工具库
│   └── server.ts                      # 服务器配置
├── public/                            # 静态资源
├── .coze                              # 项目配置
├── package.json                       # 依赖配置
└── tsconfig.json                      # TypeScript 配置
```

## 构建和测试命令

### 开发环境

```bash
# 启动开发服务器（支持热更新）
coze dev

# 或者
pnpm dev
```

### 构建命令

```bash
# 构建生产版本
coze build

# 或者
pnpm build
```

### 类型检查

```bash
# TypeScript 类型检查
npx tsc --noEmit
```

## API 接口说明

### 1. PDF 解析接口

**路径**：`POST /api/parse-pdf`

**功能**：解析上传的 PDF 文件，提取文本内容

**实现方式**：
1. 使用 S3Storage 将 PDF 文件上传到对象存储
2. 生成签名 URL
3. 使用 FetchClient 解析 URL 上的 PDF 内容
4. 提取并返回文本内容

**请求**：
- Content-Type: `multipart/form-data`
- Body: `FormData`，包含 `file` 字段（PDF 文件）

**响应**：
```json
{
  "text": "提取的文本内容",
  "pages": 3
}
```

**错误响应**：
```json
{
  "error": "错误信息"
}
```

### 2. 生成面试题接口

**路径**：`POST /api/generate-interview-questions`

**功能**：根据简历、JD 和补充信息生成面试题

**请求**：
- Content-Type: `application/json`
- Body:
```json
{
  "resume": "候选人简历内容",
  "jd": "职位描述内容",
  "supplementaryInfo": "补充信息（可选）"
}
```

**响应**：SSE 流式响应，逐步输出生成的面试题

**错误响应**：
```json
{
  "error": "错误信息"
}
```

### 3. 生成面试评价接口

**路径**：`POST /api/generate-interview-evaluation`

**功能**：根据简历、JD、面试对话和补充信息生成面试评价

**请求**：
- Content-Type: `application/json`
- Body:
```json
{
  "resume": "候选人简历内容",
  "jd": "职位描述内容",
  "interviewText": "面试对话文本",
  "supplementaryInfo": "补充信息（可选）"
}
```

**响应**：SSE 流式响应，逐步输出生成的面试评价

**错误响应**：
```json
{
  "error": "错误信息"
}
```

## 代码风格指南

### TypeScript 规范

1. **严格模式**：项目使用严格模式，所有类型必须明确定义
2. **组件类型**：React 组件必须使用函数组件，配合 TypeScript 类型定义
3. **异步处理**：异步操作必须使用 `async/await`，并配合 `try-catch` 错误处理

### 命名规范

1. **文件命名**：使用 kebab-case（如 `interview-assistant.tsx`）
2. **组件命名**：使用 PascalCase（如 `InterviewAssistant`）
3. **变量命名**：使用 camelCase（如 `resumeText`）
4. **常量命名**：使用 UPPER_SNAKE_CASE（如 `API_BASE_URL`）

### 代码组织

1. **导入顺序**：
   - React 相关
   - 第三方库
   - 本地组件/工具
   - 类型定义

2. **组件结构**：
   - Hooks 定义
   - 状态管理
   - 事件处理函数
   - 渲染函数

## 测试说明

### 类型检查

在提交代码前，必须运行类型检查：

```bash
npx tsc --noEmit
```

### 功能测试

1. **文件上传测试**：
   - 测试 TXT 文件上传和解析
   - 测试 PDF 文件上传和解析
   - 测试不支持的文件格式

2. **生成面试题测试**：
   - 测试完整输入（简历 + JD + 补充信息）
   - 测试最小输入（简历 + JD）
   - 测试流式输出

3. **生成面试评价测试**：
   - 测试完整输入（简历 + JD + 面试对话 + 补充信息）
   - 测试最小输入（简历 + JD + 面试对话）
   - 测试流式输出

4. **错误处理测试**：
   - 测试缺失必需参数
   - 测试网络错误
   - 测试文件解析失败

## 安全注意事项

1. **API 密钥管理**：所有 API 密钥通过环境变量管理，禁止硬编码
2. **请求头转发**：使用 `HeaderUtils.extractForwardHeaders()` 提取和转发请求头
3. **输入验证**：所有用户输入必须进行验证和清理
4. **文件上传**：严格限制文件类型（仅支持 TXT、PDF），防止恶意文件上传
5. **错误信息**：生产环境中不暴露详细的错误堆栈信息

## 性能优化

1. **流式输出**：使用 SSE 协议实现流式输出，提升用户体验
2. **代码分割**：Next.js 自动进行代码分割，按需加载
3. **图片优化**：使用 Next.js Image 组件优化图片加载
4. **缓存策略**：合理使用 HTTP 缓存策略

## 部署说明

### 开发环境

1. 使用 `coze dev` 启动开发服务器
2. 自动支持热更新（HMR）
3. 端口：5000

### 生产环境

1. 运行 `coze build` 构建生产版本
2. 运行 `coze start` 启动生产服务器
3. 确保环境变量配置正确

## 常见问题

### 1. PDF 解析失败

**问题**：上传 PDF 文件后提示解析失败

**解决方案**：
- 检查 PDF 文件是否损坏
- 确认 PDF 文件是可读的文本 PDF，不是扫描件
- 查看服务器日志获取详细错误信息

### 2. 生成内容为空

**问题**：点击生成按钮后没有输出内容

**解决方案**：
- 确认已填写所有必需的输入字段
- 检查网络连接是否正常
- 查看浏览器控制台和服务器日志

### 3. 流式输出卡住

**问题**：生成过程中流式输出突然停止

**解决方案**：
- 检查网络连接是否稳定
- 刷新页面重试
- 查看服务器日志是否有错误

### 4. 类型检查失败

**问题**：运行 `npx tsc --noEmit` 时报错

**解决方案**：
- 检查是否有未定义的类型
- 确认所有导入都正确
- 运行 `pnpm install` 确保依赖完整

## 飞书集成说明

本应用设计为嵌入飞书应用，依赖飞书授权。具体集成步骤：

1. 在飞书开放平台创建应用
2. 配置 OAuth 2.0 授权
3. 在应用中嵌入本应用
4. 使用飞书 JS SDK 获取用户信息和权限
5. 根据飞书用户信息进行权限控制

## 待办事项

- [ ] 集成飞书 OAuth 授权
- [ ] 添加用户权限管理
- [ ] 实现历史记录功能
- [ ] 添加导出功能（PDF、Word）
- [ ] 优化移动端适配
- [ ] 添加更多文件格式支持（Word、Excel）
- [ ] 实现批量处理功能

## 更新日志

### v1.0.0 (2026-04-01)

- 初始版本发布
- 实现生成面试题功能
- 实现生成面试评价功能
- 支持 TXT、PDF 文件上传和解析
- 实现流式输出
- 完成基础 UI 设计
