import {
  formatMessagesForAPI,
  getErrorMessage,
  validateChatMessages,
  type ChatRequest,
} from '@ai-agent/shared';
import { Router, type Request, type Response } from 'express';

import { callAIAPI } from '../../services/ai/callAIAPI';
import { normalizeRequestMessages } from './chatMessages';

import type { AppConfig } from '../../types/app';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Provide clear and concise answers.';

export function createChatRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
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

  return router;
}
