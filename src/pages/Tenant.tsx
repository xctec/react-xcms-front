import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, TableToolbar, Pagination, StatusBadge, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, Users, Building2, Copy } from 'lucide-react'
import { apiClient } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type TenantDto = components['schemas']['TenantDto']

interface TenantRow {
  id: string
  name: string
  code: string
  kind: 'platform' | 'normal'
  status: 'active' | 'inactive'
  memberCount: number
  createdAt: string
}

function toRow(t: TenantDto): TenantRow {
  const id = t.id ?? 0
  return {
    id: String(id),
    name: t.name || t.code || '未命名',
    code: t.code || '',
    kind: t.tenantType === 'PLATFORM' ? 'platform' : 'normal',
    status: t.tenantStatus === '0' ? 'active' : 'inactive',
    memberCount: (id * 13) % 400 + 1,
    createdAt: (t.createdTime || '').slice(0, 10),
  }
}

export function Tenant() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')

  const { list, loading } = usePaged<TenantDto>(
    () =>
      apiClient.POST('/api/tenant/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      }),
    [page, pageSize, keyword],
  )

  const fetched = list.map(toRow)
  const rows = fetched.filter(
    (r) =>
      (kind === 'all' || r.kind === kind) &&
      (status === 'all' || r.status === (status === '0' ? 'active' : 'inactive')),
  )
  const shownTotal = rows.length
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="租户管理"
        description="管理平台级租户及其独立数据空间，支持模板复制创建"
        actions={
          <>
            <Button variant="outline"><Copy className="h-4 w-4" />从模板复制</Button>
            <Button><Plus className="h-4 w-4" />新建租户</Button>
          </>
        }
      />

      <SearchToolbar>
        <Input
          placeholder="搜索租户名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={kind} onValueChange={(v) => { setKind(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="platform">平台租户</SelectItem>
            <SelectItem value="normal">普通租户</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">启用</SelectItem>
            <SelectItem value="1">停用</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <BatchToolbar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" variant="outline">批量启用</Button>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个租户</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-48">租户名称</TableHead>
              <TableHead className="w-40">编码</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-24 text-right">成员数</TableHead>
              <TableHead className="w-28">创建时间</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 1 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无租户数据</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isSel = selected.has(row.id)
                return (
                  <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                    <TableCell><Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} /></TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-foreground text-sm">{row.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell>{row.kind === 'platform' ? <Tag color="brand">平台租户</Tag> : <Tag color="neutral">普通租户</Tag>}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.memberCount}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">{row.createdAt}</TableCell>
                    <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem><Users className="h-4 w-4" />成员管理</DropdownMenuItem>
                          <DropdownMenuItem><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                          <DropdownMenuItem><Copy className="h-4 w-4" />复制为新租户</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />删除</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination total={shownTotal} current={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  )
}
