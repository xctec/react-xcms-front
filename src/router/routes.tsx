import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'

const LoginLazy = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))

/**
 * 顶层路由表（编译期静态部分）。
 * - /login       登录页（无侧栏/顶栏），按需懒加载
 * - *            已登录主框架（src/layouts/AppLayout）
 *
 * 注：菜单驱动的页面路由在 AppLayout 内根据 /api/frame/menu 运行时生成，
 * 因此不在此静态表中写死。
 */
export const routes: RouteObject[] = [
  {
    path: '/login',
    element: (
      <Suspense
        fallback={
          <div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm">加载中…</span>
          </div>
        }
      >
        <LoginLazy />
      </Suspense>
    ),
  },
  { path: '*', element: <AppLayout /> },
]
