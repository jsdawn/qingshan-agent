/// <reference types="vite/client" />

/**
 * 前端构建期可读取的环境变量定义。
 */
interface ImportMetaEnv {
  /** 后端 API 根地址。 */
  readonly VITE_API_URL?: string;
}

/**
 * Vite 注入的 `import.meta` 类型扩展。
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
