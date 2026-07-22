import { create } from 'zustand'
import type { components } from '@/lib/api/schema'
import { apiClient, call } from '@/utils/request'

/** 当前登录用户资料（来自 /api/frame/me 或 /api/frame/bootstrap） */
export type FrameUser = components['schemas']['FrameUserVO']

type BootstrapData = components['schemas']['FrameBootstrapVO']
type MenuTree = components['schemas']['MenuTreeVO']

interface UserState {
  user: FrameUser | null
  /** me / bootstrap 请求是否进行中 */
  loading: boolean
  /** 是否已成功加载过（用于区分「未登录」与「加载中」） */
  loaded: boolean

  /** 拉取当前用户资料（/api/frame/me） */
  fetchMe: () => Promise<FrameUser | null>
  /** 引导数据：聚合 user + 菜单树（/api/frame/bootstrap），仅写入 user 部分，菜单由 menu 模块消费 */
  fetchBootstrap: () => Promise<{ user: FrameUser | null; menus: MenuTree[] }>
  /** 设置用户（登录成功后或 bootstrap 返回时写入） */
  setUser: (user: FrameUser | null) => void
  /** 清空（登出时调用） */
  reset: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  loaded: false,

  fetchMe: async () => {
    set({ loading: true })
    try {
      const user = (await call(apiClient.GET<components['schemas']['ResultVoFrameUserVO']>('/api/frame/me'))
        .then((r) => r?.data ?? null)
        .catch(() => null)) as FrameUser | null
      set({ user, loaded: true })
      return user
    } finally {
      set({ loading: false })
    }
  },

  fetchBootstrap: async () => {
    set({ loading: true })
    try {
      const data = (await call(apiClient.GET<components['schemas']['ResultVoFrameBootstrapVO']>('/api/frame/bootstrap'))
        .then((r) => r?.data ?? null)
        .catch(() => null)) as BootstrapData | null
      const user = data?.user ?? null
      const menus = Array.isArray(data?.menus) ? data.menus : []
      set({ user, loaded: true })
      return { user, menus }
    } finally {
      set({ loading: false })
    }
  },

  setUser: (user) => set({ user, loaded: true }),
  reset: () => set({ user: null, loading: false, loaded: false }),
}))
