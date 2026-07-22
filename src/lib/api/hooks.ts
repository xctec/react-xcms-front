import { useCallback, useEffect, useState } from 'react'
import type { AxiosResponse } from 'axios'
import type { ApiResult, PageResult } from '@/utils/request'

type ApiResponse<T> = { data?: T; error?: any; response?: AxiosResponse }

/**
 * 通用请求 Hook：自动处理 loading / error / data 生命周期。
 * fn 应返回 axios 封装的调用结果（Promise<{ data, error, response }>）。
 */
export function useApi<T>(
  fn: () => Promise<ApiResponse<T>>,
  deps: React.DependencyList = [],
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  const run = useCallback(() => {
    let alive = true
    setLoading(true)
    fn()
      .then((r) => {
        if (!alive) return
        // HTTP 层错误（axios 封装将非 2xx 的响应体放入 r.error）
        if (r.error) {
          const errBody = r.error as ApiResult<unknown> | undefined
          setError(errBody?.errorMsg || '请求失败')
          setData(undefined)
          return
        }
        // 业务层错误：HTTP 200 但 errorNo 非 '0'（注意 errorNo 是字符串）
        const body = r.data as ApiResult<unknown> | undefined
        if (body && body.errorNo != null && body.errorNo !== '0') {
          setError(body.errorMsg || '请求失败')
          setData(undefined)
          return
        }
        setError(undefined)
        setData(r.data)
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => run(), [run])

  return { data, loading, error, reload: run }
}

/** 分页请求 Hook：直接返回解包后的列表与总数 */
export function usePaged<T>(
  fn: () => Promise<ApiResponse<ApiResult<PageResult<T>>>>,
  deps: React.DependencyList = [],
) {
  const { data, loading, error, reload } = useApi<ApiResult<PageResult<T>>>(fn, deps)
  return {
    list: data?.data?.data ?? [],
    total: data?.data?.total ?? 0,
    loading,
    error,
    reload,
  }
}
