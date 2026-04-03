import { validateChatMessages, type ChatMessage } from '@ai-agent/shared';

type UIMessage = ChatMessage;

interface MessageCandidate {
  id?: string;
  role?: string;
  content?: string;
}

function normalizeToUIMessage(message: MessageCandidate, index: number): UIMessage | null {
  if (message.role !== 'user' && message.role !== 'assistant') {
    return null;
  }

  if (typeof message.content !== 'string' || message.content.trim().length === 0) {
    return null;
  }

  return {
    id:
      typeof message.id === 'string' && message.id.trim().length > 0 ? message.id : `msg_${index}`,
    role: message.role,
    content: message.content,
  };
}

export function normalizeMessagesForRequest(messages: MessageCandidate[]): UIMessage[] {
  return messages
    .map((message, index) => normalizeToUIMessage(message, index))
    .filter((message): message is UIMessage => message !== null);
}

export function getChatValidationErrors(messages: UIMessage[]): string[] {
  if (messages.length === 0) {
    return [];
  }

  const result = validateChatMessages(messages);
  return result.isValid ? [] : result.errors;
}
