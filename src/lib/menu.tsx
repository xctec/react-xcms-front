import { useEffect, useState, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, ShieldCheck, Network, Menu as MenuIcon,
  BookText, Group, LogIn, FileText, Building2, KeyRound, Layers3,
  Database, Fingerprint, Boxes, UserCog, User, Settings,
  Bell, CircleHelp,
} from 'lucide-react'
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

export interface AppMenuGroup {
  id: string
  label: string
  items: AppMenuItem[]
}

/* ============================ 图标注册表 ============================ */
// 后端 icon 字段通常为字符串（如 element 图标名或 lucide 图标名），这里做一层
// 字符串 -> LucideIcon 的映射，未命中时回退到 CircleHelp。
const iconRegistry: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  LayoutDashboard,
  users: Users,
  Users,
  'tenant-user': Users,
  shield: ShieldCheck,
  ShieldCheck,
  role: ShieldCheck,
  network: Network,
  Network,
  'org-unit': Network,
  menu: MenuIcon,
  MenuIcon,
  book: BookText,
  BookText,
  'dict-type': BookText,
  group: Group,
  Group,
  'role-group': Group,
  login: LogIn,
  LogIn,
  'login-log': LogIn,
  file: FileText,
  FileText,
  'sys-log': FileText,
  building: Building2,
  Building2,
  tenant: Building2,
  key: KeyRound,
  KeyRound,
  'role-template': KeyRound,
  layers: Layers3,
  Layers3,
  'menu-template': Layers3,
  database: Database,
  Database,
  'dict-template': Database,
  fingerprint: Fingerprint,
  Fingerprint,
  'token-admin': Fingerprint,
  boxes: Boxes,
  Boxes,
  'user-pool': Boxes,
  'user-cog': UserCog,
  UserCog,
  'platform-user': UserCog,
  user: User,
  User,
  profile: User,
  settings: Settings,
  Settings,
  account: Settings,
  bell: Bell,
  Bell,
  notifications: Bell,
}

function resolveIcon(name?: string): LucideIcon {
  return (name && iconRegistry[name]) || CircleHelp
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

/* ============================ 菜单树 -> 分组结构 ============================ */

function toItem(node: MenuTreeVO): AppMenuItem {
  return {
    path: node.routePath || '',
    label: node.name || '',
    icon: resolveIcon(node.icon),
    component: node.component,
    jumpType: node.jumpType,
    jumpTarget: node.jumpTarget,
    ready: Boolean(node.component && componentRegistry[node.component]),
  }
}

/** 把后端菜单树转换为侧栏分组结构（M=分组，D=页面项） */
export function toMenuGroups(tree: MenuTreeVO[]): AppMenuGroup[] {
  const groups: AppMenuGroup[] = []
  for (const node of tree) {
    if (node.menuType === 'B' || node.showStatus === '0') continue
    if (node.menuType === 'M') {
      const children = (node.children || []).filter(
        (c) => c.menuType !== 'B' && c.showStatus !== '0',
      )
      groups.push({
        id: String(node.id ?? node.code ?? node.name),
        label: node.name || '',
        items: children.map(toItem),
      })
    } else {
      // 独立叶子（无父目录），归入「其他」
      groups.push({
        id: String(node.id ?? node.code ?? node.name),
        label: node.name || '',
        items: [toItem(node)],
      })
    }
  }
  return groups
}

/** 扁平化所有可导航菜单项，供命令面板 / 查找使用 */
export function flattenMenuItems(groups: AppMenuGroup[]): AppMenuItem[] {
  return groups.flatMap((g) => g.items)
}

/* ============================ 菜单获取 Hook ============================ */

const DEFAULT_MENU: MenuTreeVO[] = [
  {
    id: 1, menuType: 'M', name: '工作区', orderNum: 1,
    children: [{ id: 11, menuType: 'D', name: '工作台', routePath: '/dashboard', component: 'dashboard', icon: 'dashboard', orderNum: 1 }],
  },
  {
    id: 2, menuType: 'M', name: '系统管理', orderNum: 2,
    children: [
      { id: 21, menuType: 'D', name: '租户账户/成员', routePath: '/tenant-user', component: 'tenant-user', icon: 'users', orderNum: 1 },
      { id: 22, menuType: 'D', name: '角色管理', routePath: '/role', component: 'role', icon: 'shield', orderNum: 2 },
      { id: 23, menuType: 'D', name: '组织机构', routePath: '/org-unit', component: 'org-unit', icon: 'network', orderNum: 3 },
      { id: 24, menuType: 'D', name: '菜单管理', routePath: '/menu', component: 'menu', icon: 'menu', orderNum: 4 },
      { id: 25, menuType: 'D', name: '字典类型', routePath: '/dict-type', component: 'dict-type', icon: 'book', orderNum: 5 },
      { id: 26, menuType: 'D', name: '角色分组', routePath: '/role-group', component: 'role-group', icon: 'group', orderNum: 6 },
      { id: 27, menuType: 'D', name: '登录日志', routePath: '/login-log', component: 'login-log', icon: 'login', orderNum: 7 },
      { id: 28, menuType: 'D', name: '操作日志', routePath: '/sys-log', component: 'sys-log', icon: 'file', orderNum: 8 },
    ],
  },
  {
    id: 3, menuType: 'M', name: '平台管理', orderNum: 3,
    children: [
      { id: 31, menuType: 'D', name: '租户管理', routePath: '/tenant', component: 'tenant', icon: 'building', orderNum: 1 },
      { id: 32, menuType: 'D', name: '角色模板', routePath: '/role-template', component: 'role-template', icon: 'key', orderNum: 2 },
      { id: 33, menuType: 'D', name: '菜单模板', routePath: '/menu-template', component: 'menu-template', icon: 'layers', orderNum: 3 },
      { id: 34, menuType: 'D', name: '字典模板', routePath: '/dict-template', component: 'dict-template', icon: 'database', orderNum: 4 },
      { id: 35, menuType: 'D', name: 'Token 管理', routePath: '/token-admin', component: 'token-admin', icon: 'fingerprint', orderNum: 5 },
      { id: 36, menuType: 'D', name: '用户池', routePath: '/user-pool', component: 'user-pool', icon: 'boxes', orderNum: 6 },
      { id: 37, menuType: 'D', name: '平台用户', routePath: '/platform-user', component: 'platform-user', icon: 'user-cog', orderNum: 7 },
    ],
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
  groups: AppMenuGroup[]
  items: AppMenuItem[]
  loading: boolean
}

/** 拉取 /api/frame/menu 并把菜单树转换为前端分组结构；失败时回退到默认菜单 */
export function useMenus(): MenuState {
  const [groups, setGroups] = useState<AppMenuGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    apiClient
      .GET<{ data?: MenuTreeVO[] }>('/api/frame/menu')
      .then((res) => {
        if (!alive) return
        const tree = res.data?.data
        if (Array.isArray(tree) && tree.length > 0) {
          setGroups(toMenuGroups(tree))
        } else {
          setGroups(toMenuGroups(DEFAULT_MENU))
        }
      })
      .catch(() => {
        if (alive) setGroups(toMenuGroups(DEFAULT_MENU))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { groups, items: flattenMenuItems(groups), loading }
}
