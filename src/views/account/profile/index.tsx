import { useState } from 'react'
import { PageHeader, StatusBadge, Tag } from '@/components/xcms'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Mail, Phone, Building2, Briefcase, Fingerprint, Camera, Check,
  Bell, ShieldCheck, Smartphone, Globe, Activity, KeyRound, LogOut,
  type LucideIcon,
} from 'lucide-react'

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  defaultChecked = false,
}: {
  icon: LucideIcon
  title: string
  desc: string
  defaultChecked?: boolean
}) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  )
}

const activities = [
  { user: 'Admin', action: '更新了个人资料', time: '今天 09:24', type: 'edit' as const },
  { action: '修改了登录密码', time: '昨天 18:02', type: 'security' as const },
  { action: '开启了两步验证', time: '3 天前', type: 'security' as const },
  { action: '登录系统（北京 · Chrome）', time: '5 天前', type: 'login' as const },
  { action: '绑定了企业微信', time: '上周', type: 'edit' as const },
]

export function Profile() {
  const [form, setForm] = useState({
    name: 'Admin',
    username: 'admin',
    email: 'admin@xcms.io',
    phone: '138 0000 0000',
    dept: '平台运营中心',
    title: '超级管理员',
    bio: '负责 XCMS 中台骨架的平台运营与租户治理，关注权限模型与多租户隔离。',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="个人设置"
        description="管理你的基本资料、通知偏好与账号动态"
        actions={<Button onClick={() => toast.success('资料已保存')}><Check className="h-4 w-4" />保存更改</Button>}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 max-w-5xl mx-auto">
          {/* 左：资料卡 */}
          <Card className="p-5 shadow-xs h-fit lg:sticky lg:top-0">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-2 ring-border">
                  <AvatarFallback className="bg-brand-500/15 text-brand-700 dark:text-brand-400 text-xl font-semibold">
                    SA
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-colors"
                  aria-label="更换头像"
                  onClick={() => toast('头像上传功能演示中')}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">Admin</h2>
              <div className="mt-1.5 flex items-center gap-2">
                <Tag color="brand">超级管理员</Tag>
                <StatusBadge status="active">在线</StatusBadge>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <InfoRow icon={Mail} label="邮箱" value={form.email} />
              <InfoRow icon={Phone} label="手机号" value={form.phone} />
              <InfoRow icon={Building2} label="所属部门" value={form.dept} />
              <InfoRow icon={Briefcase} label="职位" value={form.title} />
              <InfoRow icon={Fingerprint} label="工号" value="XC-0001" />
            </div>

            <Separator className="my-4" />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              加入时间：2024-03-12
            </div>
          </Card>

          {/* 右：标签页 */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="basic"><ShieldCheck className="h-4 w-4" />基本信息</TabsTrigger>
              <TabsTrigger value="notify"><Bell className="h-4 w-4" />通知偏好</TabsTrigger>
              <TabsTrigger value="activity"><Activity className="h-4 w-4" />我的动态</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card className="p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground mb-4">基本信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">姓名</Label>
                    <Input id="name" value={form.name} onChange={set('name')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username">用户名</Label>
                    <Input id="username" value={form.username} onChange={set('username')} disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">邮箱</Label>
                    <Input id="email" type="email" value={form.email} onChange={set('email')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">手机号</Label>
                    <Input id="phone" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dept">所属部门</Label>
                    <Input id="dept" value={form.dept} onChange={set('dept')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="title">职位</Label>
                    <Input id="title" value={form.title} onChange={set('title')} />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea id="bio" rows={4} value={form.bio} onChange={set('bio')} />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notify">
              <Card className="p-6 shadow-xs divide-y divide-border">
                <h3 className="text-base font-semibold text-foreground mb-2">通知偏好</h3>
                <ToggleRow icon={Bell} title="系统消息" desc="角色、菜单、字典等变更通知" defaultChecked />
                <ToggleRow icon={Mail} title="邮件通知" desc="重要操作与登录告警发送到邮箱" defaultChecked />
                <ToggleRow icon={Smartphone} title="短信通知" desc="敏感操作二次确认短信" />
                <ToggleRow icon={ShieldCheck} title="登录提醒" desc="新设备登录时推送安全提醒" defaultChecked />
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="p-6 shadow-xs">
                <h3 className="text-base font-semibold text-foreground mb-4">近期动态</h3>
                <div className="space-y-1">
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                        {a.type === 'security' ? <KeyRound className="h-4 w-4" /> : a.type === 'login' ? <LogOut className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 text-sm">
                        <span className="font-medium text-foreground">Admin</span>
                        <span className="text-muted-foreground"> {a.action}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Profile
