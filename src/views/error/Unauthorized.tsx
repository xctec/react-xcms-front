import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { clearTokens } from '@/utils/request'

/** 401 未授权 / 登录过期 专用页 */
export function Unauthorized() {
  const navigate = useNavigate()
  const handleLogin = () => {
    clearTokens()
    navigate('/login', { replace: true })
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-bold tracking-tight text-foreground">401</p>
        <h1 className="text-xl font-semibold text-foreground">登录已过期或尚未登录</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          当前会话已失效，请重新登录后继续访问。如确认已登录仍看到此页面，请联系管理员。
        </p>
      </div>
      <Button onClick={handleLogin} className="px-6">
        重新登录
      </Button>
    </div>
  )
}
