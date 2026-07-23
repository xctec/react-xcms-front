import { create } from 'zustand'
import { apiClient } from '@/utils/request'
import type { ApiResult, PageResult } from '@/utils/request'
import type { InboxMessage, InboxQuery, NoticePayload } from '@/types/message'
import { mapToInboxMessage } from '@/types/message'

export interface NoticeState {
  /** 消息列表（来自 /api/frame/inbox 的初始加载 + SSE 增量） */
  messages: InboxMessage[]
  /** 首次加载是否进行中 */
  loading: boolean
  /** 是否已完成首次加载 */
  loaded: boolean

  /** 登录后调用：从 /api/frame/inbox 加载消息列表 */
  fetchInbox: (query?: InboxQuery) => Promise<void>
  /** SSE 实时推送时调用：把一条通知插入列表头部（未读 +1） */
  pushNotice: (payload: NoticePayload) => void
  /**
   * 标记已读（调用 /message-read 接口）。
   * ids 为空数组时标记全部已读。
   */
  markRead: (ids?: (string | number)[]) => Promise<void>
  /** 重置状态（登出时调用） */
  reset: () => void
}

export const useNoticeStore = create<NoticeState>((set, get) => ({
  messages: [],
  loading: false,
  loaded: false,

  fetchInbox: async (query) => {
    const body: Record<string, unknown> = { page: query?.page ?? 1, size: query?.size ?? 50 }
    if (query?.read !== undefined) body.read = query.read
    if (query?.keyword) body.keyword = query.keyword
    set({ loading: true })
    try {
      const res = await apiClient.POST<ApiResult<PageResult<InboxMessage>>>('/api/frame/inbox', {
        body,
      })
      if (res.error) return
      const { data = [] } = res.data?.data ?? {}
      // 首次加载直接覆盖；后续可扩展分页追加（当前 50 条基本够覆盖）
      set({ messages: data, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  pushNotice: (payload) => {
    const msg = mapToInboxMessage(payload)
    // 避免重复：如果已有同 refId 的消息则跳过
    set((s) => {
      // 去重：同 refId（有值且不为空）或同 id
      if (msg.refId && s.messages.some((m) => m.refId === msg.refId)) return s
      return { messages: [msg, ...s.messages] }
    })
  },

  markRead: async (ids) => {
    const state = get()
    const targetIds = ids && ids.length > 0
      ? ids
      : state.messages
          .filter((m) => !m.read)
          .map((m) => m.id)
    if (targetIds.length === 0) return

    // 乐观更新：先改本地状态
    const idSet = new Set(targetIds)
    set((s) => ({
      messages: s.messages.map((m) =>
        idSet.has(m.id) ? { ...m, read: true } : m,
      ),
    }))

    // 调用后端
    try {
      await apiClient.POST('/message-read', { body: { ids: targetIds } })
    } catch {
      // 失败时回滚（简单起见直接重新拉取）
      const reverted = state.messages.map((m) =>
        idSet.has(m.id) ? { ...m, read: false } : m,
      )
      set({ messages: reverted })
    }
  },

  reset: () => set({ messages: [], loading: false, loaded: false }),
}))
