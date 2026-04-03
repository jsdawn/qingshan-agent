import { useChat } from 'ai/react';
import { useMemo, type FormEvent, type ReactElement } from 'react';

import type { JSONValue } from 'ai';

import { ChatComposer } from '../components/chat/ChatComposer';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessageList } from '../components/chat/ChatMessageList';
import { getApiUrl } from '../config/api';
import { getChatValidationErrors, normalizeMessagesForRequest } from '../utils/chat/chatMessages';

function App(): ReactElement {
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

  const messageList = useMemo(() => normalizeMessagesForRequest(messages), [messages]);
  const messageValidationErrors = useMemo(
    () => getChatValidationErrors(messageList),
    [messageList],
  );
  const uiError = error?.message || messageValidationErrors[0] || '';
  const canSend = !isLoading && input.trim().length > 0 && messageValidationErrors.length === 0;

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (messageValidationErrors.length > 0 || !input.trim()) {
      return;
    }

    handleSubmit(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-slate-100 to-slate-200 p-3 md:p-4">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col gap-3 md:h-[calc(100vh-2rem)] md:gap-4">
        <ChatHeader />

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ChatMessageList messages={messageList} isLoading={isLoading} uiError={uiError} />
          <ChatComposer
            input={input}
            isLoading={isLoading}
            canSend={canSend}
            onChange={handleInputChange}
            onSubmit={onSubmit}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
