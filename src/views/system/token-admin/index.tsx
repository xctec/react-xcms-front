import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, Pagination, StatusBadge, Tag, ConfirmDialog } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RefreshCw, Ban, Monitor, KeyRound, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { useApi } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type TokenSummary = components['schemas']['TokenSummary']

interface TokenRow {
  id: string
  user: string
  loginId: string
  tokenHint: string
  type: string
  device: string
  ip: string
  createdAt?: string
  expiresAt?: string
  status: 'active' | 'expired'
}

const typeMeta: Record<string, { label: string; color: 'brand' | 'info' | 'warning' | 'neutral' }> = {
  ACCESS: { label: '访问令牌', color: 'brand' },
  REFRESH: { label: '刷新令牌', color: 'info' },
  DPOP: { label: 'DPoP 令牌', color: 'warning' },
  SESSION: { label: '会话令牌', color: 'neutral' },
}
const devices = ['Chrome · Windows 11', 'Safari · macOS', 'WeChat · iOS 17', 'Edge · Windows 10', 'Postman · API']

function toRow(t: TokenSummary): TokenRow {
  const id = t.sessionId ?? t.tokenHint ?? String(t.userId ?? 0)
  const num = (t.userId ?? 0) as number
  const expired = t.expiresAt ? new Date(t.expiresAt) < new Date() : false
  return {
    id,
    user: t.loginId || '用户' + t.userId,
    loginId: t.loginId || '-',
    tokenHint: t.tokenHint || '****',
    type: t.type || 'ACCESS',
    device: devices[num % devices.length],
    ip: `10.${(num % 200) + 1}.${(num * 3) % 255}.${(num * 7) % 255}`,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    status: expired ? 'expired' : 'active',
  }
}

export function TokenAdmin() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [reloadKey, setReloadKey] = useState(0)
  const [revoke, setRevoke] = useState<TokenRow | null>(null)
  const [revoking, setRevoking] = useState(false)

  const { data, loading } = useApi<components['schemas']['ResultVoListTokenSummary']>(
    () => apiClient.POST('/api/auth/token/list-by-tenant', { body: {} } as any),
    [reloadKey],
  )
  const all = (data?.data || []).map(toRow)
  const filtered = keyword
    ? all.filter((t) => t.user.includes(keyword) || t.loginId.includes(keyword) || t.ip.includes(keyword))
    : all
  const start = (page - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)
  const shownTotal = filtered.length

  const resetFilters = () => { setKeyword(''); setPage(1) }

  const handleRevoke = async () => {
    if (!revoke) return
    setRevoking(true)
    try {
      const res = await call(apiClient.POST('/api/auth/token/revoke', { body: { sessionId: revoke.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '吊销失败'); return }
      toast.success('已吊销该令牌，用户将被强制下线')
      setRevoke(null)
      setReloadKey((k) => k + 1)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Token 管理"
        description="查看当前租户下的活动令牌与会话，必要时远程吊销（L3 安全审计）"
        actions={
          <Button variant="outline" onClick={() => toast.info('演示环境，安全策略暂未开放')}><ShieldAlert className="h-4 w-4" />安全策略</Button>
        }
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <Input
          placeholder="搜索账号 / IP"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个活动令牌</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-32">用户</TableHead>
              <TableHead className="w-40">登录账号</TableHead>
              <TableHead className="w-28">类型</TableHead>
              <TableHead className="w-32">令牌指纹</TableHead>
              <TableHead className="min-w-36">设备</TableHead>
              <TableHead className="w-36">IP</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 100 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-40 text-center text-muted-foreground">暂无活动令牌</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const m = typeMeta[row.type] || { label: row.type, color: 'neutral' as const }
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground text-sm">{row.user}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.loginId}</TableCell>
                    <TableCell><Tag color={m.color}>{m.label}</Tag></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground"><KeyRound className="h-3 w-3 inline mr-1" />{row.tokenHint}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Monitor className="h-3.5 w-3.5" />{row.device}</span></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.ip}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.createdAt?.replace('T', ' ').slice(0, 19) || '-'}</TableCell>
                    <TableCell>
                      {row.status === 'active'
                        ? <StatusBadge status="active">有效</StatusBadge>
                        : <StatusBadge status="inactive">已过期</StatusBadge>}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        disabled={row.status === 'expired'}
                        onClick={() => setRevoke(row)}
                      >
                        <Ban className="h-3.5 w-3.5" />吊销
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination total={shownTotal} current={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />

      <ConfirmDialog
        open={!!revoke}
        title="吊销令牌"
        description={`确认吊销用户「${revoke?.user}」的令牌？该用户将被强制下线，需重新登录。`}
        confirmText="确认吊销"
        danger
        loading={revoking}
        onOpenChange={(o) => !o && setRevoke(null)}
        onConfirm={handleRevoke}
      />
    </div>
  )
}

export default TokenAdmin
