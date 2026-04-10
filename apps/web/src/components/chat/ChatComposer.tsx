import type { ChangeEventHandler, FormEventHandler, ReactElement } from 'react';

/**
 * 输入区组件属性。
 */
interface ChatComposerProps {
  /** 当前输入值。 */
  input: string;
  /** 是否正在生成回复。 */
  isLoading: boolean;
  /** 当前是否允许发送。 */
  canSend: boolean;
  /** 输入变更处理器。 */
  onChange: ChangeEventHandler<HTMLInputElement>;
  /** 表单提交处理器。 */
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/**
 * 渲染聊天输入框与发送按钮。
 *
 * @param props 组件属性。
 * @returns 输入区组件。
 */
export function ChatComposer({
  input,
  isLoading,
  canSend,
  onChange,
  onSubmit,
}: ChatComposerProps): ReactElement {
  return (
    <form onSubmit={onSubmit} className="border-t border-slate-200 p-3 md:p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={onChange}
          placeholder="Type your message..."
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isLoading ? 'Generating...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
