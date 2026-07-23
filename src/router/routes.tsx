import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { RouteObject } from 'react-router-dom'
import { NotFound } from '@/views/error/NotFound'
import { Unauthorized } from '@/views/error/Unauthorized'
import { Forbidden } from '@/views/error/Forbidden'

const LoginLazy = lazy(() => import('@/views/login').then((m) => ({ default: m.Login })))
// 已登录主框架：按需懒加载，避免把侧栏/顶栏（及其依赖的 Radix UI、cmdk、sonner 等）
// 打进「登录页首屏」主包。登录后再进入应用才加载此 chunk。
const AppLayoutLazy = lazy(() => import('@/layouts/AppLayout').then((m) => ({ default: m.AppLayout })))

/** 路由级懒加载占位（登录 / 主框架分片未就绪时） */
function RouteFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm">加载中…</span>
    </div>
  )
}

/**
 * 顶层路由表（编译期静态部分）。
 * - /login    登录页（无侧栏/顶栏），按需懒加载
 * - '*'       其余所有路径交给 AppLayout（已登录主框架）。
 *
 * AppLayout 内部再通过 useRoutes 按「动态菜单」生成内容路由，并以绝对
 * 路径直接匹配当前 location，因此不会再被父路由（'*'）片段拼接，菜单页
 * 才能正确访问。'*' 作为父路径可让内部 useRoutes 任意深度匹配而不丢失。
 */
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LoginLazy />
      </Suspense>
    ),
  },
  // 状态页：全屏渲染，不套用主框架布局
  { path: '/401', element: <Unauthorized /> },
  { path: '/403', element: <Forbidden /> },
  { path: '/404', element: <NotFound /> },
  // 已登录主框架：懒加载，首屏（登录页）不必下载其依赖
  { path: '*', element: <Suspense fallback={<RouteFallback />}><AppLayoutLazy /></Suspense> },
]
