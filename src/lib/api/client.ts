import createClient from 'openapi-fetch'
import type { paths } from './schema'

/** 后端 API 基址，可在 .env 中通过 VITE_API_BASE 覆盖 */
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:12000'

/** 基于 OpenAPI 生成的完全类型安全的请求客户端 */
export const apiClient = createClient<paths>({ baseUrl: API_BASE })

/** 统一响应包装体：{ errorNo, errorMsg, data }（字段在生成类型中为可选，故此处放宽） */
export interface ApiResult<T> {
  errorNo?: string
  errorMsg?: string
  data?: T
}

/** 分页响应体：{ total, data: [...] }（records 嵌套在 data 下） */
export interface PageResult<T> {
  total?: number
  data?: T[]
}

/** 业务异常：errorNo 非 0 或 HTTP 非 2xx 时抛出 */
export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/**
 * 解包 openapi-fetch 的返回值：
 * - 成功（HTTP 2xx 且 errorNo 为 '0'）时返回 data
 * - 否则抛出 ApiError，便于上层统一捕获
 */
export async function call<R>(
  promise: Promise<{ data?: R; error?: any; response: Response }>,
): Promise<R> {
  const { data, error, response } = await promise
  if (error) {
    const errObj = error as Partial<ApiResult<unknown>>
    throw new ApiError(errObj.errorMsg || '请求失败', errObj.errorNo)
  }
  if (!response.ok) throw new ApiError(`网络错误 HTTP ${response.status}`)
  return data as R
}

/** 从分页响应中安全提取列表与总数 */
export function unwrapPage<T>(res: ApiResult<PageResult<T>> | undefined): { list: T[]; total: number } {
  return {
    list: res?.data?.data ?? [],
    total: res?.data?.total ?? 0,
  }
}
