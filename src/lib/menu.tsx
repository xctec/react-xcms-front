import { useEffect, useState, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { apiClient } from '@/utils/request'

/* ============================ 类型 ============================ */

/** 后端菜单树节点（来自 /api/frame/menu） */
interface MenuTreeVO {
  id?: number
  parentId?: number
  name?: string
  code?: string
  menuType?: 'M' | 'D' | 'B'
  routePath?: string
  component?: string
  icon?: string
  redirect?: string
  /** 跳转类型：1 应用内路由 / 2 外链 / 3 内嵌 iframe */
  jumpType?: '1' | '2' | '3'
  jumpTarget?: string
  orderNum?: number
  showStatus?: '0' | '1'
  children?: MenuTreeVO[]
}

/** 经前端加工后的菜单项（叶子节点 = 可导航页面） */
export interface AppMenuItem {
  /** 路由路径，用作导航与高亮的唯一键（如 /role） */
  path: string
  label: string
  icon: LucideIcon
  /** 页面对应的组件标识（componentRegistry 的键） */
  component?: string
  /** 跳转类型与外链目标 */
  jumpType?: '1' | '2' | '3'
  jumpTarget?: string
  /** 是否为已实现的页面（false 走占位页） */
  ready: boolean
}

/**
 * 递归菜单节点：目录（含 children）与页面（叶子）统一为同一结构。
 * 支持任意层级嵌套——后端 MenuTreeVO 的 children 有多深，前端就渲染多深。
 */
export interface AppMenuNode {
  /** 唯一键（含父路径，用于展开状态与 React key） */
  key: string
  label: string
  icon: LucideIcon
  /** 站内路由路径（目录节点可能为空） */
  path?: string
  component?: string
  jumpType?: '1' | '2' | '3'
  jumpTarget?: string
  ready: boolean
  /** 包含子节点即为目录 */
  children?: AppMenuNode[]
}

/* ============================ 图标动态解析 ============================ */
// 后端 icon 字段直接返回 lucide 图标名，前端按名自动解析，无需手写映射：
//   - PascalCase：如 "LayoutDashboard"
//   - kebab-case：如 "layout-dashboard"
// 未命中（名字不存在）时回退到 CircleHelp。
/** 仅把 lucide 真正的图标组件挑出来（排除 createLucideIcon 等函数/类型导出） */
function isIconComponent(value: unknown): value is LucideIcon {
  return typeof value === 'object' && value !== null && '$$typeof' in value
}

// 一次性构建「名字 -> 图标」查找表：PascalCase 与 kebab-case 两种写法都能命中。
const lucideIconMap: Record<string, LucideIcon> = (() => {
  const map: Record<string, LucideIcon> = {}
  for (const [name, comp] of Object.entries(LucideIcons)) {
    if (!isIconComponent(comp)) continue
    map[name] = comp // PascalCase，如 LayoutDashboard
    const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    map[kebab] = comp // kebab-case，如 layout-dashboard
  }
  return map
})()

function resolveIcon(name?: string): LucideIcon {
  if (!name) return lucideIconMap['CircleHelp']
  return lucideIconMap[name] ?? lucideIconMap[name.toLowerCase()] ?? lucideIconMap['CircleHelp']
}

/* ============================ 组件注册表 ============================ */
// 视图绑定必须由前端写死（无法从后端字符串任意加载组件）。键为「页面标识」，
// 与各菜单的 component 字段对应；值为对应的页面组件。
// 视图绑定必须由前端写死（无法从后端字符串任意加载组件）。键为「页面标识」，
// 与各菜单的 component 字段对应；值为对应页面组件的懒加载版本，实现按需 code-split。
const componentRegistry: Record<string, LazyExoticComponent<ComponentType>> = {
  dashboard: lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard }))),
  'login-log': lazy(() => import('@/pages/LoginLog').then((m) => ({ default: m.LoginLog }))),
  'tenant-user': lazy(() => import('@/pages/TenantUser').then((m) => ({ default: m.TenantUser }))),
  menu: lazy(() => import('@/pages/MenuManagement').then((m) => ({ default: m.MenuManagement }))),
  'org-unit': lazy(() => import('@/pages/OrgUnit').then((m) => ({ default: m.OrgUnit }))),
  'dict-type': lazy(() => import('@/pages/DictType').then((m) => ({ default: m.DictType }))),
  role: lazy(() => import('@/pages/Role').then((m) => ({ default: m.Role }))),
  'sys-log': lazy(() => import('@/pages/SysLog').then((m) => ({ default: m.SysLog }))),
  'role-group': lazy(() => import('@/pages/RoleGroup').then((m) => ({ default: m.RoleGroup }))),
  tenant: lazy(() => import('@/pages/Tenant').then((m) => ({ default: m.Tenant }))),
  'token-admin': lazy(() => import('@/pages/TokenAdmin').then((m) => ({ default: m.TokenAdmin }))),
  'role-template': lazy(() => import('@/pages/RoleTemplate').then((m) => ({ default: m.RoleTemplate }))),
  'menu-template': lazy(() => import('@/pages/MenuTemplate').then((m) => ({ default: m.MenuTemplate }))),
  'dict-template': lazy(() => import('@/pages/DictTemplate').then((m) => ({ default: m.DictTemplate }))),
  'user-pool': lazy(() => import('@/pages/UserPool').then((m) => ({ default: m.UserPool }))),
  'platform-user': lazy(() => import('@/pages/PlatformUser').then((m) => ({ default: m.PlatformUser }))),
  profile: lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile }))),
  account: lazy(() => import('@/pages/Account').then((m) => ({ default: m.Account }))),
}

export function resolveComponent(key?: string): LazyExoticComponent<ComponentType> | undefined {
  return key ? componentRegistry[key] : undefined
}

/* ============================ 菜单树 -> 递归节点树 ============================ */

function toNode(node: MenuTreeVO, parentKey: string, index: number): AppMenuNode {
  const children = (node.children || []).filter(
    (c) => c.menuType !== 'B' && c.showStatus !== '0',
  )
  const key = `${parentKey}${parentKey ? '-' : ''}${node.id ?? node.code ?? node.name ?? index}`
  const hasChildren = children.length > 0
  return {
    key,
    label: node.name || '',
    icon: resolveIcon(node.icon),
    path: node.routePath,
    component: node.component,
    jumpType: node.jumpType,
    jumpTarget: node.jumpTarget,
    ready: Boolean(node.component && componentRegistry[node.component]),
    // 只要含可见子节点即为目录（M 嵌套 M 任意层均支持）
    children: hasChildren ? children.map((c, i) => toNode(c, key, i)) : undefined,
  }
}

/** 把后端菜单树递归转换为前端节点树（支持任意层级嵌套） */
export function toMenuTree(tree: MenuTreeVO[]): AppMenuNode[] {
  return tree
    .filter((n) => n.menuType !== 'B' && n.showStatus !== '0')
    .map((n, i) => toNode(n, '', i))
}

/** 扁平化所有可导航叶子菜单项，供命令面板 / 路由使用 */
export function flattenMenuItems(nodes: AppMenuNode[]): AppMenuItem[] {
  const out: AppMenuItem[] = []
  const walk = (ns: AppMenuNode[]) => {
    for (const n of ns) {
      if (n.children?.length) walk(n.children)
      else out.push({ path: n.path || '', label: n.label, icon: n.icon, component: n.component, jumpType: n.jumpType, jumpTarget: n.jumpTarget, ready: n.ready })
    }
  }
  walk(nodes)
  return out
}

/** 由当前路径反查从根到该节点的链路，用于面包屑 */
export function findMenuChain(tree: AppMenuNode[], path: string): AppMenuNode[] {
  for (const n of tree) {
    if (!n.children?.length && n.path === path) return [n]
    if (n.children?.length) {
      const sub = findMenuChain(n.children, path)
      if (sub.length) return [n, ...sub]
    }
  }
  return []
}

/* ============================ 静态菜单（内置，不请求服务端） ============================ */
// 工作区、个人中心及其子页面是前端固定路由，不依赖后端菜单接口，始终展示。
const STATIC_MENU: MenuTreeVO[] = [
  {
    id: 1, menuType: 'M', name: '工作区', orderNum: 1,
    children: [{ id: 11, menuType: 'D', name: '工作台', routePath: '/dashboard', component: 'dashboard', icon: 'LayoutDashboard', orderNum: 1 }],
  },
  {
    id: 4, menuType: 'M', name: '个人中心', orderNum: 9,
    children: [
      { id: 41, menuType: 'D', name: '个人设置', routePath: '/profile', component: 'profile', icon: 'user', orderNum: 1 },
      { id: 42, menuType: 'D', name: '账号设置', routePath: '/account', component: 'account', icon: 'settings', orderNum: 2 },
      { id: 43, menuType: 'D', name: '通知中心', routePath: '/notifications', component: undefined, icon: 'bell', orderNum: 3 },
    ],
  },
]

interface MenuState {
  tree: AppMenuNode[]
  items: AppMenuItem[]
  loading: boolean
}

/**
 * 组装最终展示菜单：静态菜单（工作区 / 个人中心，始终前端内置）
 *             + 动态菜单（远端 /api/frame/menu 返回）。
 * 顺序：工作区置顶，动态菜单居中，个人中心置底。
 */
function buildMenuTree(dynamic: MenuTreeVO[]): AppMenuNode[] {
  const staticNodes = toMenuTree(STATIC_MENU) // [工作区, 个人中心]
  const dynamicNodes = toMenuTree(dynamic)
  return [staticNodes[0], ...dynamicNodes, staticNodes[1]]
}

/** 拉取动态菜单并叠加静态菜单；远端返回为空 / 拉取失败时仅展示静态菜单 */
export function useMenus(): MenuState {
  const [tree, setTree] = useState<AppMenuNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    apiClient
      .GET<{ data?: MenuTreeVO[] }>('/api/frame/menu')
      .then((res) => {
        if (!alive) return
        const t = res.data?.data
        const dynamic = Array.isArray(t) ? t : []
        setTree(buildMenuTree(dynamic))
      })
      .catch(() => {
        if (alive) setTree(buildMenuTree([]))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { tree, items: flattenMenuItems(tree), loading }
}
