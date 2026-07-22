import { useEffect, useState, Suspense } from 'react'
import { Routes, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { CommandPalette } from '@/components/CommandPalette'
import { useMenus } from '@/lib/menu'
import { buildMenuRoutes } from '@/router/menuRoutes'
import { Toaster } from '@/components/ui/sonner'
import { getAccessToken, onUnauthorized } from '@/utils/request'

/** 路由懒加载时的内容区占位 */
function PageLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <span className="text-sm">页面加载中…</span>
    </div>
  )
}

/** 已登录状态下的主框架：侧边栏 + 顶栏 + 由菜单动态生成的路由内容 */
export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const { groups, items, loading } = useMenus()

  // 登录态守卫：无 token 且当前非登录页，则跳转登录
  if (!getAccessToken() && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  const currentPath = location.pathname

  // 全局快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key === 'k') {
        e.preventDefault()
        setCommandOpen((o) => !o)
      } else if (isMod && e.key === 'b') {
        e.preventDefault()
        setSidebarCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 监听命令面板的折叠侧栏事件
  useEffect(() => {
    const handler = () => setSidebarCollapsed((c) => !c)
    window.addEventListener('xcms:toggle-sidebar', handler)
    return () => window.removeEventListener('xcms:toggle-sidebar', handler)
  }, [])

  // 后端返回 401 时跳回登录页
  useEffect(() => {
    onUnauthorized(() => navigate('/login'))
  }, [navigate])

  const firstPath = items[0]?.path || '/dashboard'

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">加载菜单中…</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        groups={groups}
        currentPath={currentPath}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          groups={groups}
          currentPath={currentPath}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main className="flex-1 overflow-hidden bg-background">
          {/* 菜单路由按需懒加载，Suspense 仅覆盖内容区，侧栏/顶栏不闪烁 */}
          <Suspense fallback={<PageLoading />}>
            <Routes>{buildMenuRoutes(items, firstPath)}</Routes>
          </Suspense>
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={items} />
      <Toaster />
    </div>
  )
}
