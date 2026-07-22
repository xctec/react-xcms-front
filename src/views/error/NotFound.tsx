import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

/** 404 页面不存在 专用页 */
export function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold tracking-tight text-foreground">404</p>
        <h1 className="text-xl font-semibold text-foreground">页面不存在</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          你访问的地址不存在或已被移动。请检查链接是否正确，或返回主页继续操作。
        </p>
      </div>
      <Button onClick={() => navigate('/')} className="px-6">
        返回主页
      </Button>
    </div>
  )
}
