import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCheck, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNoticeStore } from '@/store/noticeStore'
import { notificationMeta, defaultNotificationMeta } from '@/data/notifications'

const PAGE_SIZE = 20

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

export default function NotificationIndex() {
  const { messages, loading, loaded, fetchInbox, markRead } = useNoticeStore()

  // 筛选状态
  const [readFilter, setReadFilter] = useState<'' | '0' | '1'>('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const keywordRef = useRef(keyword)
  keywordRef.current = keyword

  // 发起查询（由回车 / 筛选 / 翻页触发）
  const doSearch = useCallback(() => {
    setPage(1)
    void fetchInbox({
      page: 1,
      size: PAGE_SIZE,
      keyword: keywordRef.current.trim() || undefined,
      ...(readFilter !== '' ? { read: Number(readFilter) as 0 | 1 } : {}),
    })
  }, [readFilter, fetchInbox])

  // 首次挂载加载数据
  useEffect(() => {
    void fetchInbox({ page: 1, size: PAGE_SIZE })
  }, [])

  // 筛选 / 翻页时重新拉取（keyword 通过 ref 获取最新值）
  useEffect(() => {
    if (!loaded) return
    void fetchInbox({
      page,
      size: PAGE_SIZE,
      keyword: keywordRef.current.trim() || undefined,
      ...(readFilter !== '' ? { read: Number(readFilter) as 0 | 1 } : {}),
    })
  }, [readFilter, page])

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      doSearch()
    }
  }

  // 全部标记已读
  const handleMarkAllRead = useCallback(() => {
    const unreadIds = messages.filter((i) => !i.read).map((i) => i.id)
    if (unreadIds.length === 0) return
    void markRead()
  }, [messages, markRead])

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      {/* 标题栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">通知消息</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            查看系统通知与消息
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={messages.every((i) => i.read)}
        >
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
          全部已读
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索通知内容..."
            className="pl-8 text-sm"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
          />
        </div>
        <Select value={readFilter} onValueChange={(v) => { setReadFilter(v as '' | '0' | '1'); setPage(1) }}>
          <SelectTrigger className="w-[120px] text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="0">未读</SelectItem>
            <SelectItem value="1">已读</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 列表区 */}
      <div className="min-h-0 flex-1 rounded-lg border border-border bg-card">
        {loading && !loaded ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
            加载中...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
            <p className="text-base">暂无通知</p>
            <p className="mt-1">暂时没有收到任何消息</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {messages.map((n) => {
              const M = n.type && notificationMeta[n.type]
                ? notificationMeta[n.type]
                : defaultNotificationMeta
              const Icon = M.icon
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40',
                    !n.read && 'bg-brand-500/[0.03]',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      M.color,
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      )}
                    </div>
                    {n.summary && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {n.summary}
                      </p>
                    )}
                    <span className="mt-1.5 block text-xs text-muted-foreground/70">
                      {formatTime(n.createTime)}
                    </span>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => markRead([n.id])}
                    >
                      标为已读
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 简易分页 */}
        {messages.length >= PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">每页 {PAGE_SIZE} 条</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <span className="px-2 text-xs text-muted-foreground">第 {page} 页</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={messages.length < PAGE_SIZE}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
