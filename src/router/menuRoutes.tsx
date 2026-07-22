import type { ReactElement } from 'react'
import { Route, Navigate } from 'react-router-dom'
import type { AppMenuItem } from '@/lib/menu'
import { resolveComponent } from '@/lib/menu'
import { Placeholder } from './Placeholder'

/**
 * 由菜单项「动态拼接」路由（Route 元素数组）。
 *
 * 这属于「路由」层面的逻辑，因此放在 src/router 目录；页面壳子
 * （侧栏/顶栏）由 src/layouts/AppLayout 负责渲染，二者职责分离。
 *
 * - 绑定了组件（且为站内路由）的菜单项 → 渲染对应页面（懒加载组件）
 * - 未绑定组件 → 渲染占位页
 * - 外链 / iframe（jumpType 2/3）→ 不生成前端路由
 */
export function buildMenuRoutes(items: AppMenuItem[], firstPath: string): ReactElement[] {
  const pageRoutes = items
    .filter((it) => it.jumpType !== '2' && it.jumpType !== '3')
    .map((it) => {
      const Comp = resolveComponent(it.component)
      return (
        <Route
          key={it.path}
          path={it.path}
          element={Comp ? <Comp /> : <Placeholder currentPath={it.path} />}
        />
      )
    })

  return [
    <Route key="index" path="/" element={<Navigate to={firstPath} replace />} />,
    ...pageRoutes,
    <Route key="404" path="*" element={<Placeholder currentPath="" />} />,
  ]
}
