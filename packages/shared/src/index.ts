/**
 * 共享包统一导出入口。
 */

export type {
  ChatMessage,
  ChatRequest,
  ChatStreamDeltaEvent,
  ChatStreamDoneEvent,
  ChatStreamError,
  ChatStreamErrorEvent,
  ChatStreamEvent,
  ChatStreamStartEvent,
} from './types/index';
export type { AIProviderConfig, MessageValidationResult, ServerSentEvent } from './utils/index';

export {
  createServerSentEventParser,
  formatMessagesForAPI,
  generateMessageId,
  getErrorMessage,
  validateChatMessages,
} from './utils/index';
