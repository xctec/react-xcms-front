import { useEffect, useState } from 'react'
import { apiClient } from '@/utils/request'
import {
  buildMenuTree,
  flattenMenuItems,
  type AppMenuNode,
  type MenuState,
  type MenuTreeVO,
} from '@/router/menu'

/**
 * 拉取动态菜单并叠加静态菜单；远端返回为空 / 拉取失败时仅展示静态菜单。
 *
 * @param external 可选：外部已拉取的动态菜单（如 bootstrap 一次性返回）。
 *                 传入时不再自行请求 /api/frame/menu，直接复用该数组；
 *                 不传则自动请求 /api/frame/menu 兜底（兼容仅要菜单的场景）。
 */
export function useMenus(external?: MenuTreeVO[]): MenuState {
  const [tree, setTree] = useState<AppMenuNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const apply = (dynamic: MenuTreeVO[]) => {
      if (!alive) return
      setTree(buildMenuTree(dynamic))
      setLoading(false)
    }
    // 外部已提供菜单（bootstrap 路径）：直接复用，避免重复请求
    if (external) {
      apply(external)
      return () => {
        alive = false
      }
    }
    apiClient
      .GET<{ data?: MenuTreeVO[] }>('/api/frame/menu')
      .then((res) => {
        if (!alive) return
        const t = res.data?.data
        apply(Array.isArray(t) ? t : [])
      })
      .catch(() => {
        if (alive) apply([])
      })
    return () => {
      alive = false
    }
  }, [external])

  return { tree, items: flattenMenuItems(tree), loading }
}
