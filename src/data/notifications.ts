import { CircleCheck, ShieldAlert, ListTodo, MessageSquare, Bell, type LucideIcon } from 'lucide-react'

export type NType = 'system' | 'security' | 'task' | 'message'

export interface AppNotification {
  id: string
  type: NType
  title: string
  desc: string
  time: string
  read: boolean
}

export const notificationMeta: Record<string, { icon: LucideIcon; color: string }> = {
  system: { icon: CircleCheck, color: 'text-brand-500 bg-brand-500/10' },
  security: { icon: ShieldAlert, color: 'text-destructive bg-destructive/10' },
  task: { icon: ListTodo, color: 'text-warning bg-warning/10' },
  message: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
  // SSE 类型映射：N 普通通知 / D 数据变更
  N: { icon: Bell, color: 'text-brand-500 bg-brand-500/10' },
  D: { icon: Bell, color: 'text-warning bg-warning/10' },
}

/** 未匹配类型时的兜底展示样式 */
export const defaultNotificationMeta = {
  icon: Bell,
  color: 'text-muted-foreground bg-muted',
}

/** @deprecated 旧 mock 数据，已迁移至 noticeStore + 后端 API，仅保留兼容引用 */
export const INITIAL_NOTIFICATIONS: AppNotification[] = []
