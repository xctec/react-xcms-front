import { type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useSystemStore } from '@/store/systemStore'

/**
 * 外观（亮/暗/跟随系统）由 next-themes 管理；
 * 主色调（brand）改由 useThemeStore（zustand）管理，见 src/store/themeStore.ts。
 * 默认外观模式优先取系统设置 store 的 defaultMode（仅影响首次访问、本地无选择时）。
 */
export function XcmsThemeProvider({ children }: { children: ReactNode }) {
  const defaultMode = useSystemStore.getState().settings.defaultMode
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultMode}
      enableSystem
      storageKey="xcms-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
