import { useMemo, useState } from 'react'
import { CheckCheck, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  INITIAL_NOTIFICATIONS,
  notificationMeta,
  type AppNotification,
} from '@/data/notifications'

export default function NotificationCenter() {
  const [items, setItems] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items])
  const list = filter === 'unread' ? items.filter((i) => !i.read) : items

  const markRead = (id: string) =>
    setItems((s) => s.map((i) => (i.id === id ? { ...i, read: true } : i)))
  const markAllRead = () => setItems((s) => s.map((i) => ({ ...i, read: true })))

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h1 className="text-lg font-semibold text-foreground">通知中心</h1>
          {unread > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {unread} 条未读
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unread === 0}
          className="gap-1.5"
        >
          <CheckCheck className="h-4 w-4" />
          全部已读
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-1">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              filter === f
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'all' ? '全部' : `未读${unread ? ` (${unread})` : ''}`}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {list.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">没有未读通知</div>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((n) => {
              const M = notificationMeta[n.type]
              const Icon = M.icon
              return (
                <li key={n.id}>
                  <button
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50',
                      !n.read && 'bg-brand-500/[0.04]'
                    )}
                  >
                    <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', M.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.desc}</p>
                      <span className="mt-1.5 block text-xs text-muted-foreground/70">{n.time}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
