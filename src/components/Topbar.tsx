import { useNavigate } from 'react-router-dom'
import type { AppMenuGroup, AppMenuItem } from '@/lib/menu'
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

interface TopbarProps {
  groups: AppMenuGroup[]
  currentPath: string
  onToggleSidebar: () => void
  onOpenCommand: () => void
}

export function Topbar({ groups, currentPath, onToggleSidebar, onOpenCommand }: TopbarProps) {
  const navigate = useNavigate()

  // 由当前路径反查所属分组与菜单项，用于面包屑
  let currentItem: AppMenuItem | undefined
  let currentGroup: AppMenuGroup | undefined
  for (const g of groups) {
    const found = g.items.find((i) => i.path === currentPath)
    if (found) {
      currentItem = found
      currentGroup = g
      break
    }
  }

  const handleLogout = () => {
    const token = getAccessToken()
    if (token) {
      // 通知后端吊销当前访问令牌（best-effort）
      apiClient.POST('/api/auth/logout', { body: { accessToken: token } }).catch(() => {})
    }
    clearTokens()
    navigate('/login')
  }

  return (
    <header className="flex items-center h-14 px-4 bg-background border-b border-border gap-3 shrink-0">
      {/* 侧边栏折叠 */}
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={onToggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      {/* 面包屑 */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="text-muted-foreground hidden sm:inline">{currentGroup?.label}</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 hidden sm:inline" />
        <span className="font-medium text-foreground truncate">{currentItem?.label ?? '页面'}</span>
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
                  SA
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Admin · 超级管理员</DropdownMenuLabel>
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
