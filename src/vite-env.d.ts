/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 是否启用前端 Mock（MSW）。true 时拦截请求，无需后端即可开发 */
  readonly VITE_USE_MOCK?: string
  /** 后端 API 基址，例如 http://localhost:12000 */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
