import { useEffect, useRef, useCallback } from 'react'
import { getAccessToken } from '@/utils/request'
import { useUserStore } from '@/store/userStore'
import { useNoticeStore } from '@/store/noticeStore'
import type { NoticePayload } from '@/types/message'

/**
 * SSE 消息流连接 Hook。
 *
 * 使用 fetch + ReadableStream 而不是浏览器原生 EventSource，
 * 因为 EventSource 不支持自定义 Authorization 请求头。
 *
 * 特性：
 * - 通过 Authorization: Bearer <token> 鉴权（后端 BearerAuthFilter 只读此头）
 * - 解析 SSE 协议：event: / data: 字段
 * - 断线自动重连（3 秒后重试）
 * - 组件卸载或 token 失效时断开
 */
export function useMessageStream() {
  const abortRef = useRef<AbortController | null>(null)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    const token = getAccessToken()
    // 未登录（无 token 或会话失效）时不发起 SSE 连接
    if (!token || !useUserStore.getState().isLoggedIn) return

    // 清理上次连接
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    const controller = new AbortController()
    abortRef.current = controller

    const url = `${window.location.origin}/api/msg/stream`

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.body) {
          // 非 200 或缺失 body → 3 秒后重试
          throw new Error(`SSE connect failed: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let currentEvent = ''
        let currentData = ''

        const processLine = (line: string) => {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          } else if (line.startsWith('data:')) {
            const raw = line.slice(5)
            currentData += raw.startsWith(' ') ? raw : raw
          } else if (line === '') {
            // 空行 = 一条消息结束；仅处理 notice 事件或无事件类型的默认消息
            if (currentData && (!currentEvent || currentEvent === 'notice')) {
              try {
                const payload: NoticePayload = JSON.parse(currentData)
                if (payload?.title) {
                  useNoticeStore.getState().pushNotice(payload)
                }
              } catch {
                // 解析失败静默丢弃
              }
            }
            // 重置
            currentEvent = ''
            currentData = ''
          }
        }

        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // 按 \n 拆行
            let idx: number
            while ((idx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, idx).replace(/\r$/, '')
              buffer = buffer.slice(idx + 1)
              processLine(line)
            }
          }
        } catch {
          // reader 取消时静默退出
        } finally {
          reader.releaseLock()
        }
      })
      .catch(() => {
        // 网络错误 / abort → 重试
      })
      .finally(() => {
        if (controller.signal.aborted) return
        // 3 秒后重连
        retryTimer.current = setTimeout(connect, 3000)
      })
  }, [])

  useEffect(() => {
    connect()

    return () => {
      // cleanup：取消 fetch、清除重试定时器
      if (retryTimer.current) {
        clearTimeout(retryTimer.current)
        retryTimer.current = null
      }
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
    }
  }, [connect])
}
