import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/xcms'
import { Card } from '@/components/ui/card'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/xcms'
import { cn } from '@/lib/utils'
import {
  Users, ShieldCheck, Menu as MenuIcon, LogIn, TrendingUp, TrendingDown,
  ArrowUpRight, Activity, Zap, Plus, Network, BookText, Building2,
  type LucideIcon,
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface StatCardProps {
  title: string
  value: string
  trend: number
  icon: LucideIcon
}

function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
  const up = trend >= 0
  return (
    <Card className="p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {up ? (
          <TrendingUp className="h-3.5 w-3.5 text-success" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
        )}
        <span className={cn('font-medium', up ? 'text-success' : 'text-destructive')}>
          {Math.abs(trend)}%
        </span>
        <span className="text-muted-foreground">较上周</span>
      </div>
    </Card>
  )
}

const trendData = [
  { day: '周一', logins: 240, ops: 88 },
  { day: '周二', logins: 312, ops: 102 },
  { day: '周三', logins: 289, ops: 95 },
  { day: '周四', logins: 380, ops: 134 },
  { day: '周五', logins: 425, ops: 156 },
  { day: '周六', logins: 178, ops: 52 },
  { day: '周日', logins: 152, ops: 41 },
]

const activities = [
  { user: '张明', action: '登录系统', target: '', time: '2 分钟前', type: 'login' as const },
  { user: '李娜', action: '更新了菜单', target: '系统管理 / 角色管理', time: '15 分钟前', type: 'edit' as const },
  { user: '王强', action: '创建了角色', target: '财务审核员', time: '1 小时前', type: 'create' as const },
  { user: '赵敏', action: '删除了用户', target: 'test_user_002', time: '2 小时前', type: 'delete' as const },
  { user: '陈晨', action: '修改了字典', target: 'status / 启用', time: '3 小时前', type: 'edit' as const },
  { user: '刘洋', action: '登录系统', target: '', time: '5 小时前', type: 'login' as const },
]

const shortcuts: { label: string; icon: LucideIcon; path: string; desc: string }[] = [
  { label: '新增成员', icon: Plus, path: '/tenant-user', desc: '添加租户账户' },
  { label: '菜单管理', icon: MenuIcon, path: '/menu', desc: '配置导航菜单' },
  { label: '组织机构', icon: Network, path: '/org-unit', desc: '维护组织树' },
  { label: '字典维护', icon: BookText, path: '/dict-type', desc: '管理数据字典' },
  { label: '登录日志', icon: LogIn, path: '/login-log', desc: '查看登录记录' },
  { label: '角色授权', icon: ShieldCheck, path: '/role', desc: '配置角色权限' },
]

// 快速开始：首次配置的引导式入口（与页面下方“快捷入口”区分，这里强调“从零搭建”）
const quickStart: { label: string; desc: string; icon: LucideIcon; path: string }[] = [
  { label: '创建租户', desc: '新建租户空间', icon: Building2, path: '/tenant' },
  { label: '配置组织机构', desc: '维护组织树', icon: Network, path: '/org-unit' },
  { label: '创建角色并授权', desc: '定义角色与权限', icon: ShieldCheck, path: '/role' },
  { label: '添加租户成员', desc: '邀请用户加入', icon: Users, path: '/tenant-user' },
  { label: '配置菜单', desc: '定义导航菜单', icon: MenuIcon, path: '/menu' },
  { label: '维护数据字典', desc: '管理字典类型', icon: BookText, path: '/dict-type' },
]

export function Dashboard() {
  const navigate = useNavigate()
  const [quickOpen, setQuickOpen] = useState(false)
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="工作台"
        description="欢迎使用 XCMS 中台骨架 · 多租户权限与基础数据管理平台"
        actions={
          <Popover open={quickOpen} onOpenChange={setQuickOpen}>
            <PopoverTrigger asChild>
              <Button>
                <Zap className="h-4 w-4" />
                快速开始
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-3">
              <div className="mb-3">
                <p className="text-sm font-semibold text-foreground">快速开始</p>
                <p className="mt-0.5 text-xs text-muted-foreground">跟随引导完成首次配置</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickStart.map((s) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.path}
                      type="button"
                      onClick={() => {
                        setQuickOpen(false)
                        navigate(s.path)
                      }}
                      className="flex flex-col items-start gap-1.5 rounded-lg border border-border p-2.5 text-left transition-colors hover:border-brand-500/30 hover:bg-brand-500/5"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="text-xs font-medium text-foreground">{s.label}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground">{s.desc}</div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
                打开命令面板快速跳转
              </div>
            </PopoverContent>
          </Popover>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 统计卡 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="租户成员" value="1,284" trend={12.5} icon={Users} />
          <StatCard title="角色总数" value="36" trend={5.2} icon={ShieldCheck} />
          <StatCard title="菜单项" value="148" trend={-2.1} icon={MenuIcon} />
          <StatCard title="今日登录" value="425" trend={18.3} icon={LogIn} />
        </div>

        {/* 趋势图 + 快捷入口 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 登录趋势 */}
          <Card className="lg:col-span-2 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">登录与操作趋势</h3>
                <p className="text-xs text-muted-foreground mt-0.5">最近 7 天</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  登录
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  操作
                </span>
              </div>
            </div>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--brand-500))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--brand-500))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="opGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stroke="hsl(var(--brand-500))"
                    strokeWidth={2}
                    fill="url(#loginGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ops"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fill="url(#opGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 快捷入口 */}
          <Card className="p-5 shadow-xs">
            <h3 className="text-base font-semibold text-foreground mb-4">快捷入口</h3>
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.label}
                    onClick={() => navigate(s.path)}
                    className="group flex flex-col items-start gap-2 p-3 rounded-lg border border-border hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-brand-500/10 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* 活动流 + 系统状态 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 活动流 */}
          <Card className="lg:col-span-2 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">最近活动</h3>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                查看全部
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {activities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {a.user.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium text-foreground">{a.user}</span>
                    <span className="text-muted-foreground"> {a.action}</span>
                    {a.target && (
                      <span className="text-brand-600 dark:text-brand-400 font-medium"> {a.target}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* 系统状态 */}
          <Card className="p-5 shadow-xs">
            <h3 className="text-base font-semibold text-foreground mb-4">系统状态</h3>
            <div className="space-y-3">
              {[
                { label: '认证服务', status: 'active' as const, text: '运行中' },
                { label: '权限引擎', status: 'active' as const, text: '运行中' },
                { label: '数据范围', status: 'active' as const, text: '运行中' },
                { label: '令牌存储', status: 'info' as const, text: '内存模式' },
                { label: '缓存服务', status: 'pending' as const, text: 'Redis 未连接' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{s.label}</span>
                  </div>
                  <StatusBadge status={s.status}>{s.text}</StatusBadge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">XCMS Framework</span>
                <span className="font-mono text-foreground">v1.0.0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
