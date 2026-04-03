import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
