'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Sparkles, FileQuestion, MessageSquare, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function InterviewAssistant() {
  // 状态管理
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [interviewText, setInterviewText] = useState('');
  const [supplementaryInfo, setSupplementaryInfo] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'questions' | 'evaluation'>('questions');

  // 文件引用
  const resumeFileRef = useRef<HTMLInputElement>(null);
  const jdFileRef = useRef<HTMLInputElement>(null);
  const interviewFileRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setText: (text: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['text/plain', 'application/pdf', 'text/markdown'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.pdf')) {
      toast.error('不支持的文件格式，请上传 TXT 或 PDF 文件');
      return;
    }

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // PDF 文件处理
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('PDF 解析失败');
        }

        const data = await response.json();
        setText(data.text || '');
        toast.success('PDF 文件解析成功');
      } else {
        // TXT 文件处理
        const text = await file.text();
        setText(text);
        toast.success('文件上传成功');
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      toast.error('文件处理失败，请重试');
    }
  };

  // 生成面试题
  const generateQuestions = async () => {
    if (!resumeText || !jdText) {
      toast.error('请填写简历和职位描述（JD）');
      return;
    }

    setMode('questions');
    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: resumeText,
          jd: jdText,
          supplementaryInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('生成面试题失败');
      }

      // 流式读取响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setResult((prev) => prev + chunk);
        }
      }

      toast.success('面试题生成完成');
    } catch (error) {
      console.error('生成面试题错误:', error);
      toast.error('生成面试题失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成面试评价
  const generateEvaluation = async () => {
    if (!resumeText || !jdText || !interviewText) {
      toast.error('请填写简历、职位描述（JD）和面试对话文本');
      return;
    }

    setMode('evaluation');
    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/generate-interview-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: resumeText,
          jd: jdText,
          interviewText,
          supplementaryInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('生成面试评价失败');
      }

      // 流式读取响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setResult((prev) => prev + chunk);
        }
      }

      toast.success('面试评价生成完成');
    } catch (error) {
      console.error('生成面试评价错误:', error);
      toast.error('生成面试评价失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2 mb-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              智能面试助手
            </h1>
          </div>
          <p className="text-muted-foreground">
            基于人工智能，自动生成面试题和面试评价
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：输入区域 */}
          <div className="space-y-6">
            {/* 简历区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  候选人简历
                </CardTitle>
                <CardDescription>
                  上传简历文件或直接粘贴简历内容
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={resumeFileRef}
                    onChange={(e) => handleFileUpload(e, setResumeText)}
                    accept=".txt,.pdf"
                    className="hidden"
                  />
                  <Button
                    onClick={() => resumeFileRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    上传文件
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    支持 TXT、PDF 格式
                  </span>
                </div>
                <Textarea
                  placeholder="在此粘贴简历内容..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </CardContent>
            </Card>

            {/* 职位描述（JD）区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5" />
                  职位描述（JD）
                </CardTitle>
                <CardDescription>
                  上传JD文件或直接粘贴JD内容
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={jdFileRef}
                    onChange={(e) => handleFileUpload(e, setJdText)}
                    accept=".txt,.pdf"
                    className="hidden"
                  />
                  <Button
                    onClick={() => jdFileRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    上传文件
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    支持 TXT、PDF 格式
                  </span>
                </div>
                <Textarea
                  placeholder="在此粘贴职位描述..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </CardContent>
            </Card>

            {/* 面试对话文本区域 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  面试对话文本
                </CardTitle>
                <CardDescription>
                  上传面试对话文件或直接粘贴对话内容（生成面试评价时需要）
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={interviewFileRef}
                    onChange={(e) => handleFileUpload(e, setInterviewText)}
                    accept=".txt,.pdf"
                    className="hidden"
                  />
                  <Button
                    onClick={() => interviewFileRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    上传文件
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    支持 TXT、PDF 格式
                  </span>
                </div>
                <Textarea
                  placeholder="在此粘贴面试对话内容..."
                  value={interviewText}
                  onChange={(e) => setInterviewText(e.target.value)}
                  className="min-h-[150px] resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：操作和结果区域 */}
          <div className="space-y-6">
            {/* 补充信息区域 */}
            <Card>
              <CardHeader>
                <CardTitle>补充信息</CardTitle>
                <CardDescription>
                  可选：填写其他需要考虑的信息（如面试官关注点、特殊要求等）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="在此填写补充信息..."
                  value={supplementaryInfo}
                  onChange={(e) => setSupplementaryInfo(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
                <CardDescription>
                  选择生成面试题或面试评价
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={generateQuestions}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading && mode === 'questions' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <FileQuestion className="w-5 h-5" />
                      生成面试题
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateEvaluation}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading && mode === 'evaluation' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      生成面试评价
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 结果展示 */}
            {result && (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {mode === 'questions' ? '生成的面试题' : '面试评价结果'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {result}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 使用提示 */}
            {!result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">使用提示</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• 生成面试题：需要提供候选人简历和职位描述（JD）</p>
                  <p>• 生成面试评价：需要提供候选人简历、职位描述（JD）和面试对话文本</p>
                  <p>• 支持上传 TXT、PDF 格式文件，系统会自动解析并填充到文本框</p>
                  <p>• 补充信息为可选项，可用于提供额外的上下文信息</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
