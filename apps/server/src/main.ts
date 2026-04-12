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
  console.info('[server] AI Agent backend started');
  console.info(`[server] Listening on http://localhost:${config.server.port}`);
  console.info(`[server] Environment: ${config.server.nodeEnv}`);
  console.info(`[server] AI Provider: ${config.ai.baseUrl}`);
  console.info(`[server] AI Model: ${config.ai.model}`);
  console.info(
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
  console.info(`[server] ${signal} received, shutting down...`);

  // Set a timeout to force exit if the server doesn't close in a timely manner.
  const forcedExitTimer = setTimeout(() => {
     
    console.error('[server] Shutdown timed out, forcing exit.');
    process.exit(1);
  }, 5000);

  server.close(() => {
    clearTimeout(forcedExitTimer);
    console.info('[server] Closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
