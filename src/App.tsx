import { XcmsThemeProvider } from '@/lib/theme'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <XcmsThemeProvider>
      <AppRouter />
    </XcmsThemeProvider>
  )
}
