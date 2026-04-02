/**
 * 后端入口点
 * 设置 Express 服务器、配置 CORS、配置路由和集成 AI
 */

const dotenv = require('dotenv');
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ChatRequest, formatMessagesForAPI, getErrorMessage, AI_CONFIG } from '@ai-agent/shared';
import type { ServerConfig } from './types';

// ============================================
// 配置设置
// ============================================

/**
 * 从环境变量加载和验证服务器配置
 */
function loadConfig(): ServerConfig {
  const config: ServerConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };

  // 验证必需的环境变量
  if (!config.deepseekApiKey) {
    console.error('❌ 错误：DEEPSEEK_API_KEY 未设置。请将其添加到 .env 文件中');
    process.exit(1);
  }

  return config;
}

const config = loadConfig();

// ============================================
// Express 应用初始化
// ============================================

const app = express();

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
);

// ============================================
// AI 响应生成
// ============================================

/**
 * 调用 DeepSeek API 获取 AI 响应
 */
async function callDeepSeekAPI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Promise<string> {
  const response = await fetch(
    'https://api.deepseek.com/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '无法获取回复';
}

// ============================================
// 路由
// ============================================

/**
 * 健康检查端点
 * 返回服务器是否运行正常以及配置信息（仅返回安全值）
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 主要聊天 API 端点，支持流式编码
 * 接受聊天消息，事件流式返回 AI 响应
 *
 * 请求体：
 * {
 *   "messages": [
 *     { "id": "msg_xxx", "role": "user", "content": "\u4f60\u597d" },
 *     { "id": "msg_yyy", "role": "assistant", "content": "\u4f60\u597d\uff01" }
 *   ],
 *   "systemPrompt": "\u53ef\u9009\u7684\u7cfb\u7edf\u6d88\u606f"
 * }
 *
 * 响应：
 * 服务端发送事件（SSE）流式，数据为 JSON 字符串
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // 验证请求体
    const { messages, systemPrompt } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: '请求中必须包含 messages 数组',
        },
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'EMPTY_MESSAGES',
          message: '消息数组不能为空',
        },
      });
    }

    // Format messages for AI SDK
    const formattedMessages = formatMessagesForAPI(messages);

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 构建系统消息（可以使用自定义系统提示）
    const systemMessage = systemPrompt
      ? systemPrompt
      : '你是一个有效的 AI 助手。提供清晰、准确和简洁的回答。支持上下文保持和多语言对话。';

    // 调用 DeepSeek API
    const response = await callDeepSeekAPI(
      formattedMessages as Array<{ role: string; content: string }>,
      systemMessage,
    );

    const processingTime = Date.now() - startTime;

    // 发送响应
    res.write(`data: ${JSON.stringify({ content: response, type: 'text' })}\n\n`);

    // 发送完成消息
    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        processingTime,
        timestamp: new Date().toISOString(),
      })}\n\n`,
    );

    res.end();
  } catch (error) {
    // 错误处理
    console.error('聊天 API 错误:', error);

    const errorMessage = getErrorMessage(error);

    res.setHeader('Content-Type', 'text/event-stream');

    if (!res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: {
            code: 'CHAT_ERROR',
            message: errorMessage,
          },
        })}\n\n`,
      );
    }

    res.end();
  }
});

/**
 * 不存在的路由的捕获
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// ============================================
// 服务器启动
// ============================================

/**
 * 开启 Express 服务器
 */
const server = app.listen(config.port, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 AI Agent 后端服务器已启动');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 服务器运行于: http://localhost:${config.port}`);
  console.log(`🔧 环境: ${config.nodeEnv}`);
  console.log(`🤖 AI 模型: ${AI_CONFIG.MODEL}`);
  console.log(`📡 API 基础 URL: ${AI_CONFIG.BASE_URL}`);
  console.log('');
  console.log('可用的端点:');
  console.log('  • GET  /health         - 健康检查');
  console.log('  • POST /api/chat       - 与 AI 聊天（SSE 流式传输）');
  console.log('');
});

/**
 * 优雅地处理服务器关闭
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM 已接收，正在优雅地关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 已接收，正在优雅地关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
