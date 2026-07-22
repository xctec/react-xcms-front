import { create } from 'zustand'
import { DEFAULT_BRAND, type BrandPreset } from '@/theme/brand'

interface ThemeState {
  /** 当前主色调预设 */
  brand: BrandPreset
  /** 切换主色调（同步写入 localStorage 并应用到 document[data-brand]） */
  setBrand: (b: BrandPreset) => void
}

/** 把主色调应用到 <html data-brand>，并持久化到 localStorage（SSR 安全） */
function applyBrand(b: BrandPreset) {
  if (typeof window === 'undefined') return
  document.documentElement.setAttribute('data-brand', b)
  localStorage.setItem('xcms-brand', b)
}

const initialBrand: BrandPreset =
  typeof window !== 'undefined'
    ? ((localStorage.getItem('xcms-brand') as BrandPreset) || DEFAULT_BRAND)
    : DEFAULT_BRAND

// 初始化即把当前主色调应用到 document（保证首屏无闪烁）
applyBrand(initialBrand)

export const useThemeStore = create<ThemeState>((set) => ({
  brand: initialBrand,
  setBrand: (b) => {
    applyBrand(b)
    set({ brand: b })
  },
}))
