import type { AIProviderConfig } from '@ai-agent/shared';

/** 服务端运行环境。 */
export type NodeEnv = 'development' | 'production';

export interface ServerConfig {
  /** HTTP 服务监听端口。 */
  port: number;
  /** 当前运行环境。 */
  nodeEnv: NodeEnv;
  /** 调用 AI 服务所需的 API Key。 */
  aiApiKey: string;
  /** 允许跨域访问的前端地址。 */
  frontendUrl: string;
}

export interface AppConfig {
  /** HTTP 服务自身配置。 */
  server: ServerConfig;
  /** 上游 AI 服务配置。 */
  ai: AIProviderConfig;
  /** 启动时成功加载的环境变量文件列表。 */
  loadedEnvFiles: string[];
}
