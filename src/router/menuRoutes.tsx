import type { RouteObject } from 'react-router-dom'
import type { AppMenuNode } from '@/router/menu'
import { lazyView } from '@/router/menu'
import { Placeholder } from './Placeholder'

/**
 * 由菜单树「动态拼接」路由配置（RouteObject 数组，供 useRoutes 使用）。
 *
 * 这属于「路由」层面的逻辑，因此放在 src/router 目录；页面壳子
 * （侧栏/顶栏）由 src/layouts/AppLayout 负责渲染，二者职责分离。
 *
 * 路由按返回的菜单树**嵌套生成**：目录节点成为父路由，其 children 递归
 * 作为子路由，与后端树状结构一一对应，而非把所有页面拍平成同级 Route。
 *
 * - 绑定了组件（component 命中已打包视图）的菜单项 → 渲染对应页面（懒加载）
 * - 未绑定组件且为叶子 → 渲染占位页
 * - 外链 / iframe（jumpType 2/3）→ 不生成前端路由
 * - 纯目录节点（含子节点但无 component）→ 作为透明父路由，仅承载 children，
 *   react-router 在父路由无 element 时会直接渲染匹配到的子路由（行为同拍平）
 *
 * 路由 key 使用后端菜单编码 code（经 lib/menu 加工为 node.key），保证
 * 与侧栏高亮、AppLayout 的 routeByKey 查找体系一致。
 *
 * 路由 path 使用节点经「父路径 + routePath 」拼接后得到的**绝对路径** fullPath。
 * 之所以用 fullPath 而非原始 routePath：真实后端下发的 routePath 可能是相对
 * 片段（如 org-unit）也可能绝对（如 /dashboard），react-router 会把子路由 path
 * 拼到父路由之后，拼接结果正好等于 fullPath。直接用 fullPath 注册路由，可让
 * 「路由匹配地址」「侧栏导航地址」「高亮对比地址」三者完全一致，避免错位。
 * index('/') 与兜底('*')由 AppLayout 统一管理，这里只产出页面路由。
 */
export function buildMenuRouteObjects(nodes: AppMenuNode[]): RouteObject[] {
  const build = (n: AppMenuNode): RouteObject | null => {
    // 外链 / iframe 不生成前端路由
    if (n.jumpType === '2' || n.jumpType === '3') return null

    const hasChildren = Boolean(n.children?.length)

    // 目录节点：递归子节点，自身作为父路由承载 children（无 element → 透明）
    if (hasChildren) {
      const children = n.children!
        .map(build)
        .filter((r): r is RouteObject => r !== null)
      if (children.length === 0) return null
      // 目录若无 routePath 则 fullPath 为空，注册为 pathless 路由（透明父级）
      return { path: n.fullPath, key: n.key, children } as RouteObject
    }

    // 叶子节点：有 component 渲染页面，否则渲染占位页
    if (!n.fullPath) return null
    const Comp = n.component ? lazyView(n.component) : undefined
    return {
      path: n.fullPath,
      key: n.key,
      element: Comp ? <Comp /> : <Placeholder currentPath={n.fullPath} />,
    } as RouteObject
  }

  const out: RouteObject[] = []
  for (const n of nodes) {
    const r = build(n)
    if (r) out.push(r)
  }
  return out
}
