import type { RouteObject } from 'react-router-dom'
import type { AppMenuNode } from '@/lib/menu'
import { lazyView } from '@/lib/menu'
import { Placeholder } from './Placeholder'

/**
 * 由菜单树「动态拼接」路由配置（RouteObject 数组，供 useRoutes 使用）。
 *
 * 这属于「路由」层面的逻辑，因此放在 src/router 目录；页面壳子
 * （侧栏/顶栏）由 src/layouts/AppLayout 负责渲染，二者职责分离。
 *
 * - 绑定了组件（component 命中已打包视图）的菜单项 → 渲染对应页面（懒加载）
 * - 未绑定组件且为叶子 → 渲染占位页
 * - 外链 / iframe（jumpType 2/3）→ 不生成前端路由
 * - 纯目录节点（含子节点但无 component）→ 不单独生成路由，仅递归子节点
 *
 * 路由 key 使用后端菜单编码 code（经 lib/menu 加工为 node.key），保证
 * 与侧栏高亮、AppLayout 的 routeByKey 查找体系一致。
 *
 * 路由 path 使用菜单下发的绝对路径（以 '/' 开头）。AppLayout 内部通过
 * useRoutes（独立路由上下文）匹配，路径按绝对地址与当前 location 直接
 * 比对，不会与任何父路由片段拼接，菜单页才能被正确访问。
 * index('/') 与兜底('*')由 AppLayout 统一管理，这里只产出页面路由。
 */
export function buildMenuRouteObjects(nodes: AppMenuNode[]): RouteObject[] {
  const out: RouteObject[] = []

  const walk = (ns: AppMenuNode[]) => {
    for (const n of ns) {
      // 外链 / iframe 不生成前端路由
      if (n.jumpType === '2' || n.jumpType === '3') continue

      const Comp = n.component ? lazyView(n.component) : undefined
      const hasChildren = Boolean(n.children?.length)

      // 仅对「有 component 的节点」或「叶子节点」生成可见路由；纯目录只递归
      if (n.path && (Comp || !hasChildren)) {
        out.push({
          path: n.path,
          key: n.key,
          element: Comp ? <Comp /> : <Placeholder currentPath={n.path} />,
        } as RouteObject)
      }

      if (hasChildren) walk(n.children!)
    }
  }

  walk(nodes)
  return out
}
