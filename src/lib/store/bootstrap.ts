import { useEffect, useState } from 'react'
import type { components } from '@/lib/api/schema'
import { useMenus, type MenuState } from '@/lib/menu'
import { useUserStore } from '@/lib/store/userStore'

/**
 * 应用引导：登录成功后一次性拉取 user + 菜单树（/api/frame/bootstrap），
 * 把 user 写入 userStore、把 menus 交给 useMenus 复用，避免 menu 与 me 各自发请求。
 *
 * 返回 { user, menus, loading }，菜单树直接用于路由/侧边栏渲染。
 */
export function useBootstrap(): MenuState & { user: components['schemas']['FrameUserVO'] | null } {
  const [menus, setMenus] = useState<components['schemas']['MenuTreeVO'][] | undefined>(undefined)
  const [loadingBootstrap, setLoadingBootstrap] = useState(true)
  const fetchBootstrap = useUserStore((s) => s.fetchBootstrap)
  const setUser = useUserStore((s) => s.setUser)
  const user = useUserStore((s) => s.user)

  useEffect(() => {
    let alive = true
    setLoadingBootstrap(true)
    fetchBootstrap()
      .then(({ user: u, menus: m }) => {
        if (!alive) return
        setUser(u)
        setMenus(m)
      })
      .finally(() => {
        if (alive) setLoadingBootstrap(false)
      })
    return () => {
      alive = false
    }
  // 仅首次挂载触发（登录后进入主框架时调用一次）
  }, [fetchBootstrap, setUser])

  // 菜单加载状态跟随 bootstrap 进行中；bootstrap 返回后由 useMenus 接管
  const menu = useMenus(menus)
  return { ...menu, loading: menu.loading || loadingBootstrap, user }
}
