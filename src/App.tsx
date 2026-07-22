import { XcmsThemeProvider } from '@/theme'
import { AppRouter } from '@/router'

export default function App() {
  return (
    <XcmsThemeProvider>
      <AppRouter />
    </XcmsThemeProvider>
  )
}
