import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * 前端 Vite 构建配置。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ai-agent/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
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
      output: {
        manualChunks: {
          shared: ['@ai-agent/shared'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@ai-agent/shared'],
  },
});
