import { Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useLocation, useRoutes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { CommandPalette } from '@/components/CommandPalette'
import { useBootstrap } from '@/hooks/useBootstrap'
import { buildMenuRouteObjects } from '@/router/menuRoutes'
import { Toaster } from '@/components/ui/sonner'
import { getAccessToken, onUnauthorized } from '@/utils/request'
import { NotFound } from '@/views/error/NotFound'
import { useSystemStore } from '@/store/systemStore'

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
  const { tree, items, loading } = useBootstrap()
  const sys = useSystemStore((s) => s.settings)

  // 主框架挂载后装载系统设置（标题/meta/默认主题等），best-effort
  useEffect(() => {
    void useSystemStore.getState().hydrate()
  }, [])

  // 登录态守卫：无 token 且当前非登录页，则跳转登录
  if (!getAccessToken() && location.pathname !== '/login') {
    return <Navigate to="/login" replace />
  }

  const currentPath = location.pathname
  const firstPath = items[0]?.fullPath || '/dashboard'

  // 由动态菜单构建内容路由配置（独立路由上下文，绝对路径直接匹配）
  // 菜单未加载完成前，未匹配路径不急于重定向到首个菜单页——否则直接深链
  // （如 /role）会在菜单到达前被 '*' 兜底重定向到 /dashboard，导致永远访问不到。
  const contentRoutes = useMemo(
    () => [
      { index: true, element: <Navigate to={firstPath} replace /> },
      ...buildMenuRouteObjects(tree),
      // 菜单就绪后未匹配路径渲染 404；加载中/为空时渲染加载占位，避免误跳转
      {
        path: '*',
        element: loading || items.length === 0
          ? <PageLoading />
          : <NotFound />,
      },
    ],
    [tree, items, firstPath, loading],
  )
  const content = useRoutes(contentRoutes)

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

  // 后端返回 401 时跳转到 401 专用页（页面内提供重新登录入口）
  useEffect(() => {
    onUnauthorized(() => navigate('/401', { replace: true }))
  }, [navigate])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        tree={tree}
        currentPath={currentPath}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          tree={tree}
          currentPath={currentPath}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onOpenCommand={() => setCommandOpen(true)}
        />
        <main className="flex-1 overflow-hidden bg-background">
          {/* 菜单路由按需懒加载，Suspense 仅覆盖内容区，侧栏/顶栏不闪烁 */}
          <Suspense fallback={<PageLoading />}>{content}</Suspense>
        </main>
        <footer className="shrink-0 border-t border-border bg-background px-4 py-2 text-center text-xs text-muted-foreground">
          {sys.copyright}
          {sys.icp ? <span className="ml-2">{sys.icp}</span> : null}
        </footer>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} items={items} />
      <Toaster />
    </div>
  )
}
