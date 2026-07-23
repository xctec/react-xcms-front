import { useMemo, useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNoticeStore } from '@/store/noticeStore'
import { notificationMeta, defaultNotificationMeta } from '@/data/notifications'

/** 格式化时间显示文案 */
function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const now = Date.now()
  const diff = now - d.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}

export function NotificationBell({ onViewAll }: { onViewAll: () => void }) {
  const messages = useNoticeStore((s) => s.messages)
  const markRead = useNoticeStore((s) => s.markRead)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [open, setOpen] = useState(false)

  const unread = useMemo(() => messages.filter((i) => !i.read).length, [messages])
  const list = filter === 'unread' ? messages.filter((i) => !i.read) : messages

  const markAllRead = () => markRead()

  // 点击单条：标记已读并关闭弹窗
  const openItem = (id: string | number) => {
    markRead([id])
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
              {unread > 99 ? '99+' : unread}
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
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'all' ? '全部' : `未读${unread ? ` (${unread})` : ''}`}
            </button>
          ))}
        </div>

        {/* 列表（可滚动） */}
        <div className="min-h-0 flex-1 max-h-[60vh] overflow-y-auto">
          <div className="py-1">
            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {filter === 'unread' ? '没有未读通知' : '暂无通知'}
              </div>
            ) : (
              list.map((n) => {
                const M = n.type && notificationMeta[n.type]
                  ? notificationMeta[n.type]
                  : defaultNotificationMeta
                const Icon = M.icon
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n.id)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      !n.read && 'bg-brand-500/[0.04]',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        M.color,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        )}
                      </div>
                      {n.summary && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {n.summary}
                        </p>
                      )}
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {formatTime(n.createTime)}
                      </span>
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
