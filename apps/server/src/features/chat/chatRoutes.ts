import {
  formatMessagesForAPI,
  generateMessageId,
  getErrorMessage,
  validateChatMessages,
  type ChatRequest,
  type ChatStreamErrorEvent,
} from '@ai-agent/shared';
import { Router, type Request, type Response } from 'express';

import { streamAIResponse } from '../../services/ai/streamAIResponse';
import { normalizeRequestMessages } from '../../utils/normalizeRequestMessages';
import { endSSE, initializeSSE, writeSSEEvent } from '../../utils/serverSentEvents';

import type { AppConfig } from '../../types/app';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Provide clear and concise answers.';

/**
 * 创建聊天路由，并以 SSE 方式向前端持续推送模型输出。
 *
 * @param config 应用完整配置。
 * @returns 已注册聊天接口的路由对象。
 */
export function createChatRouter(config: AppConfig): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const requestStartedAt = Date.now();

    try {
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

      const assistantMessageId = generateMessageId();
      const abortController = new AbortController();
      let clientDisconnected = false;
      let responseText = '';

      const handleClientDisconnect = (): void => {
        if (res.writableEnded) {
          return;
        }

        clientDisconnected = true;
        abortController.abort();
      };

      req.once('aborted', handleClientDisconnect);
      res.once('close', handleClientDisconnect);

      initializeSSE(res);
      writeSSEEvent(res, {
        type: 'start',
        messageId: assistantMessageId,
        createdAt: Date.now(),
      });

      try {
        const formattedMessages = formatMessagesForAPI(normalizedMessages);

        for await (const delta of streamAIResponse({
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
          signal: abortController.signal,
        })) {
          if (clientDisconnected || res.writableEnded) {
            return;
          }

          responseText += delta;
          writeSSEEvent(res, {
            type: 'delta',
            delta,
          });
        }

        if (clientDisconnected || res.writableEnded) {
          return;
        }

        if (responseText.trim().length === 0) {
          responseText = 'No response generated.';
          writeSSEEvent(res, {
            type: 'delta',
            delta: responseText,
          });
        }

        writeSSEEvent(res, {
          type: 'done',
          message: {
            id: assistantMessageId,
            role: 'assistant',
            content: responseText,
            timestamp: Date.now(),
          },
          responseTimeMs: Date.now() - requestStartedAt,
        });
        endSSE(res);
        return;
      } catch (streamError) {
        if (clientDisconnected || abortController.signal.aborted || res.writableEnded) {
          return;
        }

        console.error('[chat] Stream error:', streamError);

        const errorEvent: ChatStreamErrorEvent = {
          type: 'error',
          error: {
            code: 'CHAT_STREAM_ERROR',
            message: getErrorMessage(streamError),
          },
        };

        writeSSEEvent(res, errorEvent);
        endSSE(res);
        return;
      } finally {
        req.off('aborted', handleClientDisconnect);
        res.off('close', handleClientDisconnect);
      }
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
