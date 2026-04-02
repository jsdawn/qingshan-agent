/**
 * @ai-agent/shared 包的主导出文件
 */

export type { ChatMessage, AIStreamResponse, ChatRequest, ChatResponse } from './types/index';

export {
  AI_CONFIG,
  isChatMessage,
  validateChatMessages,
  formatMessagesForAPI,
  generateMessageId,
  createMessage,
  getErrorMessage,
} from './utils/index';
