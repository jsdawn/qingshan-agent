import { createApp } from './app/createApp';
import { loadAppConfig } from './config/appConfig';

/**
 * 当前进程加载出的运行配置。
 */
const config = loadAppConfig();

/**
 * 根据配置创建的 Express 应用实例。
 */
const app = createApp(config);

/**
 * 当前 HTTP 服务实例。
 */
const server = app.listen(config.server.port, () => {
  console.log('[server] AI Agent backend started');
  console.log(`[server] Listening on http://localhost:${config.server.port}`);
  console.log(`[server] Environment: ${config.server.nodeEnv}`);
  console.log(`[server] AI Provider: ${config.ai.baseUrl}`);
  console.log(`[server] AI Model: ${config.ai.model}`);
  console.log(
    `[config] Loaded env files: ${
      config.loadedEnvFiles.length > 0 ? config.loadedEnvFiles.join(', ') : 'none'
    }`,
  );
});

/**
 * 统一处理进程退出信号并优雅关闭 HTTP 服务。
 *
 * @param signal 触发退出的进程信号。
 */
function shutdown(signal: 'SIGTERM' | 'SIGINT'): void {
  console.log(`[server] ${signal} received, shutting down...`);
  server.close(() => {
    console.log('[server] Closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
