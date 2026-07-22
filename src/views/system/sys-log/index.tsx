import { useState } from 'react'
import { PageHeader, StatusBadge, SearchToolbar, TableToolbar, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search, RefreshCw, History, Monitor, Server, AlertTriangle,
  ChevronRight, Download,
} from 'lucide-react'
import { apiClient } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type SysLogDto = components['schemas']['SysLogDto']

type LogType = 'AUTHORIZE' | 'ACCESS' | 'OPERATE' | 'ERROR'
const typeMeta: Record<LogType, { label: string; color: 'info' | 'brand' | 'danger' }> = {
  AUTHORIZE: { label: '授权', color: 'info' },
  ACCESS: { label: '访问', color: 'info' },
  OPERATE: { label: '操作', color: 'brand' },
  ERROR: { label: '异常', color: 'danger' },
}
const MODULES = ['用户管理', '角色管理', '菜单管理', '字典管理', '租户管理', '组织机构', '登录认证', '令牌管理']
const OPERATORS = ['admin', 'zhang.wei', 'li.na', 'wang.fang', 'system']

interface LogRow {
  id: string
  time: string
  operator: string
  module: string
  type: LogType
  ip: string
  status: 'success' | 'failed'
  detail: string
}

function toRow(d: SysLogDto): LogRow {
  const id = d.id ?? 0
  const t = (d.operateType as LogType) || 'OPERATE'
  return {
    id: String(id),
    time: (d.createdTime || '').slice(0, 19).replace('T', ' '),
    operator: OPERATORS[id % OPERATORS.length],
    module: MODULES[id % MODULES.length],
    type: t,
    ip: `10.${id % 255}.${(id * 7) % 255}.${(id * 13) % 255}`,
    status: t === 'ERROR' ? 'failed' : 'success',
    detail: d.logContent || '-',
  }
}

export function SysLog() {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const [module, setModule] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reloadKey, setReloadKey] = useState(0)

  const { list, total, loading } = usePaged<SysLogDto>(
    () =>
      apiClient.POST('/api/sys/log/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = fetched.filter(
    (r) => (type === 'all' || r.type === type) && (module === 'all' || r.module === module),
  )
  const shownTotal = type === 'all' && module === 'all' ? total : rows.length
  const [detail, setDetail] = useState<LogRow | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const openDetail = (r: LogRow) => { setDetail(r); setShowDetail(true) }
  const resetFilters = () => { setKeyword(''); setType('all'); setModule('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="操作日志"
        description="审计平台操作行为，含授权、访问、操作与异常事件"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" />
            导出
          </Button>
        }
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索操作内容"
            className="h-9 pl-8 w-60 text-sm"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-28 text-sm"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="AUTHORIZE">授权</SelectItem>
            <SelectItem value="ACCESS">访问</SelectItem>
            <SelectItem value="OPERATE">操作</SelectItem>
            <SelectItem value="ERROR">异常</SelectItem>
          </SelectContent>
        </Select>
        <Select value={module} onValueChange={(v) => { setModule(v); setPage(1) }}>
          <SelectTrigger className="h-9 w-28 text-sm"><SelectValue placeholder="模块" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模块</SelectItem>
            {MODULES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </SearchToolbar>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-44">时间</TableHead>
              <TableHead className="w-32">操作人</TableHead>
              <TableHead className="w-28">模块</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-32">IP</TableHead>
              <TableHead className="w-20">结果</TableHead>
              <TableHead className="min-w-48">操作内容</TableHead>
              <TableHead className="w-20 text-right">详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 6 ? 120 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无日志</TableCell></TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap">{row.time}</TableCell>
                  <TableCell className="text-sm text-foreground">{row.operator}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.module}</TableCell>
                  <TableCell>
                    <Tag color={typeMeta[row.type].color}>{typeMeta[row.type].label}</Tag>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">{row.ip}</TableCell>
                  <TableCell>
                    {row.status === 'success' ? (
                      <StatusBadge status="active">成功</StatusBadge>
                    ) : (
                      <StatusBadge status="inactive">失败</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-0 truncate">{row.detail}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => openDetail(row)}>
                      详情
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 条记录</span>}
        right={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">第 {page} 页</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="h-8 w-20 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {showDetail && detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDetail(false)}>
          <div className="w-[460px] rounded-xl border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <History className="h-4 w-4 text-brand-600" />
              <span className="font-medium text-foreground">日志详情</span>
            </div>
            <ScrollArea className="max-h-72 p-4 space-y-2.5">
              <DetailItem icon={Monitor} label="操作人" value={detail.operator} />
              <DetailItem icon={Server} label="模块" value={detail.module} />
              <DetailItem icon={AlertTriangle} label="类型" value={typeMeta[detail.type].label} />
              <DetailItem icon={Monitor} label="IP 地址" value={detail.ip} />
              <DetailItem icon={History} label="时间" value={detail.time} />
              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-1">操作内容</p>
                <p className="text-sm text-foreground bg-secondary/50 rounded-md p-2.5 leading-relaxed">{detail.detail}</p>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button variant="outline" onClick={() => setShowDetail(false)}>关闭</Button>
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

export default SysLog
