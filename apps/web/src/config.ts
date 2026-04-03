const DEFAULT_API_URL = 'http://localhost:3000';

/**
 * 获取前端调用后端接口时使用的基础地址。
 *
 * @returns 优先返回环境变量中的地址，否则回退到本地默认值。
 */
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}
