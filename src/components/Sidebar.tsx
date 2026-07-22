import { useNavigate } from 'react-router-dom'
import type { AppMenuGroup } from '@/lib/menu'
import { cn } from '@/lib/utils'
import { ChevronLeft, Hexagon } from 'lucide-react'

interface SidebarProps {
  groups: AppMenuGroup[]
  currentPath: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ groups, currentPath, collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-out shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo 区 */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shrink-0 shadow-sm">
            <Hexagon className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-foreground">XCMS</span>
              <span className="text-[10px] text-muted-foreground">中台骨架 · v1.0</span>
            </div>
          )}
        </div>
      </div>

      {/* 导航（由菜单接口动态渲染） */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {groups.map((group) => (
          <div key={group.id} className="mb-4">
            {!collapsed && (
              <div className="px-4 mb-1.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                {group.label}
              </div>
            )}
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = currentPath === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition-colors',
                      collapsed && 'justify-center',
                      active
                        ? 'nav-item-active font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active && 'text-brand-500')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {!item.ready && (
                          <span className="text-[10px] text-muted-foreground/40">待办</span>
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 折叠按钮 */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 h-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs transition-colors"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
          {!collapsed && <span>收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}
