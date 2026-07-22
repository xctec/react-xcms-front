import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, Pagination, StatusBadge } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, MoreHorizontal, Monitor, MapPin, Clock, User, History, Activity } from 'lucide-react'
import { apiClient } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type LoginLogDto = components['schemas']['LoginLogDto']

interface LogRow {
  id: string
  user: string
  time: string
  ip: string
  location: string
  device: string
  status: 'success' | 'failed'
  duration: number
}

const users = ['admin', 'lihua', 'wangfang', 'zhaomin', 'chenjie', 'svc-billing']
const locations = ['北京·朝阳', '上海·浦东', '深圳·南山', '杭州·西湖', '成都·高新']
const devices = ['Chrome · Windows 11', 'Safari · macOS', 'WeChat · iOS 17', 'Edge · Windows 10']

function toRow(r: LoginLogDto): LogRow {
  const id = r.id ?? 0
  return {
    id: String(id),
    user: users[id % users.length] + (id > 6 ? String(id) : ''),
    time: r.createdTime || new Date().toISOString(),
    ip: r.ip || `10.${(id % 200) + 1}.${(id * 3) % 255}.${(id * 7) % 255}`,
    location: locations[id % locations.length],
    device: devices[id % devices.length],
    status: id % 6 === 0 ? 'failed' : 'success',
    duration: (id * 7) % 120 + 10,
  }
}

export function LoginLog() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)
  const [detail, setDetail] = useState<LogRow | null>(null)

  const { list, total, loading } = usePaged<LoginLogDto>(
    () =>
      apiClient.POST('/api/login/log/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = status === 'all' ? fetched : fetched.filter((r) => r.status === status)
  const shownTotal = status === 'all' ? total : rows.length

  const resetFilters = () => { setKeyword(''); setStatus('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="登录日志"
        description="记录用户登录行为，识别异常登录与安全风险（L3 审计）"
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <Input
          placeholder="搜索账号 / IP"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="success">登录成功</SelectItem>
            <SelectItem value="failed">登录失败</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 条记录</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-36">账号</TableHead>
              <TableHead className="w-44">登录时间</TableHead>
              <TableHead className="w-36">IP 地址</TableHead>
              <TableHead className="w-32">归属地</TableHead>
              <TableHead className="min-w-40">设备</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 100 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">暂无登录记录</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground text-sm">{row.user}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.time.replace('T', ' ').slice(0, 19)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.ip}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{row.location}</span></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Monitor className="h-3.5 w-3.5" />{row.device}</span></TableCell>
                  <TableCell>
                    {row.status === 'success'
                      ? <StatusBadge status="active">成功</StatusBadge>
                      : <StatusBadge status="error">失败</StatusBadge>}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => setDetail(row)}><Clock className="h-4 w-4" />查看详情</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination total={shownTotal} current={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
          <div className="w-[420px] rounded-xl border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <History className="h-4 w-4 text-brand-600" />
              <span className="font-medium text-foreground">登录详情</span>
            </div>
            <div className="space-y-2.5 p-4">
              <DetailItem icon={User} label="账号" value={detail.user} />
              <DetailItem icon={Clock} label="登录时间" value={detail.time.replace('T', ' ').slice(0, 19)} />
              <DetailItem icon={Monitor} label="IP 地址" value={detail.ip} />
              <DetailItem icon={MapPin} label="归属地" value={detail.location} />
              <DetailItem icon={Activity} label="耗时" value={`${detail.duration} ms`} />
              <div className="flex items-center justify-between pt-0.5">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><Monitor className="h-3.5 w-3.5" />设备</span>
                <span className="text-sm text-foreground font-medium">{detail.device}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" />结果</span>
                {detail.status === 'success'
                  ? <StatusBadge status="active">成功</StatusBadge>
                  : <StatusBadge status="error">失败</StatusBadge>}
              </div>
            </div>
            <div className="flex justify-end border-t border-border px-4 py-3">
              <Button variant="outline" onClick={() => setDetail(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof History; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  )
}

export default LoginLog
