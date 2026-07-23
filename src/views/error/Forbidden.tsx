import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

/** 403 禁止访问 专用页（已登录但权限不足） */
export function Forbidden() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold tracking-tight text-foreground">403</p>
        <h1 className="text-xl font-semibold text-foreground">没有访问权限</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          你已登录，但当前账号无权访问该资源。如需开通权限，请联系管理员或使用具备相应权限的账号。
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)} className="px-6">
          返回上一页
        </Button>
        <Button onClick={() => navigate('/')} className="px-6">
          返回首页
        </Button>
      </div>
    </div>
  )
}
