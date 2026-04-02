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
    open: true,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3000'),
  },
});
