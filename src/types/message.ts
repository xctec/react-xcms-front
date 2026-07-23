/**
 * 消息模块类型定义。
 *
 * 约定：
 * - InboxMessage 是 store/组件层统一使用的消息对象。
 * - NoticePayload 是 SSE 推送的原始 payload，经 mapToInboxMessage 映射后写入 store。
 * - InboxQuery 是消息列表查询参数（前端筛选 + 后端分页）。
 */

/** SSE 推送的原始消息体（/api/msg/stream 的 event: notice 的 data 字段） */
export interface NoticePayload {
  refId?: string
  title: string
  summary?: string
  type?: string // 'N' 普通通知 | 'D' 数据变更（由后端约定）
  createTime?: string
}

/** 收件箱消息（/api/frame/inbox 返回，同时作为 store 中消息的统一结构） */
export interface InboxMessage {
  id: string | number
  refId?: string
  title: string
  summary?: string
  type?: string // 同 NoticePayload.type
  read: boolean
  createTime?: string
}

/** 收件箱分页查询参数 */
export interface InboxQuery {
  page?: number
  size?: number
  /** 0=未读 1=已读，不传=全部 */
  read?: 0 | 1
  /** 关键字（标题/摘要模糊匹配） */
  keyword?: string
}

/** /api/frame/inbox 接口返回结构 */
export interface InboxVO {
  records?: InboxMessage[]
  total?: number
}

/** 将 SSE payload 映射为 InboxMessage，分配临时 id 并标记为未读 */
export function mapToInboxMessage(
  payload: NoticePayload,
  fallbackId: () => string | number = () => `sse_${Date.now()}_${Math.random().toString(36).slice(2)}`,
): InboxMessage {
  return {
    id: fallbackId(),
    refId: payload.refId,
    title: payload.title,
    summary: payload.summary,
    type: payload.type ?? 'N',
    read: false,
    createTime: payload.createTime ?? new Date().toISOString(),
  }
}
