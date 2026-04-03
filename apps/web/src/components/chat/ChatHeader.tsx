import type { ReactElement } from 'react';

export function ChatHeader(): ReactElement {
  return (
    <header className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 px-5 py-4 text-white shadow-lg shadow-blue-300/40">
      <h1 className="text-xl font-bold md:text-2xl">AI Chat Assistant</h1>
      <p className="mt-1 text-sm text-blue-50">
        React + TypeScript + Tailwind CSS + OpenAI-compatible API
      </p>
    </header>
  );
}
