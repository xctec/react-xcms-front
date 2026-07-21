import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Bell, CircleCheck, ShieldAlert, ListTodo, MessageSquare, CheckCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NType = 'system' | 'security' | 'task' | 'message'

interface Notification {
  id: string
  type: NType
  title: string
  desc: string
  time: string
  read: boolean
}

const meta: Record<NType, { icon: LucideIcon; color: string }> = {
  system: { icon: CircleCheck, color: 'text-brand-500 bg-brand-500/10' },
  security: { icon: ShieldAlert, color: 'text-destructive bg-destructive/10' },
  task: { icon: ListTodo, color: 'text-warning bg-warning/10' },
  message: { icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
}

const initial: Notification[] = [
  { id: '1', type: 'security', title: '异地登录提醒', desc: '账号 admin 于「上海」登录，如非本人操作请尽快修改密码', time: '2 分钟前', read: false },
  { id: '2', type: 'task', title: '菜单授权待审批', desc: '角色「运营管理员」申请 3 项菜单权限，等待你审批', time: '15 分钟前', read: false },
  { id: '3', type: 'system', title: '租户「华东工厂」已创建', desc: '模板复制完成，8 个菜单、12 个角色已就绪', time: '1 小时前', read: false },
  { id: '4', type: 'message', title: '李某某 给你留言', desc: '组织机构调整方案已更新，请评审', time: '3 小时前', read: true },
  { id: '5', type: 'system', title: '系统备份成功', desc: '每日 02:00 全量备份已完成', time: '昨天 02:00', read: true },
  { id: '6', type: 'task', title: '字典项待同步', desc: '「证件类型」字典新增 2 项，等待发布', time: '昨天', read: true },
]

export function NotificationBell({ onViewAll }: { onViewAll: () => void }) {
  const [items, setItems] = useState<Notification[]>(initial)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [open, setOpen] = useState(false)

  const unread = items.filter((i) => !i.read).length
  const list = filter === 'unread' ? items.filter((i) => !i.read) : items

  const markRead = (id: string) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, read: true } : i)))

  const markAllRead = () => setItems((s) => s.map((i) => ({ ...i, read: true })))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">通知</span>
            {unread > 0 && (
              <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                {unread} 条未读
              </span>
            )}
          </div>
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand-600 disabled:opacity-40 dark:hover:text-brand-400"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            全部已读
          </button>
        </div>

        {/* 过滤 tab */}
        <div className="flex items-center gap-1 border-b border-border px-3 py-2">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs transition-colors',
                filter === f
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {f === 'all' ? '全部' : `未读${unread ? ` (${unread})` : ''}`}
            </button>
          ))}
        </div>

        {/* 列表 */}
        <ScrollArea className="max-h-80">
          <div className="py-1">
            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">没有未读通知</div>
            ) : (
              list.map((n) => {
                const M = meta[n.type]
                const Icon = M.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      !n.read && 'bg-brand-500/[0.04]'
                    )}
                  >
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', M.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{n.desc}</p>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">{n.time}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* 底部 */}
        <div className="border-t border-border p-2">
          <Button variant="ghost" className="h-8 w-full justify-center text-xs text-muted-foreground" onClick={() => { setOpen(false); onViewAll() }}>
            查看全部通知
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
