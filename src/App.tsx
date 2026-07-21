import { useEffect, useState } from 'react'
import { XcmsThemeProvider } from '@/lib/theme'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { CommandPalette } from '@/components/CommandPalette'
import { findNavItem } from '@/lib/navigation'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/pages/Dashboard'
import { Login } from '@/pages/Login'
import { LoginLog } from '@/pages/LoginLog'
import { TenantUser } from '@/pages/TenantUser'
import { MenuManagement } from '@/pages/MenuManagement'
import { OrgUnit } from '@/pages/OrgUnit'
import { DictType } from '@/pages/DictType'
import { Role } from '@/pages/Role'
import { SysLog } from '@/pages/SysLog'
import { RoleGroup } from '@/pages/RoleGroup'
import { Tenant } from '@/pages/Tenant'
import { TokenAdmin } from '@/pages/TokenAdmin'
import { RoleTemplate } from '@/pages/RoleTemplate'
import { MenuTemplate } from '@/pages/MenuTemplate'
import { DictTemplate } from '@/pages/DictTemplate'
import { UserPool } from '@/pages/UserPool'
import { PlatformUser } from '@/pages/PlatformUser'
import { Profile } from '@/pages/Profile'
import { Account } from '@/pages/Account'
import { Construction, ArrowLeft, LayoutGrid } from 'lucide-react'

function Placeholder({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  const item = findNavItem(page)
  const Icon = item?.icon || Construction
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-5">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{item?.label ?? '页面'}</h2>
          <p className="text-sm text-muted-foreground mb-1">该页面的高保真设计图暂未实现</p>
          <p className="text-xs text-muted-foreground/70 mb-6 leading-relaxed">
            本设计已覆盖全部 16 个功能区与登录页，演示了
            <span className="text-brand-600 dark:text-brand-400 font-medium">纯表格 / 树+表格 / 树形表格 / 表格嵌套</span>
            四类典型布局，以及命令面板、暗黑模式、主色切换、菜单授权弹窗
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4" />
              返回工作台
            </Button>
            <Button onClick={() => onNavigate('role')}>
              <LayoutGrid className="h-4 w-4" />
              查看角色管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderPage(page: string, onNavigate: (p: string) => void) {
  switch (page) {
    case 'dashboard': return <Dashboard onNavigate={onNavigate} />
    case 'login-log': return <LoginLog />
    case 'tenant-user': return <TenantUser />
    case 'menu': return <MenuManagement />
    case 'org-unit': return <OrgUnit />
    case 'dict-type': return <DictType />
    case 'role': return <Role />
    case 'role-group': return <RoleGroup />
    case 'sys-log': return <SysLog />
    case 'tenant': return <Tenant />
    case 'token-admin': return <TokenAdmin />
    case 'role-template': return <RoleTemplate />
    case 'menu-template': return <MenuTemplate />
    case 'dict-template': return <DictTemplate />
    case 'user-pool': return <UserPool />
    case 'platform-user': return <PlatformUser />
    case 'profile': return <Profile />
    case 'account': return <Account />
    default: return <Placeholder page={page} onNavigate={onNavigate} />
  }
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

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

  const navigate = (page: string) => setCurrentPage(page)

  // 登录页独立于主框架渲染（无侧栏 / 顶栏）
  if (currentPage === 'login') return <Login onNavigate={navigate} />

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar
          currentPage={currentPage}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onOpenCommand={() => setCommandOpen(true)}
          onNavigate={navigate}
        />
        <main className="flex-1 overflow-hidden bg-background">
          {renderPage(currentPage, navigate)}
        </main>
      </div>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={navigate}
      />
      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <XcmsThemeProvider>
      <AppContent />
    </XcmsThemeProvider>
  )
}
