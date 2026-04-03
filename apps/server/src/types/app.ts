import type { AIProviderConfig } from '@ai-agent/shared';

/**
 * 服务端运行环境标识。
 */
export type NodeEnv = 'development' | 'production';

/**
 * 服务端基础配置。
 */
export interface ServerConfig {
  /** HTTP 服务监听端口。 */
  port: number;
  /** 当前运行环境。 */
  nodeEnv: NodeEnv;
  /** AI 服务调用密钥。 */
  aiApiKey: string;
  /** 允许跨域访问的前端地址。 */
  frontendUrl: string;
}

/**
 * 服务端完整应用配置。
 */
export interface AppConfig {
  /** 服务端基础配置。 */
  server: ServerConfig;
  /** 上游 AI 服务配置。 */
  ai: AIProviderConfig;
  /** 成功加载的环境变量文件列表。 */
  loadedEnvFiles: string[];
}
