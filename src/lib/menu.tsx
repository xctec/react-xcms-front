import { useEffect, useState, lazy, type ComponentType, type LazyExoticComponent } from 'react'

/* ============================ 视图动态打包声明 ============================ */
// 用 import.meta.glob 在编译期静态声明打包 src/views 下所有页面，
// 这样运行时即可按后端返回的 component 值（如 "system/tenant-user/index"）
// 动态 import(`@/views/${component}`) 并懒加载对应页面，实现后端菜单驱动前端路由。
// 注意：glob 模式相对本文件（src/lib），指向 src/views。映射 key 形如
//   ../views/system/tenant-user/index.tsx
// 各页面文件末尾已追加 `export default Xxx`，可直接被 React.lazy 消费。
const viewModules = import.meta.glob<Record<string, ComponentType>>('../views/**/*.tsx')

/** 按后端 component 值解析出懒加载页面组件（命中则返回，未命中返回 undefined） */
export function lazyView(component?: string): LazyExoticComponent<ComponentType> | undefined {
  if (!component) return undefined
  const importer = viewModules[`../views/${component}.tsx`]
  if (!importer) return undefined
  return lazy(() => importer().then((m) => ({ default: (m as any).default as ComponentType })))
}
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
  /** 前端私有标记：为 true 时仅生成路由、不渲染到侧边栏菜单 */
  hidden?: boolean
  children?: MenuTreeVO[]
}

/** 经前端加工后的菜单项（叶子节点 = 可导航页面） */
export interface AppMenuItem {
  /** 真正用于导航 / 高亮的绝对路径（如 /system/org-unit），已按路由树拼接父路径 */
  path: string
  label: string
  icon: LucideIcon
  /** 页面对应的组件路径（后端下发的 component 值，如 system/tenant-user/index） */
  component?: string
  /** 后端菜单编码，用作路由与高亮的唯一键 */
  code?: string
  /** 跳转类型与外链目标 */
  jumpType?: '1' | '2' | '3'
  jumpTarget?: string
  /** 是否为已实现的页面（false 走占位页） */
  ready: boolean
  /** 真正用于导航 / 路由注册的绝对路径（与 AppMenuNode.fullPath 一致） */
  fullPath?: string
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
  /** 原始 routePath（可能相对，也可能绝对，仅用于路由生成参考） */
  path?: string
  /** 真正用于导航 / 高亮 / 路由注册的绝对路径（已按路由树拼接父路径） */
  fullPath?: string
  component?: string
  /** 后端菜单编码，用作路由与高亮的唯一键 */
  code?: string
  jumpType?: '1' | '2' | '3'
  jumpTarget?: string
  ready: boolean
  /** 为 true 时仅生成路由、不渲染到侧边栏菜单 */
  hidden?: boolean
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

/* ============================ 菜单树 -> 递归节点树 ============================ */

/**
 * 按 react-router 的路由解析规则，由父路径 + 本节点 routePath 计算真正可用于
 * 导航 / 路由注册的绝对路径：
 *   - routePath 以 '/' 开头 → 作为根路径，忽略父路径（与 react-router 一致）
 *   - routePath 为相对片段 → 拼接到父路径之后（去掉多余斜杠）
 *   - routePath 为空（纯目录分组）→ 继承父路径（其子节点继续在此路径下拼接）
 * 这样无论后端下发的是相对还是绝对 routePath，前端导航、高亮、路由三者始终一致。
 */
function resolveFullPath(parentPath: string | undefined, routePath?: string): string | undefined {
  if (!routePath) return parentPath
  const clean = routePath.replace(/\/+$/, '') || '/'
  if (clean.startsWith('/')) return clean
  const base = (parentPath || '').replace(/\/+$/, '')
  return base ? `${base}/${clean}` : `/${clean}`
}

function toNode(node: MenuTreeVO, parentKey: string, index: number, parentPath?: string): AppMenuNode {
  const children = (node.children || []).filter(
    (c) => c.menuType !== 'B' && c.showStatus !== '0',
  )
  // 路由 / 高亮唯一键：优先使用后端菜单编码 code，回退 id / name 保证不丢 key
  const code = node.code
  const key = `${parentKey}${parentKey ? '-' : ''}${code ?? node.id ?? node.name ?? index}`
  const hasChildren = children.length > 0
  const fullPath = resolveFullPath(parentPath, node.routePath)
  return {
    key,
    label: node.name || '',
    icon: resolveIcon(node.icon),
    path: node.routePath,
    fullPath,
    component: node.component,
    code,
    hidden: node.hidden,
    jumpType: node.jumpType,
    jumpTarget: node.jumpTarget,
    // 已实现：后端返回了 component 且该 component 对应的视图文件已被打包（glob 命中）
    ready: Boolean(node.component && viewModules[`../views/${node.component}.tsx`]),
    // 只要含可见子节点即为目录（M 嵌套 M 任意层均支持）
    children: hasChildren ? children.map((c, i) => toNode(c, key, i, fullPath)) : undefined,
  }
}

/** 把后端菜单树递归转换为前端节点树（支持任意层级嵌套） */
export function toMenuTree(tree: MenuTreeVO[], keyPrefix = ''): AppMenuNode[] {
  return tree
    .filter((n) => n.menuType !== 'B' && n.showStatus !== '0')
    .map((n, i) => toNode(n, keyPrefix, i))
}

/** 扁平化所有可导航叶子菜单项，供命令面板 / 路由使用（跳过 hidden 节点与无路径叶子） */
export function flattenMenuItems(nodes: AppMenuNode[]): AppMenuItem[] {
  const out: AppMenuItem[] = []
  const walk = (ns: AppMenuNode[]) => {
    for (const n of ns) {
      if (n.hidden) continue
      if (n.children?.length) walk(n.children)
      else if (n.fullPath) out.push({ path: n.fullPath, label: n.label, icon: n.icon, component: n.component, code: n.code, jumpTarget: n.jumpTarget, jumpType: n.jumpType, ready: n.ready, fullPath: n.fullPath })
    }
  }
  walk(nodes)
  return out
}

/** 由当前路径反查从根到该节点的链路，用于面包屑 */
export function findMenuChain(tree: AppMenuNode[], path: string): AppMenuNode[] {
  for (const n of tree) {
    if (!n.children?.length && n.fullPath === path) return [n]
    if (n.children?.length) {
      const sub = findMenuChain(n.children, path)
      if (sub.length) return [n, ...sub]
    }
  }
  return []
}

/* ============================ 静态菜单（内置，不请求服务端） ============================ */
// 工作区是前端固定路由，始终展示；个人中心及其子页面也是固定路由，但 hidden: true
// 仅生成路由（可由链接/代码跳转访问），不渲染到侧边栏菜单。
const STATIC_MENU: MenuTreeVO[] = [
  {
    id: 1, menuType: 'M', name: '工作区', orderNum: 1,
    children: [{ id: 11, menuType: 'D', name: '工作台', routePath: '/dashboard', component: 'dashboard/index', icon: 'LayoutDashboard', orderNum: 1 }],
  },
  {
    id: 4, menuType: 'M', name: '个人中心', orderNum: 9, hidden: true,
    children: [
      { id: 41, menuType: 'D', name: '个人设置', routePath: '/profile', component: 'account/profile/index', icon: 'user', orderNum: 1 },
      { id: 42, menuType: 'D', name: '账号设置', routePath: '/account', component: 'account/settings/index', icon: 'settings', orderNum: 2 },
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
  const staticNodes = toMenuTree(STATIC_MENU, 's') // [工作区, 个人中心]，前缀 s 避免与动态菜单 key 冲突
  const dynamicNodes = toMenuTree(dynamic, 'd')
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
