/**
 * 前端应用入口文件。
 * 负责挂载 React 根组件并加载全局样式。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.css';

/** 应用挂载的根节点。 */
const root = document.getElementById('root');

if (!root) {
  throw new Error('未找到根元素');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
