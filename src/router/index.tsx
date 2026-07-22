import { BrowserRouter, useRoutes } from 'react-router-dom'
import { routes } from './routes'
import type { RouteObject } from 'react-router-dom'

/** 应用路由根：包 BrowserRouter，按 routes 表渲染（useRoutes 配置式写法） */
function AppRoutes() {
  return useRoutes(routes as RouteObject[])
}

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  )
}
