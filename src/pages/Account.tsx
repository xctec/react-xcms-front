import { useState } from 'react'
import { PageHeader, StatusBadge, Tag } from '@/components/xcms'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  KeyRound, ShieldCheck, Smartphone, Fingerprint, Monitor, MapPin,
  Clock, LogOut, Link2, Check, AlertTriangle, type LucideIcon,
} from 'lucide-react'

function SectionTitle({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

const bindings: { name: string; icon: LucideIcon; bound: boolean; account?: string }[] = [
  { name: '企业微信', icon: Smartphone, bound: true, account: 'xcms_admin' },
  { name: '微信', icon: Smartphone, bound: false },
  { name: '钉钉', icon: Smartphone, bound: true, account: 'admin@dingtalk' },
  { name: 'GitHub', icon: Fingerprint, bound: false },
]

const sessions: {
  id: string
  device: string
  location: string
  ip: string
  time: string
  current: boolean
}[] = [
  { id: 's1', device: 'Chrome · macOS', location: '北京', ip: '203.0.113.24', time: '当前会话', current: true },
  { id: 's2', device: 'Safari · iPhone', location: '上海', ip: '198.51.100.7', time: '2 小时前', current: false },
  { id: 's3', device: 'Edge · Windows', location: '深圳', ip: '192.0.2.51', time: '昨天', current: false },
]

export function Account() {
  const [twoFA, setTwoFA] = useState(true)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [bindState, setBindState] = useState(bindings)

  const changePwd = () => {
    if (!pwd.current || !pwd.next) return toast.error('请填写完整密码信息')
    if (pwd.next !== pwd.confirm) return toast.error('两次输入的新密码不一致')
    toast.success('登录密码已更新')
    setPwd({ current: '', next: '', confirm: '' })
  }

  const toggleBind = (i: number) => {
    setBindState((arr) =>
      arr.map((b, idx) =>
        idx === i
          ? { ...b, bound: !b.bound, account: !b.bound ? '已绑定账号' : undefined }
          : b,
      ),
    )
    toast(bindState[i].bound ? `${bindState[i].name} 已解绑` : `${bindState[i].name} 绑定成功`)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="账号设置" description="管理登录凭证、两步验证、第三方绑定与登录会话" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 登录密码 */}
          <Card className="p-6 shadow-xs">
            <SectionTitle icon={KeyRound} title="登录密码" desc="定期更换密码以保障账号安全" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cur">当前密码</Label>
                <Input id="cur" type="password" value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">新密码</Label>
                <Input id="new" type="password" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfm">确认新密码</Label>
                <Input id="cfm" type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={changePwd}><Check className="h-4 w-4" />更新密码</Button>
            </div>
          </Card>

          {/* 两步验证 */}
          <Card className="p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">两步验证 (2FA)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">登录时除密码外，需额外验证动态口令</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={twoFA ? 'active' : 'inactive'}>{twoFA ? '已开启' : '已关闭'}</StatusBadge>
                <Switch checked={twoFA} onCheckedChange={(v) => { setTwoFA(v); toast(v ? '两步验证已开启' : '两步验证已关闭') }} />
              </div>
            </div>
          </Card>

          {/* 第三方绑定 */}
          <Card className="p-6 shadow-xs">
            <SectionTitle icon={Link2} title="第三方账号绑定" desc="绑定后可使用对应渠道快捷登录" />
            <div className="divide-y divide-border">
              {bindState.map((b) => {
                const Icon = b.icon
                return (
                  <div key={b.name} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.bound ? b.account : '未绑定'}</p>
                      </div>
                    </div>
                    {b.bound ? (
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toggleBind(bindState.indexOf(b))}>
                        解绑
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toggleBind(bindState.indexOf(b))}>
                        绑定
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* 登录会话 */}
          <Card className="p-6 shadow-xs">
            <SectionTitle icon={Monitor} title="登录会话管理" desc="查看当前账号的活跃会话，可远程吊销" />
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-secondary/50 text-xs text-muted-foreground">
                <span>设备</span>
                <span>地点 / IP</span>
                <span>时间</span>
                <span className="text-right">操作</span>
              </div>
              {sessions.map((s, i) => (
                <div key={s.id}>
                  {i > 0 && <Separator />}
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-center px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate">{s.device}</span>
                      {s.current && <Tag color="success">当前</Tag>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{s.location} · {s.ip}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {s.time}
                    </div>
                    <div className="text-right">
                      {s.current ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => toast.success('已吊销该会话')}>
                          <LogOut className="h-3.5 w-3.5" />吊销
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 危险区 */}
          <Card className="p-6 shadow-xs border-destructive/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">注销账号</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">注销后所有数据将被清除且不可恢复</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => toast.error('演示环境禁止注销账号')}>注销账号</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
