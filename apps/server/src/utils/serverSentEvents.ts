import type { ChatStreamEvent } from '@ai-agent/shared';
import type { Response } from 'express';

/**
 * 初始化 SSE 响应头，避免代理与浏览器缓冲流式内容。
 *
 * @param res Express 响应对象。
 */
export function initializeSSE(res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

/**
 * 写入一条结构化 SSE 事件。
 *
 * @param res Express 响应对象。
 * @param event 需要推送给前端的事件。
 */
export function writeSSEEvent(res: Response, event: ChatStreamEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * 在响应仍然打开时安全结束 SSE 连接。
 *
 * @param res Express 响应对象。
 */
export function endSSE(res: Response): void {
  if (!res.writableEnded) {
    res.end();
  }
}
