import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

import type { AppConfig, NodeEnv, ServerConfig } from './types';
import type { AIProviderConfig } from '@ai-agent/shared';

/**
 * AI 服务的默认配置。
 */
const DEFAULT_AI_CONFIG: AIProviderConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * 按优先级加载服务端环境变量文件。
 *
 * @returns 成功加载的环境变量文件名列表。
 */
function loadEnvironmentVariables(): string[] {
  const envPaths = [path.resolve(__dirname, '../.env.local'), path.resolve(__dirname, '../.env')];
  const loadedFiles: string[] = [];

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const result = dotenv.config({ path: envPath });

    if (!result.error) {
      loadedFiles.push(path.basename(envPath));
    }
  }

  return loadedFiles;
}

/**
 * 返回第一个有值的字符串配置项。
 *
 * @param values 待挑选的字符串值。
 * @returns 去除首尾空白后的首个有效值；若不存在则返回空字符串。
 */
function firstDefined(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

/**
 * 将字符串解析为整数，失败时返回默认值。
 *
 * @param value 原始字符串值。
 * @param fallback 解析失败时使用的默认值。
 * @returns 整数结果或默认值。
 */
function parseInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

/**
 * 将字符串解析为浮点数，失败时返回默认值。
 *
 * @param value 原始字符串值。
 * @param fallback 解析失败时使用的默认值。
 * @returns 浮点数结果或默认值。
 */
function parseFloatValue(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseFloat(value ?? '');
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

/**
 * 将环境变量中的运行模式归一化为受控枚举值。
 *
 * @param value 原始环境变量值。
 * @returns 仅允许 `development` 或 `production`。
 */
function resolveNodeEnv(value: string | undefined): NodeEnv {
  return value === 'production' ? 'production' : 'development';
}

/**
 * 读取并组装服务端基础配置。
 *
 * @returns 服务自身运行所需配置。
 */
function loadServerConfig(): ServerConfig {
  return {
    port: parseInteger(process.env.PORT, 3000),
    nodeEnv: resolveNodeEnv(process.env.NODE_ENV),
    aiApiKey: firstDefined(process.env.AI_API_KEY),
    frontendUrl: firstDefined(process.env.FRONTEND_URL, 'http://localhost:5173'),
  };
}

/**
 * 读取并组装 AI 提供方配置。
 *
 * @returns 上游 AI 服务调用配置。
 */
function loadAIConfig(): AIProviderConfig {
  return {
    baseUrl: firstDefined(process.env.AI_BASE_URL, DEFAULT_AI_CONFIG.baseUrl),
    model: firstDefined(process.env.AI_MODEL, DEFAULT_AI_CONFIG.model),
    temperature: parseFloatValue(process.env.AI_TEMPERATURE, DEFAULT_AI_CONFIG.temperature),
    maxTokens: parseInteger(process.env.AI_MAX_TOKENS, DEFAULT_AI_CONFIG.maxTokens),
  };
}

/**
 * 加载应用启动所需的全部配置。
 *
 * @returns 可直接用于初始化服务的完整配置对象。
 */
export function loadAppConfig(): AppConfig {
  const loadedEnvFiles = loadEnvironmentVariables();
  const server = loadServerConfig();
  const ai = loadAIConfig();

  if (!server.aiApiKey) {
    console.warn(
      '[config] AI_API_KEY is missing. /api/chat will return HTTP 400 until it is configured.',
    );
  }

  return {
    server,
    ai,
    loadedEnvFiles,
  };
}
