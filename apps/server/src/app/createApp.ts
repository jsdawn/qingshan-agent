import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { createChatRouter } from '../features/chat/chatRoutes';

import type { AppConfig } from '../types/app';

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

  app.use('/api/chat', createChatRouter(config));

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
