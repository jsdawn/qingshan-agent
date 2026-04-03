/**
 * React + TypeScript 前端的 Vite 配置
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        // 禁用tree-shake 对 @ai-agent/shared 模块
        manualChunks: {
          shared: ['@ai-agent/shared'],
        },
      },
    },
  },
  optimizeDeps: {
    // 包含 @ai-agent/shared 以加快开发速度
    include: ['@ai-agent/shared'],
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(
      process.env.REACT_APP_API_URL || 'http://localhost:3000',
    ),
  },
});
