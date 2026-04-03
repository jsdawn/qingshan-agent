import {
  AI_CONFIG,
  formatMessagesForAPI,
  generateMessageId,
  getErrorMessage,
  validateChatMessages,
} from '@ai-agent/shared';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

import type { ServerConfig } from './types';
import type { ChatMessage, ChatRequest } from '@ai-agent/shared';
import type { Request, Response } from 'express';

function loadEnvironmentVariables(): string[] {
  const envPaths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
  ];
  const loadedFiles: string[] = [];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const result = dotenv.config({ path: envPath });

    if (!result.error) {
      loadedFiles.push(path.basename(envPath));
    }
  }

  return loadedFiles;
}

const loadedEnvFiles = loadEnvironmentVariables();

function loadConfig(): ServerConfig {
  const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);

  const config: ServerConfig = {
    port: Number.isNaN(parsedPort) ? 3000 : parsedPort,
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };

  if (!config.deepseekApiKey) {
    console.warn(
      '[config] DEEPSEEK_API_KEY is missing. /api/chat will return HTTP 400 until it is configured.',
    );
  }

  return config;
}

const config = loadConfig();
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
);

async function callDeepSeekAPI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: AI_CONFIG.DEFAULT_TEMPERATURE,
      max_tokens: AI_CONFIG.DEFAULT_MAX_TOKENS,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `DeepSeek API request failed: ${response.status} ${response.statusText}${
        detail ? ` - ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || 'No response generated.';
}

function normalizeRequestMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const normalizedMessages: ChatMessage[] = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      continue;
    }

    const candidate = message as Partial<ChatMessage>;

    if (candidate.role !== 'user' && candidate.role !== 'assistant') {
      continue;
    }

    if (typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
      continue;
    }

    normalizedMessages.push({
      id:
        typeof candidate.id === 'string' && candidate.id.trim().length > 0
          ? candidate.id
          : generateMessageId(),
      role: candidate.role,
      content: candidate.content,
      ...(typeof candidate.timestamp === 'number' ? { timestamp: candidate.timestamp } : {}),
    });
  }

  return normalizedMessages;
}

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: config.nodeEnv,
    apiKeyConfigured: Boolean(config.deepseekApiKey),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const { messages, systemPrompt } = req.body as Partial<ChatRequest>;

    if (!config.deepseekApiKey) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'MISSING_API_KEY',
          message:
            'DEEPSEEK_API_KEY is not configured on the server. Please add it to apps/server/.env.local or apps/server/.env and restart the server.',
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

    const systemMessage =
      typeof systemPrompt === 'string' && systemPrompt.trim().length > 0
        ? systemPrompt.trim()
        : 'You are a helpful AI assistant. Provide clear and concise answers.';

    const response = await callDeepSeekAPI(formattedMessages, systemMessage);
    const processingTime = Date.now() - startTime;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Processing-Time', String(processingTime));
    res.setHeader('X-Response-Timestamp', new Date().toISOString());

    res.send(response);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('[chat] API error:', error);

    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: {
            code: 'CHAT_ERROR',
            message: errorMessage,
          },
        })}\n\n`,
      );
      res.end();
      return;
    }

    res.status(500).json({
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

const server = app.listen(config.port, () => {
  console.log('[server] AI Agent backend started');
  console.log(`[server] Listening on http://localhost:${config.port}`);
  console.log(`[server] Environment: ${config.nodeEnv}`);
  console.log(`[server] Model: ${AI_CONFIG.MODEL}`);
  console.log(
    `[config] Loaded env files: ${loadedEnvFiles.length > 0 ? loadedEnvFiles.join(', ') : 'none'}`,
  );
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[server] Closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received, shutting down...');
  server.close(() => {
    console.log('[server] Closed');
    process.exit(0);
  });
});
