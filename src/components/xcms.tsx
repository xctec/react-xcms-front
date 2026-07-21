import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Search, RotateCcw, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ============================================================
   StatusBadge - 状态徽章（圆点 + 文字）
   ============================================================ */
export type StatusType = 'active' | 'inactive' | 'pending' | 'error' | 'info' | 'warning'

const statusDotClass: Record<StatusType, string> = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-info',
  warning: 'bg-warning',
}

const statusTextClass: Record<StatusType, string> = {
  active: 'text-success',
  inactive: 'text-muted-foreground',
  pending: 'text-warning',
  error: 'text-destructive',
  info: 'text-info',
  warning: 'text-warning',
}

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: StatusType
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', statusTextClass[status], className)}>
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', statusDotClass[status])} />
      {children}
    </span>
  )
}

/* ============================================================
   PageHeader - 页面标题区
   ============================================================ */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

/* ============================================================
   SearchToolbar - 搜索工具栏（搜索 + 重置 + 自定义字段）
   ============================================================ */
export function SearchToolbar({
  children,
  onSearch,
  onReset,
}: {
  children?: ReactNode
  onSearch?: () => void
  onReset?: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-secondary/40 border-b border-border flex-wrap">
      {children}
      <Button size="sm" onClick={onSearch}>
        <Search className="h-4 w-4" />
        搜索
      </Button>
      <Button size="sm" variant="ghost" onClick={onReset}>
        <RotateCcw className="h-4 w-4" />
        重置
      </Button>
    </div>
  )
}

/* ============================================================
   BatchToolbar - 批量操作浮层工具条
   选中行后从表格顶部下推显示
   ============================================================ */
export function BatchToolbar({
  selectedCount,
  onClear,
  children,
}: {
  selectedCount: number
  onClear: () => void
  children?: ReactNode
}) {
  if (selectedCount === 0) return null
  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-brand-500/8 border-b border-brand-500/20">
      <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
        已选择 <span className="tabular-nums">{selectedCount}</span> 项
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">{children}</div>
      <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={onClear}>
        清除选择
      </Button>
    </div>
  )
}

/* ============================================================
   TableToolbar - 表格上方工具栏（左操作 + 右工具）
   ============================================================ */
export function TableToolbar({
  left,
  right,
}: {
  left?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center gap-1.5">{right}</div>
    </div>
  )
}

/* ============================================================
   EmptyState - 空态
   ============================================================ */
export function EmptyState({
  title = '暂无数据',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ============================================================
   Pagination - 分页
   ============================================================ */
export function Pagination({
  total,
  current,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number
  current: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  const pages = getPageNumbers(current, totalPages)
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-border text-sm">
      <span className="text-muted-foreground">
        共 <span className="tabular-nums font-medium text-foreground">{total}</span> 条
      </span>
      <div className="flex items-center gap-1">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>{s} 条/页</option>
            ))}
          </select>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          className="h-8 w-8 p-0"
        >
          ‹
        </Button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === current ? 'default' : 'ghost'}
              onClick={() => onPageChange(p)}
              className="h-8 min-w-8 px-2 tabular-nums"
            >
              {p}
            </Button>
          )
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
          className="h-8 w-8 p-0"
        >
          ›
        </Button>
      </div>
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

/* ============================================================
   Tag - 标签（浅底深字）
   ============================================================ */
export function Tag({
  children,
  color = 'neutral',
  className,
}: {
  children: ReactNode
  color?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}) {
  const colorClass = {
    neutral: 'bg-muted text-muted-foreground',
    brand: 'bg-brand-500/10 text-brand-700 dark:text-brand-400',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-info',
  }[color]
  return (
    <span className={cn('inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {children}
    </span>
  )
}
