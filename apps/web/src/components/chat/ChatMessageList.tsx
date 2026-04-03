import { useEffect, useRef, type ReactElement } from 'react';

import type { UIChatMessage } from '../../utils/chat/chatMessages';

interface ChatMessageListProps {
  messages: UIChatMessage[];
  isLoading: boolean;
  uiError: string;
}

export function ChatMessageList({
  messages,
  isLoading,
  uiError,
}: ChatMessageListProps): ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto p-4 md:p-5">
      {messages.length === 0 ? (
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
          {messages.map((message) => {
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
  );
}
