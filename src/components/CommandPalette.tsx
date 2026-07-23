import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AppMenuItem } from '@/router/menu'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { LogOut, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LazyIcon } from '@/components/Icon'
import { clearTokens } from '@/utils/request'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AppMenuItem[]
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) => it.label.toLowerCase().includes(q) || (it.fullPath ?? '').toLowerCase().includes(q),
    )
  }, [query, items])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const run = (item?: AppMenuItem) => {
    if (item) navigate(item.fullPath ?? '/')
    onOpenChange(false)
  }

  const handleLogout = () => {
    clearTokens()
    onOpenChange(false)
    navigate('/login')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(results[activeIndex])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-xl top-[20%] translate-y-0">
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索菜单或执行命令..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 bg-transparent"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">无匹配结果</div>
          ) : (
            results.map((item, idx) => {
              return (
                <button
                  key={item.fullPath ?? ''}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => run(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors',
                    idx === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                  )}
                >
                  <LazyIcon icon={item.icon} className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground/50">{item.fullPath ?? ''}</span>
                </button>
              )
            })
          )}
        </div>
        <div className="border-t border-border px-3 py-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">↑↓ 选择 · ↵ 打开 · esc 关闭</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            退出登录
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
