import { create } from 'zustand'
import type { components } from '@/lib/api/schema'
import { apiClient, call, setTokens, clearTokens, getAccessToken } from '@/utils/request'

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
  /** 仅清空本地用户状态（不调后端，token 也一并清除） */
  reset: () => void

  /**
   * 登录：调用 /api/auth/login，成功后写入 token（用户资料由后续 bootstrap 加载）。
   * 返回成功与否，错误信息交由调用方（登录页）展示。
   */
  login: (body: {
    loginId: string
    credential: string
    type: string
    tenantId: number
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  /** 登出：best-effort 通知后端吊销令牌，随后清除本地 token 与用户状态 */
  logout: () => Promise<void>
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

  login: async ({ loginId, credential, type, tenantId }) => {
    const res = await apiClient.POST<{
      errorNo?: string
      errorMsg?: string
      data?: { accessToken?: string; refreshToken?: string }
    }>('/api/auth/login', { body: { loginId, credential, type, tenantId }, silent: true })
    if (res.error) {
      const err = res.error as { errorMsg?: string } | string
      const message = typeof err === 'string' ? err : err?.errorMsg || '登录失败，请检查用户名或密码'
      return { ok: false, message }
    }
    const body = res.data
    if (body && body.errorNo != null && body.errorNo !== '0') {
      return { ok: false, message: body.errorMsg || '登录失败' }
    }
    const d = body?.data
    if (d?.accessToken) setTokens(d.accessToken, d.refreshToken || '')
    return { ok: true }
  },

  logout: async () => {
    const token = getAccessToken()
    if (token) {
      // 通知后端吊销当前访问令牌（best-effort，失败不影响本地登出）
      await apiClient.POST('/api/auth/logout', { body: { accessToken: token } }).catch(() => {})
    }
    clearTokens()
    set({ user: null, loading: false, loaded: false })
  },
}))
