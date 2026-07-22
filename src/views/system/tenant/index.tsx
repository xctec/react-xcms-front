import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, TableToolbar, Pagination, StatusBadge, Tag, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
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
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
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

const KIND_OPTIONS = [
  { label: '平台租户', value: 'PLATFORM' },
  { label: '普通租户', value: 'NORMAL' },
]

export function Tenant() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const { list, loading } = usePaged<TenantDto>(
    () =>
      apiClient.POST('/api/tenant/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      } as any),
    [page, pageSize, keyword, reloadKey],
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
  const clearSelection = () => setSelected(new Set())

  // —— 增删改 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TenantRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<TenantRow | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fields: CrudField[] = [
    { name: 'name', label: '租户名称', type: 'text', required: true, placeholder: '请输入租户名称', colSpan: 1 },
    { name: 'code', label: '租户编码', type: 'text', required: true, placeholder: '如 acme', colSpan: 1 },
    { name: 'tenantType', label: '类型', type: 'select', options: KIND_OPTIONS, colSpan: 1 },
    { name: 'tenantStatus', label: '启用', type: 'switch', colSpan: 1 },
    { name: 'nodeDesc', label: '备注', type: 'textarea', placeholder: '租户说明', colSpan: 2 },
  ]
  const dialogInitial = editing
    ? {
        name: editing.name,
        code: editing.code,
        tenantType: editing.kind === 'platform' ? 'PLATFORM' : 'NORMAL',
        tenantStatus: editing.status === 'active' ? '0' : '1',
        nodeDesc: '',
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: TenantRow) => { setEditing(row); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { ...editing, ...values } : values
      const res = await call(apiClient.POST(editing ? '/api/tenant/edit' : '/api/tenant/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新建租户')
      setDialogOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setSubmitting(false)
    }
  }
  const handleDelete = async () => {
    if (!deleting) return
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/tenant/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除租户')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleBatchDelete = async () => {
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/tenant/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 个租户`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => { setKeyword(''); setKind('all'); setStatus('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="租户管理"
        description="管理平台级租户及其独立数据空间，支持模板复制创建"
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info('演示环境，从模板复制暂未开放')}><Copy className="h-4 w-4" />从模板复制</Button>
            <Button onClick={openCreate}><Plus className="h-4 w-4" />新建租户</Button>
          </>
        }
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
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

      <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
        <Button size="sm" variant="outline" onClick={() => toast.info('演示环境，批量启用暂未开放')}>批量启用</Button>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个租户</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
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
                          <DropdownMenuItem onClick={() => toast.info('演示环境，成员管理暂未开放')}><Users className="h-4 w-4" />成员管理</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('演示环境，复制暂未开放')}><Copy className="h-4 w-4" />复制为新租户</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(row)}><Trash2 className="h-4 w-4" />删除</DropdownMenuItem>
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

      <CrudDialog
        open={dialogOpen}
        title={editing ? '编辑租户' : '新建租户'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除租户"
        description={`确定要删除租户「${deleting?.name}」吗？其下数据空间将一并移除。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除租户"
        description={`确定要删除选中的 ${selected.size} 个租户吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />
    </div>
  )
}

export default Tenant
