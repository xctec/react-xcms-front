import { create } from 'zustand'
import { DEFAULT_BRAND, type BrandPreset } from '@/theme/brand'
import { useThemeStore } from '@/store/themeStore'
import { apiClient } from '@/utils/request'

/** 外观模式：亮色 / 暗色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 系统级配置（多为管理员可配置项，非个人偏好） */
export interface SystemSettings {
  /** 系统名称（侧边栏、标题、页脚共用） */
  name: string
  /** 副标题 / 版本小字（侧边栏、登录页等） */
  subtitle?: string
  /** Logo 图片地址（可选，缺省回退到图标方块） */
  logo?: string
  /** 浏览器标签页图标（缺省不写） */
  favicon?: string
  /** 版权信息（页脚） */
  copyright: string
  /** 备案号（可选，页脚展示） */
  icp?: string
  /** HTML <title> 模板，支持 {name} 占位符 */
  htmlTitle: string
  /** meta description */
  description?: string
  /** meta keywords */
  keywords?: string
  /** 默认主色调（仅在用户无本地选择时套用） */
  defaultBrand: BrandPreset
  /** 默认外观模式 */
  defaultMode: ThemeMode
  /** 默认语言 */
  locale: string
  /** 默认租户 ID（登录页 URL 无 tenantId 时回退） */
  defaultTenantId: number
}

/** 出厂默认配置；后端返回时按字段浅合并覆盖 */
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  name: 'XCMS',
  subtitle: '中台骨架 · v1.0',
  copyright: '© 2026 XCMS · 保留所有权利',
  htmlTitle: '{name} · 管理后台',
  description: 'XCMS 企业级中台管理系统',
  keywords: 'XCMS,中台,管理后台,权限,租户',
  defaultBrand: DEFAULT_BRAND,
  defaultMode: 'light',
  locale: 'zh-CN',
  defaultTenantId: 1,
}

/* ===================== document 写入辅助（SSR 安全） ===================== */
function setMeta(name: string, content?: string) {
  if (typeof document === 'undefined' || !content) return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setFavicon(href?: string) {
  if (typeof document === 'undefined' || !href) return
  let link = document.head.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = href
}

/** 把配置同步到 document（标题 / meta / favicon） */
function applyMeta(s: SystemSettings) {
  if (typeof document === 'undefined') return
  document.title = s.htmlTitle.replace('{name}', s.name)
  setMeta('description', s.description)
  setMeta('keywords', s.keywords)
  setFavicon(s.favicon)
}

/** 套用主题默认值：仅当用户从未在本地选择主色调时，回退到系统默认 */
function applyThemeDefaults(s: SystemSettings) {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('xcms-brand')) {
    useThemeStore.getState().setBrand(s.defaultBrand)
  }
}

interface SystemState {
  settings: SystemSettings
  /** 是否已完成一次远端/默认装载 */
  loaded: boolean
  /** 合并更新配置并立即同步到 document */
  setSettings: (partial: Partial<SystemSettings>) => void
  /** 拉取后端系统设置（best-effort，失败回退默认，不弹错误） */
  fetchSettings: () => Promise<void>
  /** 引导：装载设置 + 套用主题默认值（主框架挂载时调用一次） */
  hydrate: () => Promise<void>
}

// 模块加载即写入标题/meta，保证首屏前无闪烁（与 themeStore 的处理一致）
const initialSettings = DEFAULT_SYSTEM_SETTINGS
applyMeta(initialSettings)

export const useSystemStore = create<SystemState>((set, get) => ({
  settings: initialSettings,
  loaded: false,

  setSettings: (partial) => {
    const next = { ...get().settings, ...partial }
    set({ settings: next })
    applyMeta(next)
  },

  fetchSettings: async () => {
    try {
      const res = await apiClient.GET<{ data?: Partial<SystemSettings> }>('/api/system/setting', { silent: true })
      const data = res.data?.data
      if (data) {
        const next = { ...get().settings, ...data }
        set({ settings: next, loaded: true })
        applyMeta(next)
        return
      }
    } catch {
      // best-effort：后端未提供设置接口时静默回退默认配置
    }
    set({ loaded: true })
  },

  hydrate: async () => {
    await get().fetchSettings()
    applyThemeDefaults(get().settings)
  },
}))
