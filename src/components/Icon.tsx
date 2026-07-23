import { Suspense } from 'react'
import type { LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'

interface LazyIconProps {
  icon: LazyExoticComponent<LucideIcon>
  className?: string
}

/**
 * 渲染「按需懒加载图标」（来自 src/router/menu 的 resolveIcon）。
 * 每个图标独立包裹 <Suspense>：图标分片尚未加载完成时，显示一个同尺寸的占位，
 * 避免整块菜单因单个图标挂起而整体空白。
 */
export function LazyIcon({ icon: Icon, className }: LazyIconProps) {
  return (
    <Suspense
      fallback={<span className={['inline-block', className].filter(Boolean).join(' ')} />}
    >
      <Icon className={className} />
    </Suspense>
  )
}
