import { type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * 外观（亮/暗/跟随系统）由 next-themes 管理；
 * 主色调（brand）改由 useThemeStore（zustand）管理，见 src/store/themeStore.ts。
 */
export function XcmsThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="xcms-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
