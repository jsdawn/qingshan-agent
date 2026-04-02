/**
 * 前端入口点
 * 初始化 React 应用程序
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// 渲染应用
const root = document.getElementById('root');

if (!root) {
  throw new Error('未找到根元素');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
