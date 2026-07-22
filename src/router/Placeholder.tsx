import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft, LayoutGrid } from 'lucide-react'

/** 未实现页面的占位（由菜单动态渲染：未绑定组件或外链的菜单项都会落到这里） */
export function Placeholder({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-5">
            <Construction className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{currentPath || '页面'}</h2>
          <p className="text-sm text-muted-foreground mb-1">该页面的高保真设计图暂未实现</p>
          <p className="text-xs text-muted-foreground/70 mb-6 leading-relaxed">
            本设计已覆盖多类典型布局，以及命令面板、暗黑模式、主色切换、菜单授权弹窗
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
              返回工作台
            </Button>
            <Button onClick={() => navigate('/role')}>
              <LayoutGrid className="h-4 w-4" />
              查看角色管理
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
