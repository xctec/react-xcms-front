import { CircleCheck, ShieldAlert, ListTodo, MessageSquare, type LucideIcon } from 'lucide-react'

export type NType = 'system' | 'security' | 'task' | 'message'

export interface AppNotification {
  id: string
  type: NType
  title: string
  desc: string
  time: string
  read: boolean
}

export const notificationMeta: Record<NType, { icon: LucideIcon; color: string }> = {
  system: { icon: CircleCheck, color: 'text-brand-500 bg-brand-500/10' },
  security: { icon: ShieldAlert, color: 'text-destructive bg-destructive/10' },
  task: { icon: ListTodo, color: 'text-warning bg-warning/10' },
  message: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: '1', type: 'security', title: '异地登录提醒', desc: '账号 admin 于「上海」登录，如非本人操作请尽快修改密码', time: '2 分钟前', read: false },
  { id: '2', type: 'task', title: '菜单授权待审批', desc: '角色「运营管理员」申请 3 项菜单权限，等待你审批', time: '15 分钟前', read: false },
  { id: '3', type: 'system', title: '租户「华东工厂」已创建', desc: '模板复制完成，8 个菜单、12 个角色已就绪', time: '1 小时前', read: false },
  { id: '4', type: 'message', title: '李某某 给你留言', desc: '组织机构调整方案已更新，请评审', time: '3 小时前', read: true },
  { id: '5', type: 'system', title: '系统备份成功', desc: '每日 02:00 全量备份已完成', time: '昨天 02:00', read: true },
  { id: '6', type: 'task', title: '字典项待同步', desc: '「证件类型」字典新增 2 项，等待发布', time: '昨天', read: true },
]
