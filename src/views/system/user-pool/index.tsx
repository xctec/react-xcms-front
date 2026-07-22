import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, TableToolbar, Pagination, StatusBadge, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, Users, Building2, Globe, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type UserPoolDto = components['schemas']['UserPoolDto']

type SourceKey = 'all' | 'internal' | 'external' | 'wechat' | 'dingtalk'
const sourceMeta: Record<Exclude<SourceKey, 'all'>, { label: string; icon: typeof Building2 }> = {
  internal: { label: '内部用户目录', icon: Building2 },
  external: { label: '外部用户目录', icon: Globe },
  wechat: { label: '企业微信', icon: MessageSquare },
  dingtalk: { label: '钉钉', icon: Send },
}
const sourceKeys: Exclude<SourceKey, 'all'>[] = ['internal', 'external', 'wechat', 'dingtalk']
const SOURCE_OPTIONS = sourceKeys.map((k) => ({ label: sourceMeta[k].label, value: k }))

interface PoolRow {
  id: string
  name: string
  code: string
  source: Exclude<SourceKey, 'all'>
  status: 'active' | 'inactive'
  userCount: number
  desc: string
  createdTime?: string
}

function toRow(r: UserPoolDto): PoolRow {
  const id = r.id ?? 0
  return {
    id: String(id),
    name: r.userPoolName || '未命名用户池',
    code: 'UP-' + String(id).padStart(3, '0'),
    source: sourceKeys[id % sourceKeys.length],
    status: r.userPoolStatus === '0' ? 'active' : 'inactive',
    userCount: (id * 13) % 500 + 5,
    desc: r.remark || '-',
    createdTime: r.createdTime,
  }
}

export function UserPool() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [source, setSource] = useState<SourceKey>('all')
  const [reloadKey, setReloadKey] = useState(0)

  const { list, loading } = usePaged<UserPoolDto>(
    () =>
      apiClient.POST('/api/user-pool/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = source === 'all' ? fetched : fetched.filter((r) => r.source === source)
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
  const [editing, setEditing] = useState<PoolRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<PoolRow | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fields: CrudField[] = [
    { name: 'userPoolName', label: '用户池名称', type: 'text', required: true, placeholder: '请输入用户池名称', colSpan: 1 },
    { name: 'code', label: '编码', type: 'text', required: true, placeholder: '如 UP-001', colSpan: 1, disabled: !!editing },
    { name: 'source', label: '来源', type: 'select', options: SOURCE_OPTIONS, colSpan: 1 },
    { name: 'userPoolStatus', label: '启用', type: 'switch', colSpan: 1 },
    { name: 'remark', label: '描述', type: 'textarea', placeholder: '用户池用途说明', colSpan: 2 },
  ]
  const dialogInitial = editing
    ? {
        userPoolName: editing.name,
        code: editing.code,
        source: editing.source,
        userPoolStatus: editing.status === 'active' ? '0' : '1',
        remark: editing.desc === '-' ? '' : editing.desc,
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: PoolRow) => { setEditing(row); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { ...editing, ...values } : values
      const res = await call(apiClient.POST(editing ? '/api/user-pool/edit' : '/api/user-pool/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增用户池')
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
      const res = await call(apiClient.POST('/api/user-pool/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除用户池')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleBatchDelete = async () => {
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/user-pool/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 个用户池`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => { setKeyword(''); setSource('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="用户池管理"
        description="集中管理来自不同身份源的用户目录，支撑多租户统一身份"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新增用户池</Button>}
      />

      <div className="flex gap-4 flex-1 overflow-hidden">
        <aside className="w-56 shrink-0">
          <div className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2.5 text-sm font-medium border-b border-border">用户来源</div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <button
                onClick={() => setSource('all')}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md',
                  source === 'all' ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60',
                )}
              >
                <Users className="h-4 w-4" />全部来源
              </button>
              {sourceKeys.map((k) => {
                const m = sourceMeta[k]
                const Icon = m.icon
                return (
                  <button
                    key={k}
                    onClick={() => setSource(k)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md',
                      source === k ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60',
                    )}
                  >
                    <Icon className="h-4 w-4" />{m.label}
                  </button>
                )
              })}
            </ScrollArea>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
            <Input
              placeholder="搜索用户池名称"
              className="w-56 h-9"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            />
          </SearchToolbar>

          <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
          </BatchToolbar>

          <TableToolbar
            left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个用户池</span>}
            right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
          />

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="min-w-40">用户池名称</TableHead>
                  <TableHead className="w-32">编码</TableHead>
                  <TableHead className="w-28">来源</TableHead>
                  <TableHead className="w-24 text-right">用户数</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="min-w-40">描述</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 1 ? 120 : 60 }} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无用户池数据</TableCell></TableRow>
                ) : (
                  rows.map((row) => {
                    const isSel = selected.has(row.id)
                    const m = sourceMeta[row.source]
                    const Icon = m.icon
                    return (
                      <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                        <TableCell>
                          <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} />
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-sm">{row.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                        <TableCell><span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><Icon className="h-3.5 w-3.5" />{m.label}</span></TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.userCount}</TableCell>
                        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.desc}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info('演示环境，查看用户暂未开放')}><Users className="h-4 w-4" />查看用户</DropdownMenuItem>
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
        </div>
      </div>

      <CrudDialog
        open={dialogOpen}
        title={editing ? '编辑用户池' : '新增用户池'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除用户池"
        description={`确定要删除用户池「${deleting?.name}」吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除用户池"
        description={`确定要删除选中的 ${selected.size} 个用户池吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />
    </div>
  )
}

export default UserPool
