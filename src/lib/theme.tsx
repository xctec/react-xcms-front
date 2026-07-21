import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type BrandPreset, DEFAULT_BRAND } from './brand'

interface XcmsThemeContextValue {
  brand: BrandPreset
  setBrand: (b: BrandPreset) => void
}

const XcmsThemeContext = createContext<XcmsThemeContextValue | null>(null)

export function XcmsThemeProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<BrandPreset>(() => {
    if (typeof window === 'undefined') return DEFAULT_BRAND
    return (localStorage.getItem('xcms-brand') as BrandPreset) || DEFAULT_BRAND
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-brand', brand)
    localStorage.setItem('xcms-brand', brand)
  }, [brand])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="xcms-theme"
      disableTransitionOnChange
    >
      <XcmsThemeContext.Provider value={{ brand, setBrand: setBrandState }}>
        {children}
      </XcmsThemeContext.Provider>
    </NextThemesProvider>
  )
}

export function useXcmsTheme() {
  const ctx = useContext(XcmsThemeContext)
  if (!ctx) throw new Error('useXcmsTheme must be used within XcmsThemeProvider')
  return ctx
}
