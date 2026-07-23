import axios, { AxiosError, type AxiosResponse, type Method } from 'axios'
import { toast } from 'sonner'

/** 后端 API 基址：默认走同源（由 vite 开发代理转发到真实后端），避免跨域；也可用 VITE_API_BASE 覆盖为绝对地址 */
const FALLBACK_BASE =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:12000'
export const API_BASE = (import.meta.env.VITE_API_BASE as string) || FALLBACK_BASE

/* ============================ Token 管理 ============================ */
const ACCESS_KEY = 'xcms-access-token'
const REFRESH_KEY = 'xcms-refresh-token'

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}
export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_KEY) || ''
}
export function getRefreshToken(): string {
  return localStorage.getItem(REFRESH_KEY) || ''
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** 未授权回调：由 App 注册，用于跳回登录页 */
let unauthorizedHandler: (() => void) | null = null
export function onUnauthorized(fn: () => void) {
  unauthorizedHandler = fn
}

/** 主动触发未授权流程：清理本地令牌并执行注册的重定向回调（默认无操作）。
 *  供「HTTP 401」与「业务 errorNo === '401'」两类场景复用。 */
export function triggerUnauthorized() {
  clearTokens()
  unauthorizedHandler?.()
}

/** 禁止访问回调：由 App 注册，用于跳到 403 错误页（已登录但无权限） */
let forbiddenHandler: (() => void) | null = null
export function onForbidden(fn: () => void) {
  forbiddenHandler = fn
}

/** 主动触发禁止访问流程：仅跳转 403 页，不清令牌（用户已认证，仅权限不足） */
export function triggerForbidden() {
  forbiddenHandler?.()
}

/* ============================ 响应类型 ============================ */
export interface ApiResult<T> {
  errorNo?: string
  errorMsg?: string
  data?: T
}

export interface PageResult<T> {
  total?: number
  data?: T[]
}

export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/** axios 调用统一返回的结构，兼容 useApi / usePaged / Login 的现有消费方式 */
export interface ApiResponse<T> {
  data?: T
  error?: any
  response?: AxiosResponse
}

interface RequestOptions {
  body?: unknown
  params?: Record<string, unknown> | { query?: Record<string, unknown>; path?: Record<string, unknown> }
  headers?: Record<string, string>
  /** 为 true 时不触发全局错误提示，由调用方自行处理（如登录失败） */
  silent?: boolean
}

/* ============================ axios 实例 ============================ */
const instance = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
})

// 请求拦截器：自动携带 Bearer 令牌
instance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器：401（登录接口除外）统一清 token 并跳回登录页；403 跳转到 403 错误页
instance.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError) => {
    const status = err.response?.status
    const url = err.config?.url || ''
    if (status === 403) {
      forbiddenHandler?.()
    } else if (status === 401 && !url.includes('/auth/login')) {
      clearTokens()
      unauthorizedHandler?.()
    }
    return Promise.reject(err)
  },
)

/* ============================ 请求封装 ============================ */
// 统一把 axios 的「成功返回 AxiosResponse」与「失败抛 AxiosError」收敛成
// { data, error, response } 结构：HTTP 非 2xx 时把后端响应体放入 error，与
// 原 openapi-fetch 的调用契约保持一致，便于 hooks 统一解包。
function request<T = any>(method: Method, path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const params = options.params
  const axiosParams = params && 'query' in params ? params.query : params
  return instance
    .request<T>({
      method,
      url: path,
      data: options.body,
      params: axiosParams as Record<string, unknown> | undefined,
      headers: options.headers,
    })
    .then((resp) => {
      const res = resp.data as ApiResult<T> | undefined
      // 业务错误：HTTP 200 但后端返回 errorNo 非 '0'（约定成功码为 '0'）
      if (res && typeof res === 'object' && 'errorNo' in res && res.errorNo != null && res.errorNo !== '0') {
        // 统一拦截鉴权类业务码（仅非 silent 请求触发跳转，避免打断登录等静默流程）
        if (!options.silent) {
          if (res.errorNo === '401') triggerUnauthorized()
          else if (res.errorNo === '403') triggerForbidden()
        }
        notifyRequestError(
          { message: res.errorMsg || `操作失败（${res.errorNo}）`, code: res.errorNo, status: resp.status },
          options.silent,
        )
        // 仍把响应体放入 error，兼容 useApi / call 的既有解包逻辑
        return { data: resp.data, error: resp.data, response: resp }
      }
      return { data: resp.data, error: undefined, response: resp }
    })
    .catch((err: AxiosError) => {
      const info = extractRequestError(err)
      // 登录接口自身的 401 由登录页处理，不走全局提示（且登录页未挂载 Toaster）
      const url = err.config?.url || ''
      const isLoginAuth = url.includes('/auth/login') && err.response?.status === 401
      notifyRequestError(info, options.silent || isLoginAuth)
      // 保证 error 始终为「真值对象」：空 body / text/plain / 网络错误时，
      // 退化为携带友好文案与状态码的对象，避免调用方 if(res.error) 漏判导致"无反应"。
      const raw = err.response?.data
      const errorBody =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? raw
          : { status: err.response?.status, errorMsg: info.message }
      return { data: undefined, error: errorBody, response: err.response }
    })
}

/** 兼容原 openapi-fetch 调用风格的 axios 客户端 */
export const apiClient = {
  GET: <T = any>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  POST: <T = any>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
  PUT: <T = any>(path: string, options?: RequestOptions) => request<T>('PUT', path, options),
  DELETE: <T = any>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

/* ============================ 解包辅助 ============================ */
export async function call<R>(
  promise: Promise<ApiResponse<R>>,
): Promise<R> {
  const { data, error, response } = await promise
  if (error) {
    const errObj = error as Partial<ApiResult<unknown>>
    throw new ApiError(errObj.errorMsg || '请求失败', errObj.errorNo)
  }
  if (response && response.status >= 400) throw new ApiError(`网络错误 HTTP ${response.status}`)
  return data as R
}

export function unwrapPage<T>(res: ApiResult<PageResult<T>> | undefined): { list: T[]; total: number } {
  return {
    list: res?.data?.data ?? [],
    total: res?.data?.total ?? 0,
  }
}

/* ============================ 全局请求异常处理 ============================ */
export interface RequestErrorInfo {
  message: string
  code?: string
  status?: number
}

type RequestErrorHandler = (info: RequestErrorInfo) => void

/** 默认处理器：用 sonner 弹出错误提示（仅当 <Toaster/> 已挂载时可见） */
let requestErrorHandler: RequestErrorHandler = (info) => {
  toast.error(info.message)
}

/**
 * 注册全局请求错误处理，可覆盖默认的 toast 行为。
 * 典型用途：统一埋点上报、特定错误码跳登录、按租户定制提示等。
 */
export function onRequestError(handler: RequestErrorHandler) {
  requestErrorHandler = handler
}

/** 把 axios 错误收敛为可展示的文案与状态码 */
function extractRequestError(err: AxiosError): RequestErrorInfo {
  const status = err.response?.status
  const body = err.response?.data as ApiResult<unknown> | undefined

  // 1. 网络层错误（无响应体：断网 / 超时 / 取消）
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message)) {
      return { message: '请求超时，请稍后重试', status }
    }
    return { message: '网络异常，请检查网络连接', status }
  }

  // 2. 业务错误体（部分网关会直接返回 { errorNo, errorMsg }）
  if (body && typeof body === 'object' && 'errorNo' in body && body.errorNo != null && body.errorNo !== '0') {
    return { message: body.errorMsg || `操作失败（${body.errorNo}）`, code: body.errorNo, status }
  }

  // 3. 标准 HTTP 状态码映射
  const httpMsg: Record<number, string> = {
    400: '请求参数有误',
    401: '登录已过期，请重新登录',
    403: '权限不足，无法访问',
    404: '请求的资源不存在',
    408: '请求超时，请稍后重试',
    409: '数据冲突，请刷新后重试',
    422: '提交的参数未通过校验',
    429: '操作过于频繁，请稍后再试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂不可用',
    504: '网关超时',
  }
  return {
    message: body?.errorMsg || httpMsg[status as number] || `请求失败（HTTP ${status}）`,
    status,
  }
}

/** 触发全局错误提示（silent 时不提示） */
function notifyRequestError(info: RequestErrorInfo, silent?: boolean) {
  if (silent) return
  requestErrorHandler(info)
}
