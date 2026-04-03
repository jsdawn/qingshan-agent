import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

import type { AIProviderConfig } from '@ai-agent/shared';

import type { AppConfig, NodeEnv, ServerConfig } from '../types/app';

/**
 * 缺省的上游 AI 服务配置。
 */
const DEFAULT_AI_CONFIG: AIProviderConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * 从当前文件目录向上查找服务端包根目录。
 *
 * @returns 包含 `package.json` 的服务端根目录路径。
 */
function resolveServerRootDir(): string {
  let currentDir = __dirname;
  while (true) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return process.cwd();
    }
    currentDir = parentDir;
  }
}

/**
 * 加载服务端环境变量文件。
 *
 * 加载顺序为 `.env.local` 优先，其次 `.env`。
 *
 * @returns 成功加载的环境变量文件名列表。
 */
function loadEnvironmentVariables(): string[] {
  const serverRootDir = resolveServerRootDir();
  const envPaths = [path.join(serverRootDir, '.env.local'), path.join(serverRootDir, '.env')];
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
 * 返回第一个非空字符串值。
 *
 * @param values 候选字符串列表。
 * @returns 第一个去除空白后仍非空的字符串，否则返回空串。
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
 * 将字符串解析为整数，失败时回退到默认值。
 *
 * @param value 原始字符串值。
 * @param fallback 解析失败时使用的默认值。
 * @returns 解析得到的整数结果。
 */
function parseInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

/**
 * 将字符串解析为浮点数，失败时回退到默认值。
 *
 * @param value 原始字符串值。
 * @param fallback 解析失败时使用的默认值。
 * @returns 解析得到的浮点数结果。
 */
function parseFloatValue(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseFloat(value ?? '');
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

/**
 * 解析服务端运行环境。
 *
 * @param value 原始环境变量值。
 * @returns 归一化后的环境标识。
 */
function resolveNodeEnv(value: string | undefined): NodeEnv {
  return value === 'production' ? 'production' : 'development';
}

/**
 * 从环境变量中读取服务端基础配置。
 *
 * @returns 标准化后的服务端配置对象。
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
 * 从环境变量中读取 AI 服务配置。
 *
 * @returns 标准化后的 AI 配置对象。
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
 * 加载应用完整配置并输出必要的缺省告警。
 *
 * @returns 供服务端启动使用的完整配置。
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
