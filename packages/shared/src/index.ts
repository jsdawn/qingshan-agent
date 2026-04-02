/**
 * @ai-agent/shared 包的主导出文件
 */

export type { ChatMessage, AIStreamResponse, ChatRequest, ChatResponse } from './types/index.js';

export { AI_CONFIG, formatMessagesForAPI, generateMessageId, createMessage, getErrorMessage } from './utils/index.js';
