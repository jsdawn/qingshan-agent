import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

import type { AIProviderConfig } from '@ai-agent/shared';

import type { AppConfig, NodeEnv, ServerConfig } from '../types/app';

const DEFAULT_AI_CONFIG: AIProviderConfig = {
  baseUrl: 'https://api.siliconflow.cn/v1',
  model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
  temperature: 0.7,
  maxTokens: 2048,
};

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

function firstDefined(...values: Array<string | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function parseFloatValue(value: string | undefined, fallback: number): number {
  const parsedValue = Number.parseFloat(value ?? '');
  return Number.isNaN(parsedValue) ? fallback : parsedValue;
}

function resolveNodeEnv(value: string | undefined): NodeEnv {
  return value === 'production' ? 'production' : 'development';
}

function loadServerConfig(): ServerConfig {
  return {
    port: parseInteger(process.env.PORT, 3000),
    nodeEnv: resolveNodeEnv(process.env.NODE_ENV),
    aiApiKey: firstDefined(process.env.AI_API_KEY),
    frontendUrl: firstDefined(process.env.FRONTEND_URL, 'http://localhost:5173'),
  };
}

function loadAIConfig(): AIProviderConfig {
  return {
    baseUrl: firstDefined(process.env.AI_BASE_URL, DEFAULT_AI_CONFIG.baseUrl),
    model: firstDefined(process.env.AI_MODEL, DEFAULT_AI_CONFIG.model),
    temperature: parseFloatValue(process.env.AI_TEMPERATURE, DEFAULT_AI_CONFIG.temperature),
    maxTokens: parseInteger(process.env.AI_MAX_TOKENS, DEFAULT_AI_CONFIG.maxTokens),
  };
}

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
