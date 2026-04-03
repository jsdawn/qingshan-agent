import { createApp } from './app/createApp';
import { loadAppConfig } from './config/appConfig';

const config = loadAppConfig();
const app = createApp(config);
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

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down...');
  server.close(() => {
    console.log('[server] Closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received, shutting down...');
  server.close(() => {
    console.log('[server] Closed');
    process.exit(0);
  });
});
