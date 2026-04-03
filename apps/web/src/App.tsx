import { useChat } from 'ai/react';
import React, { useEffect, useMemo, useRef } from 'react';

import { getApiUrl } from './config';
import { getChatValidationErrors, normalizeMessagesForRequest } from './lib/chatMessages';

import type { JSONValue } from 'ai';

function App(): React.ReactElement {
  const apiUrl = getApiUrl();

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `${apiUrl}/api/chat`,
    streamProtocol: 'text',
    headers: {
      'Content-Type': 'application/json',
    },
    experimental_prepareRequestBody: ({ messages: requestMessages, requestBody }) =>
      ({
        ...(requestBody ?? {}),
        messages: normalizeMessagesForRequest(requestMessages),
      }) as unknown as JSONValue,
  });

  const messageList = useMemo(() => {
    return normalizeMessagesForRequest(messages);
  }, [messages]);

  const messageValidationErrors = useMemo(() => {
    return getChatValidationErrors(messageList);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-slate-100 to-slate-200 p-3 md:p-4">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col gap-3 md:h-[calc(100vh-2rem)] md:gap-4">
        <header className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 px-5 py-4 text-white shadow-lg shadow-blue-300/40">
          <h1 className="text-xl font-bold md:text-2xl">AI Chat Assistant</h1>
          <p className="mt-1 text-sm text-blue-50">
            React + TypeScript + Tailwind CSS + OpenAI-compatible API
          </p>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <section className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
            {messageList.length === 0 ? (
              <div className="grid min-h-[240px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                <div className="space-y-2 p-6">
                  <h2 className="text-xl font-semibold text-slate-900">Start a conversation</h2>
                  <p className="text-sm text-slate-600">
                    Ask anything. The assistant will respond in real time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messageList.map((message) => {
                  const isUser = message.role === 'user';

                  return (
                    <article
                      key={message.id}
                      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          AI
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 md:max-w-[72%] ${
                          isUser
                            ? 'rounded-br-md border border-blue-200 bg-blue-100 text-slate-900'
                            : 'rounded-bl-md border border-slate-200 bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {isUser ? 'You' : 'Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.content}
                        </div>
                      </div>

                      {isUser && (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">
                          U
                        </div>
                      )}
                    </article>
                  );
                })}

                {isLoading && (
                  <article className="flex items-end gap-2">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                      AI
                    </div>
                    <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-100 px-3 py-2">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Assistant
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </article>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {uiError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <strong>Error:</strong> {uiError}
              </div>
            )}
          </section>

          <form onSubmit={onSubmit} className="border-t border-slate-200 p-3 md:p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default App;
