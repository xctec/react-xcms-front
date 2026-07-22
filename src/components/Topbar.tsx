import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AppMenuNode } from '@/lib/menu'
import { findMenuChain } from '@/lib/menu'
import { cn } from '@/lib/utils'
import { ThemeSwitcher } from './ThemeSwitcher'
import { NotificationBell } from './NotificationBell'
import { Menu, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { apiClient, clearTokens, getAccessToken } from '@/utils/request'
import { useUserStore } from '@/lib/store/userStore'

interface TopbarProps {
  tree: AppMenuNode[]
  currentPath: string
  onToggleSidebar: () => void
  onOpenCommand: () => void
}

export function Topbar({ tree, currentPath, onToggleSidebar, onOpenCommand }: TopbarProps) {
  const navigate = useNavigate()
  const user = useUserStore((s) => s.user)
  const resetUser = useUserStore((s) => s.reset)

  // 由当前路径反查从根到该节点的链路，用于多级面包屑
  const chain = findMenuChain(tree, currentPath)

  const displayName = user?.nickName || user?.loginId || '未登录'
  const initial = (user?.nickName?.[0] || user?.loginId?.[0] || '?').toUpperCase()

  const handleLogout = () => {
    const token = getAccessToken()
    if (token) {
      // 通知后端吊销当前访问令牌（best-effort）
      apiClient.POST('/api/auth/logout', { body: { accessToken: token } }).catch(() => {})
    }
    clearTokens()
    resetUser()
    navigate('/login')
  }

  return (
    <header className="flex items-center h-14 px-4 bg-background border-b border-border gap-3 shrink-0">
      {/* 侧边栏折叠 */}
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={onToggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      {/* 面包屑（支持任意层级） */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        {chain.length === 0 ? (
          <span className="font-medium text-foreground truncate">页面</span>
        ) : (
          chain.map((n, i) => (
            <Fragment key={n.key}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 hidden sm:inline" />}
              <span
                className={cn(
                  'truncate',
                  i === chain.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hidden sm:inline',
                )}
              >
                {n.label}
              </span>
            </Fragment>
          ))
        )}
      </nav>

      {/* 命令入口 */}
      <button
        onClick={onOpenCommand}
        className="ml-auto flex items-center gap-2 h-9 px-3 rounded-md bg-muted/60 hover:bg-muted text-sm text-muted-foreground transition-colors w-56 lg:w-72"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">搜索或执行命令...</span>
        <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-1 shrink-0">
        <ThemeSwitcher />
        <NotificationBell onViewAll={() => navigate('/notifications')} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8 ring-2 ring-border">
                <AvatarFallback className="bg-brand-500/15 text-brand-700 dark:text-brand-400 text-xs font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              {displayName}
              {user?.tenantName ? (
                <span className="block text-xs font-normal text-muted-foreground truncate">{user.tenantName}</span>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/profile')}>个人设置</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/account')}>账号设置</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleLogout}
            >
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
