/**
 * Shared domain types used by both the frontend and backend.
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
}
