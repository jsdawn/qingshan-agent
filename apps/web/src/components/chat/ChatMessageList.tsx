import { useEffect, useRef, type ReactElement } from 'react';

import type { UIChatMessage } from '../../utils/chat/chatMessages';

/**
 * 聊天消息列表组件属性。
 */
interface ChatMessageListProps {
  /** 当前消息列表。 */
  messages: UIChatMessage[];
  /** 是否仍处于生成或逐字渲染中。 */
  isLoading: boolean;
  /** 当前正在流式写入的助手消息 ID。 */
  streamingMessageId: string | null;
  /** 需要展示给用户的错误信息。 */
  uiError: string;
}

/**
 * 渲染聊天消息列表、流式光标和错误提示。
 *
 * @param props 组件属性。
 * @returns 聊天消息区域。
 */
export function ChatMessageList({
  messages,
  isLoading,
  streamingMessageId,
  uiError,
}: ChatMessageListProps): ReactElement {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: isLoading ? 'auto' : 'smooth',
      block: 'end',
    });
  }, [messages, isLoading, streamingMessageId]);

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
            const isStreamingMessage = streamingMessageId === message.id;

            return (
              <article
                key={message.id}
                className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 md:max-w-[72%] ${
                    isUser
                      ? 'rounded-tr-md border border-blue-200 bg-blue-100 text-slate-900'
                      : 'rounded-tl-md border border-slate-200 bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {isUser ? 'You' : 'Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-sm leading-6">
                    {message.content}
                    {isStreamingMessage && message.content.length > 0 && (
                      <span className="ml-0.5 inline-block h-4 w-px animate-pulse align-middle bg-slate-500" />
                    )}
                    {isStreamingMessage && message.content.length === 0 && (
                      <span className="flex items-center gap-1 py-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-500 [animation-delay:240ms]" />
                      </span>
                    )}
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
