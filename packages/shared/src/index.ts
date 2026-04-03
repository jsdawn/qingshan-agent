/**
 * Public exports for the shared package.
 */

export type { ChatMessage, ChatRequest } from './types/index';
export type { AIProviderConfig, MessageValidationResult } from './utils/index';

export {
  formatMessagesForAPI,
  generateMessageId,
  getErrorMessage,
  validateChatMessages,
} from './utils/index';
