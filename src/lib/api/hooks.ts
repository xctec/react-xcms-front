import { useCallback, useEffect, useState } from 'react'
import type { ApiResult, PageResult } from './client'

type ApiResponse<T> = { data?: T; error?: any; response: Response }

/**
 * 通用请求 Hook：自动处理 loading / error / data 生命周期。
 * fn 应返回 openapi-fetch 的调用结果（Promise<{ data, error, response }>）。
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
        if (r.error) {
          setError(r.error?.errorMsg || '请求失败')
          setData(undefined)
        } else {
          setError(undefined)
          setData(r.data)
        }
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
