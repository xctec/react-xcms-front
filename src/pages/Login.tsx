import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Boxes, User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Layers,
  Building2, KeyRound, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { apiClient, setTokens } from '@/utils/request'

export function Login() {
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      // axios 封装统一返回 { data, error, response }：HTTP 非 2xx 时响应体在 error 中，
      // 2xx 时响应体在 data 中（即后端 ResultVo）。
      const res = await apiClient.POST<{
        errorNo?: string
        errorMsg?: string
        data?: { accessToken?: string; refreshToken?: string }
      }>('/api/auth/login', {
        body: { loginId: username, credential: password, type: 'password', tenantId: 1 },
        silent: true,
      })
      // HTTP 层错误（非 2xx）
      if (res.error) {
        const errBody = res.error as { errorMsg?: string } | string
        const msg =
          typeof errBody === 'string' ? errBody : (errBody?.errorMsg || '登录失败，请检查用户名或密码')
        setError(msg)
        setLoading(false)
        return
      }
      // 业务层错误（HTTP 200 但 errorNo 非 '0'）
      const body = res.data as
        | { errorNo?: string; errorMsg?: string; data?: { accessToken?: string; refreshToken?: string } }
        | undefined
      if (body && body.errorNo != null && body.errorNo !== '0') {
        setError(body.errorMsg || '登录失败')
        setLoading(false)
        return
      }
      const d = body?.data
      if (d?.accessToken) setTokens(d.accessToken, d.refreshToken || '')
      setLoading(false)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* 主题切换角标 */}
      <div className="absolute right-4 top-4 z-30">
        <ThemeSwitcher />
      </div>

      <div className="flex min-h-screen">
        {/* 左侧品牌区 */}
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-12 text-white lg:flex">
          {/* 装饰光斑 */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

          {/* 顶栏 logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">XCMS</div>
              <div className="text-xs text-white/70">中台骨架 · 管理控制台</div>
            </div>
          </div>

          {/* 主文案 */}
          <div className="relative max-w-md">
            <h1 className="text-3xl font-semibold leading-snug">
              一套可复用的<br />中台基座，开箱即用地落地
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              共享安全内核 + 可插拔业务子系统。多租户、模板复制、四层权限模型，统一支撑你的业务系统。
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, t: '四层权限模型', d: '认证 / 功能 / 数据 / 平台前缀防护' },
                { icon: Layers, t: '模板复制架构', d: '菜单 · 字典 · 角色三套同构模板' },
                { icon: Building2, t: '多租户隔离', d: '租户独立数据空间，按需复制' },
              ].map((f) => (
                <li key={f.t} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{f.t}</div>
                    <div className="text-xs text-white/65">{f.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 底栏 */}
          <div className="relative text-xs text-white/60">© 2026 XCMS · 中台骨架原型设计</div>
        </div>

        {/* 右侧表单区 */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            {/* 移动端 logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="text-base font-semibold text-foreground">XCMS 中台骨架</div>
            </div>

            <h2 className="text-2xl font-semibold text-foreground">欢迎回来</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">登录管理控制台，继续你的工作</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {/* 用户名 */}
              <div className="space-y-1.5">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 pl-9"
                    placeholder="请输入用户名"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <button type="button" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
                    忘记密码？
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-9 pr-9"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="切换密码可见"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 记住我 */}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                记住我
              </label>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? '登录中…' : '登录'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* 企业身份登录 */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">或使用企业身份登录</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-10" type="button">
                <KeyRound className="h-4 w-4" /> 企业微信
              </Button>
              <Button variant="outline" className="h-10" type="button">
                <Zap className="h-4 w-4" /> 钉钉
              </Button>
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">还没有账号？请联系系统管理员开通</p>
          </div>
        </div>
      </div>
    </div>
  )
}
