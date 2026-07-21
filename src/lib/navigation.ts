import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, ShieldCheck, Network, Menu as MenuIcon,
  BookText, Group, LogIn, FileText, Building2, KeyRound, Layers3,
  Database, Fingerprint, Boxes, UserCog,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  page: string
  badge?: string | number
  /** 是否已实现高保真设计图（未实现的点击后显示占位页） */
  ready?: boolean
}

export interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    label: '工作区',
    items: [
      { id: 'dashboard', label: '工作台', icon: LayoutDashboard, page: 'dashboard', ready: true },
    ],
  },
  {
    id: 'system',
    label: '系统管理',
    items: [
      { id: 'tenant-user', label: '租户账户/成员', icon: Users, page: 'tenant-user', ready: true },
      { id: 'role', label: '角色管理', icon: ShieldCheck, page: 'role', ready: true, badge: '授权' },
      { id: 'org-unit', label: '组织机构', icon: Network, page: 'org-unit', ready: true },
      { id: 'menu', label: '菜单管理', icon: MenuIcon, page: 'menu', ready: true },
      { id: 'dict-type', label: '字典类型', icon: BookText, page: 'dict-type', ready: true },
      { id: 'role-group', label: '角色分组', icon: Group, page: 'role-group', ready: true },
      { id: 'login-log', label: '登录日志', icon: LogIn, page: 'login-log', ready: true },
      { id: 'sys-log', label: '操作日志', icon: FileText, page: 'sys-log', ready: true },
    ],
  },
  {
    id: 'platform',
    label: '平台管理',
    items: [
      { id: 'tenant', label: '租户管理', icon: Building2, page: 'tenant', ready: true },
      { id: 'role-template', label: '角色模板', icon: KeyRound, page: 'role-template', ready: true },
      { id: 'menu-template', label: '菜单模板', icon: Layers3, page: 'menu-template', ready: true },
      { id: 'dict-template', label: '字典模板', icon: Database, page: 'dict-template', ready: true },
      { id: 'token-admin', label: 'Token 管理', icon: Fingerprint, page: 'token-admin', ready: true },
      { id: 'user-pool', label: '用户池', icon: Boxes, page: 'user-pool', ready: true },
      { id: 'platform-user', label: '平台用户', icon: UserCog, page: 'platform-user', ready: true },
    ],
  },
]

/** 扁平化所有菜单项，供命令面板使用 */
export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

/** 根据 page key 查找菜单项 */
export function findNavItem(page: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.page === page)
}
