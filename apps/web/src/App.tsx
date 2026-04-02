import { useChat } from 'ai/react';
import React, { useEffect, useMemo, useRef } from 'react';

import { validateChatMessages } from '../../../packages/shared/src/utils/index';

import type { ChatMessage } from '@ai-agent/shared';
import './App.css';

type UIMessage = ChatMessage;

function normalizeToUIMessage(
  message: { id?: string; role?: string; content?: string },
  index: number,
): UIMessage | null {
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

function App(): React.ReactElement {
  const apiUrl =
    import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:3000';

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `${apiUrl}/api/chat`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const messageList = useMemo(() => {
    return messages
      .map((message, index) =>
        normalizeToUIMessage(
          {
            id: message.id,
            role: message.role,
            content: message.content,
          },
          index,
        ),
      )
      .filter((message): message is UIMessage => message !== null);
  }, [messages]);

  const messageValidationErrors = useMemo(() => {
    if (messageList.length === 0) {
      return [];
    }

    const result = validateChatMessages(messageList);
    return result.isValid ? [] : result.errors;
  }, [messageList]);

  const uiError = error?.message || messageValidationErrors[0] || '';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messageList, isLoading]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (messageValidationErrors.length > 0) {
      return;
    }

    if (!input.trim()) {
      return;
    }

    handleSubmit(event);
  };

  const canSend = !isLoading && input.trim().length > 0 && messageValidationErrors.length === 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>AI Chat Assistant</h1>
        <p>React + TypeScript + DeepSeek API</p>
      </header>

      <main className="chat-panel">
        <section className="messages-wrap">
          {messageList.length === 0 ? (
            <div className="empty-state">
              <h2>Start a conversation</h2>
              <p>Ask anything. The assistant will respond in real time.</p>
            </div>
          ) : (
            <div className="messages-list">
              {messageList.map((message) => {
                const isUser = message.role === 'user';

                return (
                  <article
                    key={message.id}
                    className={`message-row ${isUser ? 'message-user' : 'message-assistant'}`}
                  >
                    <div className="message-avatar">{isUser ? 'U' : 'AI'}</div>
                    <div className="message-bubble">
                      <div className="message-role">{isUser ? 'You' : 'Assistant'}</div>
                      <div className="message-content">{message.content}</div>
                    </div>
                  </article>
                );
              })}

              {isLoading && (
                <article className="message-row message-assistant">
                  <div className="message-avatar">AI</div>
                  <div className="message-bubble">
                    <div className="message-role">Assistant</div>
                    <div className="typing-indicator" aria-label="Assistant is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {uiError && (
            <div className="error-banner">
              <strong>Error:</strong> {uiError}
            </div>
          )}
        </section>

        <form onSubmit={onSubmit} className="composer">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="composer-input"
          />
          <button type="submit" disabled={!canSend} className="composer-send">
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
