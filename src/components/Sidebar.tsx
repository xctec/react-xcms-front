import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Hexagon } from 'lucide-react'
import type { AppMenuNode } from '@/router/menu'
import { cn } from '@/lib/utils'
import { useSystemStore } from '@/store/systemStore'
import { LazyIcon } from '@/components/Icon'

interface SidebarProps {
  tree: AppMenuNode[]
  currentPath: string
  collapsed: boolean
  onToggleCollapse: () => void
}

/** 计算默认应展开的目录键集合：包含当前路径的所有祖先目录 */
function computeExpanded(tree: AppMenuNode[], path: string): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  const walk = (nodes: AppMenuNode[]) => {
    for (const n of nodes) {
      if (n.children?.length) {
        const hit = n.children.some(
          (c) => (!c.children?.length && c.fullPath === path) || containsPath(c, path),
        )
        if (hit) map[n.key] = true
        walk(n.children)
      }
    }
  }
  walk(tree)
  return map
}

function containsPath(node: AppMenuNode, path: string): boolean {
  if (node.children?.length) {
    return node.children.some((c) => (!c.children?.length && c.fullPath === path) || containsPath(c, path))
  }
  return node.fullPath === path
}

export function Sidebar({ tree, currentPath, collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const sys = useSystemStore((s) => s.settings)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => computeExpanded(tree, currentPath))

  // 路由变化时，确保当前页所在的目录链自动展开
  useEffect(() => {
    setExpanded((prev) => ({ ...prev, ...computeExpanded(tree, currentPath) }))
  }, [currentPath, tree])

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  const go = (node: AppMenuNode) => {
    if (node.jumpType === '2' && node.jumpTarget) {
      window.open(node.jumpTarget, '_blank')
    } else if (node.fullPath) {
      navigate(node.fullPath)
    }
  }

  const renderNodes = (nodes: AppMenuNode[]): ReactNode =>
    nodes
      .filter((node) => !node.hidden)
      .map((node) => {
        const isCatalog = !!node.children?.length
      const active = !isCatalog && currentPath === node.fullPath
      const isOpen = expanded[node.key]

      // 收起态：仅以图标呈现，目录点击展开侧栏并展开该目录以便查看子项
      if (collapsed) {
        return (
          <button
            key={node.key}
            title={node.label}
            onClick={() => {
              if (isCatalog) {
                setExpanded((p) => ({ ...p, [node.key]: true }))
                onToggleCollapse()
              } else {
                go(node)
              }
            }}
            className={cn(
              'w-full flex items-center justify-center h-10 rounded-md text-sm transition-colors',
              active ? 'bg-sidebar-accent text-brand-500' : 'text-sidebar-foreground hover:bg-sidebar-accent',
            )}
          >
            <LazyIcon icon={node.icon} className="h-5 w-5" />
          </button>
        )
      }

      // 目录：可折叠，递归渲染子层（支持任意层级）
      if (isCatalog) {
        return (
          <div key={node.key} className="mb-0.5">
            <button
              onClick={() => toggle(node.key)}
              className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LazyIcon icon={node.icon} className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">{node.label}</span>
              <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-90')} />
            </button>
            {isOpen && (
              <div className="ml-3.5 pl-3 border-l border-sidebar-border mt-0.5 space-y-0.5">
                {renderNodes(node.children!)}
              </div>
            )}
          </div>
        )
      }

      // 叶子：可导航页面
      return (
        <button
          key={node.key}
          onClick={() => go(node)}
          className={cn(
            'group relative w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition-colors',
            active
              ? 'nav-item-active font-medium'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          )}
        >
          <LazyIcon icon={node.icon} className={cn('h-4 w-4 shrink-0', active && 'text-brand-500')} />
          <span className="flex-1 text-left truncate">{node.label}</span>
          {!node.ready && <span className="text-[10px] text-muted-foreground/40">待办</span>}
        </button>
      )
    })

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-200 ease-out shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shrink-0 shadow-sm overflow-hidden">
              {sys.logo ? (
                <img src={sys.logo} alt={sys.name} className="h-full w-full object-cover" />
              ) : (
                <Hexagon className="h-4 w-4" />
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-foreground">{sys.name}</span>
                {sys.subtitle && <span className="text-[10px] text-muted-foreground">{sys.subtitle}</span>}
              </div>
            )}
          </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        {!collapsed && (
          <div className="px-4 mb-1.5 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            导航菜单
          </div>
        )}
        <div className="px-2 space-y-0.5">{renderNodes(tree)}</div>
      </nav>

      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft className={cn('h-4 w-4 shrink-0 transition-transform duration-200', collapsed && 'rotate-180')} />
          {!collapsed && <span>收起侧栏</span>}
        </button>
      </div>
    </aside>
  )
}
