import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 提前设置 data-brand，避免主题色闪烁
const brand = localStorage.getItem('xcms-brand') || 'indigo'
document.documentElement.setAttribute('data-brand', brand)

async function bootstrap() {
  // 启用 Mock 时，在渲染前启动 MSW 拦截器
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    })
    console.info('[MSW] mock 已启用，拦截基址：', import.meta.env.VITE_API_BASE)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
