/**
 * 前端在未显式配置环境变量时使用的默认后端地址。
 */
const DEFAULT_API_URL = 'http://localhost:3000';

/**
 * 返回当前前端应该请求的后端 API 地址。
 *
 * @returns 来自环境变量或默认值的 API 根地址。
 */
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}
