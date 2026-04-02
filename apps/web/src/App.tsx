/**
 * 主聊天应用组件
 * 实现带流式支持和打字机效果的 AI 聊天界面
 */

import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import type { ChatMessage } from '@ai-agent/shared';
import './App.css';

/**
 * App 组件 - 主聊天界面
 */
function App(): React.ReactElement {
  // 从环境变量或使用默认值获取 API URL
  const apiUrl = import.meta.env.REACT_APP_API_URL || 'http://localhost:3000';

  // 使用 useChat 钩子来管理聊天状态和流式传输
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `${apiUrl}/api/chat`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 自动滚动到最新消息的引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * 有新消息时自动滚动到底部
   */
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 处理表单提交
   */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <div className="app-container">
      {/* 页眉 */}
      <header className="app-header">
        <div className="header-content">
          <h1>🤖 AI 聊天助手</h1>
          <p className="subtitle">由 DeepSeek AI 驱动</p>
        </div>
      </header>

      {/* 主聊天区域 */}
      <main className="chat-container">
        {/* 消息显示区域 */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-content">
                <h2>欢迎使用 AI 聊天</h2>
                <p>开始与 AI 助手进行对话。提问、获取帮助或闲聊！</p>
                <div className="feature-list">
                  <span>💬 自然对话</span>
                  <span>🚀 实时流式传输</span>
                  <span>🌍 多语言支持</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message, index) => (
                <div key={index} className={`message message-${message.role}`}>
                  <div className="message-avatar">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-role">{message.role === 'user' ? '你' : '助手'}</div>
                    <div className="message-content">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message message-assistant loading">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content-wrapper">
                    <div className="message-role">助手</div>
                    <div className="message-content typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* 错误显示 */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>错误:</strong> {error.message}
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <form onSubmit={onSubmit} className="input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="在这里输入您的消息..."
              disabled={isLoading}
              className="message-input"
              autoFocus
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="send-button">
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
          <div className="input-hint">
            按 Enter 键发送，或点击发送按钮
          </div>
        </form>
      </main>

      {/* 页脚 */}
      <footer className="app-footer">
        <p>AI Agent Monorepo v1.0.0 | 由 React + TypeScript + Vercel AI SDK 构建</p>
      </footer>
    </div>
  );
}

export default App;
