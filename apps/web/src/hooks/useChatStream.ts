import * as shared from '@ai-agent/shared';
import { useEffect, useRef, useState, type ChangeEventHandler, type FormEventHandler } from 'react';

import { normalizeMessagesForRequest, type UIChatMessage } from '../utils/chat/chatMessages';
import { isAbortError, readChatStream } from '../utils/chat/readChatStream';

/**
 * 流式聊天 Hook 的初始化参数。
 */
interface UseChatStreamOptions {
  /** 聊天接口地址。 */
  api: string;
}

/**
 * 流式聊天 Hook 的返回结构。
 */
interface UseChatStreamResult {
  /** 当前会话消息列表。 */
  messages: UIChatMessage[];
  /** 输入框内容。 */
  input: string;
  /** 最近一次错误。 */
  error: Error | null;
  /** 是否仍处于流式生成或逐字渲染阶段。 */
  isLoading: boolean;
  /** 当前正在流式更新的 AI 消息 ID。 */
  activeAssistantMessageId: string | null;
  /** 输入框变更处理器。 */
  handleInputChange: ChangeEventHandler<HTMLInputElement>;
  /** 表单提交处理器。 */
  handleSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * 管理前端聊天状态，并把后端 SSE 流事件渲染为逐字输出效果。
 *
 * @param options Hook 初始化参数。
 * @returns 供界面消费的聊天状态与事件处理器。
 */
export function useChatStream({ api }: UseChatStreamOptions): UseChatStreamResult {
  const [messages, setMessages] = useState<UIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAssistantMessageId, setActiveAssistantMessageId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const pendingDeltaRef = useRef('');
  const completedMessageRef = useRef<shared.ChatMessage | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  const resetStreamState = (): void => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    pendingDeltaRef.current = '';
    completedMessageRef.current = null;
    abortControllerRef.current = null;
    activeAssistantIdRef.current = null;
    setIsLoading(false);
    setActiveAssistantMessageId(null);
  };

  useEffect(() => {
    // 确保在挂载时明确标记为已挂载（避免 StrictMode 下的双重挂载带来歧义）
    isMountedRef.current = true;

    return () => {
      // 在卸载时标记为未挂载
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } finally {
          abortControllerRef.current = null;
        }
      }

      if (typingTimerRef.current !== null) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInput(event.target.value);
  };

  /**
   * 将新到达的文本增量拼接到当前 AI 消息尾部。
   *
   * @param assistantMessageId 当前 AI 消息 ID。
   * @param delta 本次需要追加的文本片段。
   */
  const appendAssistantText = (assistantMessageId: string, delta: string): void => {
    if (!delta) {
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: message.content + delta,
            }
          : message,
      ),
    );
  };

  /**
   * 将本地占位消息与服务端确认的助手消息 ID 对齐，避免流式阶段前后 ID 不一致。
   * @param currentAssistantMessageId 当前界面中使用的助手消息 ID。
   * @param nextAssistantMessage 服务端确认的消息标识与时间戳。
   */
  const syncAssistantMessage = (
    currentAssistantMessageId: string,
    nextAssistantMessage: Pick<shared.ChatMessage, 'id'> &
      Pick<Partial<shared.ChatMessage>, 'timestamp'>,
  ): void => {
    activeAssistantIdRef.current = nextAssistantMessage.id;
    setActiveAssistantMessageId(nextAssistantMessage.id);
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === currentAssistantMessageId
          ? {
              ...message,
              id: nextAssistantMessage.id,
              ...(typeof nextAssistantMessage.timestamp === 'number'
                ? { timestamp: nextAssistantMessage.timestamp }
                : {}),
            }
          : message,
      ),
    );
  };

  /**
   * 结束当前流式响应，并将最终消息内容写回状态。
   *
   * @param assistantMessageId 当前 AI 消息 ID。
   * @param finalMessage 后端返回的最终消息对象。
   */
  const finalizeStream = (assistantMessageId: string, finalMessage?: shared.ChatMessage): void => {
    if (!isMountedRef.current) {
      return;
    }
    resetStreamState();

    if (finalMessage) {
      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                ...finalMessage,
                content:
                  typeof finalMessage.content === 'string' && finalMessage.content.length > 0
                    ? finalMessage.content
                    : message.content || 'No response generated.',
              }
            : message,
        ),
      );
    }
  };

  /**
   * 处理中途中断或失败的流式请求。
   *
   * @param assistantMessageId 当前 AI 消息 ID。
   * @param streamError 捕获到的异常对象。
   */
  const failStream = (assistantMessageId: string, streamError: unknown): void => {
    if (!isMountedRef.current) {
      return;
    }
    resetStreamState();
    setError(new Error(shared.getErrorMessage(streamError)));
    setMessages((currentMessages) =>
      currentMessages.filter(
        (message) => !(message.id === assistantMessageId && message.content.trim().length === 0),
      ),
    );
  };

  /**
   * 按打字机节奏消费待渲染文本队列。
   */
  const scheduleTyping = (): void => {
    if (typingTimerRef.current !== null) {
      return;
    }

    typingTimerRef.current = window.setTimeout(() => {
      typingTimerRef.current = null;

      const assistantMessageId = activeAssistantIdRef.current;
      if (!assistantMessageId) {
        return;
      }

      if (pendingDeltaRef.current.length === 0) {
        if (completedMessageRef.current) {
          finalizeStream(assistantMessageId, completedMessageRef.current);
        }
        return;
      }

      const pending = pendingDeltaRef.current;
      const chunkLength = Math.min(Math.max(1, Math.ceil(pending.length / 24)), 4);
      const nextSlice = pending.slice(0, chunkLength);
      pendingDeltaRef.current = pending.slice(chunkLength);
      appendAssistantText(assistantMessageId, nextSlice);

      if (pendingDeltaRef.current.length > 0 || completedMessageRef.current) {
        scheduleTyping();
      }
    }, 16);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const nextInput = input.trim();
    if (!nextInput || isLoading) {
      return;
    }

    const userMessage: UIChatMessage = {
      id: shared.generateMessageId(),
      role: 'user',
      content: nextInput,
      timestamp: Date.now(),
    };
    const assistantMessage: UIChatMessage = {
      id: shared.generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    const request: shared.ChatRequest = {
      messages: normalizeMessagesForRequest(nextMessages),
    };
    const abortController = new AbortController();

    abortControllerRef.current = abortController;
    activeAssistantIdRef.current = assistantMessage.id;
    pendingDeltaRef.current = '';
    completedMessageRef.current = null;
    setMessages([...nextMessages, assistantMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);
    setActiveAssistantMessageId(assistantMessage.id);

    void (async () => {
      try {
        await readChatStream({
          api,
          request,
          signal: abortController.signal,
          onEvent: async (streamEvent) => {
            // Only handle events for the currently active request and if the
            // request has not been aborted. Do not rely on `isMountedRef` here
            // because StrictMode / development remounts can cause transient
            // unmounts that would otherwise drop valid events.
            if (abortControllerRef.current !== abortController || abortController.signal.aborted) {
              return;
            }

            switch (streamEvent.type) {
              case 'start':
                if (activeAssistantIdRef.current) {
                  syncAssistantMessage(activeAssistantIdRef.current, {
                    id: streamEvent.messageId,
                    timestamp: streamEvent.createdAt,
                  });
                }
                return;
              case 'delta':
                if (streamEvent.delta.length > 0) {
                  pendingDeltaRef.current += streamEvent.delta;
                  scheduleTyping();
                }
                return;
              case 'done':
                completedMessageRef.current = streamEvent.message;
                if (
                  activeAssistantIdRef.current &&
                  activeAssistantIdRef.current !== streamEvent.message.id
                ) {
                  syncAssistantMessage(activeAssistantIdRef.current, {
                    id: streamEvent.message.id,
                    timestamp: streamEvent.message.timestamp,
                  });
                }

                if (pendingDeltaRef.current.length === 0) {
                  finalizeStream(
                    activeAssistantIdRef.current ?? assistantMessage.id,
                    streamEvent.message,
                  );
                } else {
                  scheduleTyping();
                }
                return;
              case 'error':
                throw new Error(streamEvent.error.message);
            }
          },
        });

        if (
          isMountedRef.current &&
          abortControllerRef.current === abortController &&
          activeAssistantIdRef.current !== null &&
          pendingDeltaRef.current.length === 0 &&
          completedMessageRef.current
        ) {
          finalizeStream(activeAssistantIdRef.current, completedMessageRef.current);
        }
      } catch (streamError) {
        if (isAbortError(streamError)) {
          return;
        }

        failStream(activeAssistantIdRef.current ?? assistantMessage.id, streamError);
      }
    })();
  };

  return {
    messages,
    input,
    error,
    isLoading,
    activeAssistantMessageId,
    handleInputChange,
    handleSubmit,
  };
}
