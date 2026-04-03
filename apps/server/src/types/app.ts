import type { AIProviderConfig } from '@ai-agent/shared';

export type NodeEnv = 'development' | 'production';

export interface ServerConfig {
  port: number;
  nodeEnv: NodeEnv;
  aiApiKey: string;
  frontendUrl: string;
}

export interface AppConfig {
  server: ServerConfig;
  ai: AIProviderConfig;
  loadedEnvFiles: string[];
}
