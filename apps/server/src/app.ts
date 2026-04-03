import {
  formatMessagesForAPI,
  getErrorMessage,
  validateChatMessages,
  type ChatRequest,
} from '@ai-agent/shared';
import cors from 'cors';
import express from 'express';

import { callAIAPI } from './ai';
import { normalizeRequestMessages } from './messages';

import type { AppConfig } from './types';
import type { Request, Response } from 'express';

/**
 * 默认系统提示词。
 */
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Provide clear and concise answers.';

/**
 * 创建并配置 Express 应用实例。
 *
 * @param config 应用启动配置。
 * @returns 已完成中间件和路由注册的 Express 实例。
 */
export function createApp(config: AppConfig): express.Express {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(
    cors({
      origin: config.server.frontendUrl,
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      environment: config.server.nodeEnv,
      apiKeyConfigured: Boolean(config.server.aiApiKey),
      aiProvider: config.ai.baseUrl,
      aiModel: config.ai.model,
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const startTime = Date.now();
      const { messages, systemPrompt } = req.body as Partial<ChatRequest>;

      if (!config.server.aiApiKey) {
        return res.status(400).json({
          status: 'error',
          error: {
            code: 'MISSING_API_KEY',
            message:
              'AI_API_KEY is not configured on the server. Add it to apps/server/.env.local or apps/server/.env and restart the server.',
          },
        });
      }

      const normalizedMessages = normalizeRequestMessages(messages);
      const validation = validateChatMessages(normalizedMessages);

      if (!validation.isValid) {
        return res.status(400).json({
          status: 'error',
          error: {
            code: 'INVALID_MESSAGES',
            message: `Invalid message format: ${validation.errors.join(' ')}`,
          },
        });
      }

      const formattedMessages = formatMessagesForAPI(normalizedMessages);
      const response = await callAIAPI({
        ai: config.ai,
        apiKey: config.server.aiApiKey,
        messages: [
          {
            role: 'system',
            content:
              typeof systemPrompt === 'string' && systemPrompt.trim().length > 0
                ? systemPrompt.trim()
                : DEFAULT_SYSTEM_PROMPT,
          },
          ...formattedMessages,
        ],
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('X-Processing-Time', String(Date.now() - startTime));
      res.setHeader('X-Response-Timestamp', new Date().toISOString());

      return res.send(response);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('[chat] API error:', error);

      return res.status(500).json({
        status: 'error',
        error: {
          code: 'CHAT_ERROR',
          message: errorMessage,
        },
      });
    }
  });

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  return app;
}
