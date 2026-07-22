import { useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  INITIAL_NOTIFICATIONS,
  notificationMeta,
  type AppNotification,
} from '@/data/notifications'

export function NotificationBell({ onViewAll }: { onViewAll: () => void }) {
  const [items, setItems] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [open, setOpen] = useState(false)

  const unread = items.filter((i) => !i.read).length
  const list = filter === 'unread' ? items.filter((i) => !i.read) : items

  const markRead = (id: string) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, read: true } : i)))

  const markAllRead = () => setItems((s) => s.map((i) => ({ ...i, read: true })))

  // 点击单条：标记已读并进入通知中心
  const openItem = (id: string) => {
    markRead(id)
    setOpen(false)
    onViewAll()
  }

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

      <PopoverContent align="end" className="w-80 flex max-h-[92vh] flex-col p-0">
        {/* 头部 */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
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
        <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
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

        {/* 列表（可滚动区域；max-h + overflow 自包含，超出在内部滚动，不撑高 Popover） */}
        <div className="min-h-0 flex-1 max-h-[60vh] overflow-y-auto">
          <div className="py-1">
            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">没有未读通知</div>
            ) : (
              list.map((n) => {
                const M = notificationMeta[n.type]
                const Icon = M.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n.id)}
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
        </div>

        {/* 底部 */}
        <div className="shrink-0 border-t border-border p-2">
          <Button
            variant="ghost"
            className="h-8 w-full justify-center text-xs text-muted-foreground"
            onClick={() => {
              setOpen(false)
              onViewAll()
            }}
          >
            查看全部通知
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
