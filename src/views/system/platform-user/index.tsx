import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, TableToolbar, Pagination, StatusBadge, Tag, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'
type UserDto = components['schemas']['UserDto']

interface PUser {
  id: string
  loginId: string
  name: string
  tenant: string
  roles: string[]
  status: 'active' | 'inactive'
}

const toPUser = (u: UserDto): PUser => ({
  id: String(u.id ?? ''),
  loginId: u.loginId ?? '',
  name: u.nickName || u.loginId || '',
  tenant: (u as any).tenant ?? '',
  roles: (u as any).roles ?? [],
  status: (u.userStatus === '0' ? 'active' : 'inactive') as 'active' | 'inactive',
})

const tenantName: Record<string, string> = {
  PLATFORM: '中台中心',
  'EAST-FACTORY': '华东制造工厂',
  'SOUTH-LOGI': '华南物流',
  'WEST-RETAIL': '西部零售',
}

export function PlatformUser() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [tenant, setTenant] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const { list: rawUsers, total, loading } = usePaged<UserDto>(
    () => apiClient.POST('/api/user/page', {
      body: { pageNo: page, pageSize, keyword: keyword || undefined },
    } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const list = rawUsers.map(toPUser)
  const fetched = list.filter((u) => tenant === 'all' || u.tenant === tenant)
  const shownTotal = tenant === 'all' ? total : fetched.length
  const allSelected = fetched.length > 0 && selected.size === fetched.length
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(fetched.map((u) => String(u.id))))
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const clearSelection = () => setSelected(new Set())
  const tenantOptions = Array.from(new Set(list.map((u) => u.tenant).filter(Boolean)))
  const TENANT_OPTIONS = tenantOptions.map((t) => ({ label: tenantName[t] || t, value: t }))

  // —— 增删改 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<PUser | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fields: CrudField[] = [
    { name: 'loginId', label: '登录账号', type: 'text', required: true, placeholder: '请输入登录账号', colSpan: 1, disabled: !!editing },
    { name: 'nickName', label: '姓名', type: 'text', placeholder: '请输入姓名', colSpan: 1 },
    { name: 'tenant', label: '所属租户', type: 'select', options: TENANT_OPTIONS, colSpan: 1 },
    { name: 'userStatus', label: '启用', type: 'switch', colSpan: 1 },
  ]
  const dialogInitial = editing
    ? {
        loginId: editing.loginId,
        nickName: editing.name,
        tenant: editing.tenant,
        userStatus: editing.status === 'active' ? '0' : '1',
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: PUser) => { setEditing(row); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { ...editing, ...values } : values
      const res = await call(apiClient.POST(editing ? '/api/user/edit' : '/api/user/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增平台用户')
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
      const res = await call(apiClient.POST('/api/user/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除平台用户')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleBatchDelete = async () => {
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/user/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 名平台用户`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => { setKeyword(''); setTenant('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="平台用户"
        description="跨租户的超级管理员与平台级账号，统一纳管（L3 管控）"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新增平台用户</Button>}
      />

      <div className="flex gap-4 flex-1 overflow-hidden">
        <aside className="w-56 shrink-0">
          <div className="rounded-lg border border-border bg-card">
            <div className="px-3 py-2.5 text-sm font-medium border-b border-border">所属租户</div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <button
                onClick={() => setTenant('all')}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md',
                  tenant === 'all' ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60',
                )}
              >
                <Users className="h-4 w-4" />全部租户
              </button>
              {tenantOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTenant(t)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md',
                    tenant === t ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60',
                  )}
                >
                  <Building2 className="h-4 w-4" />{tenantName[t] || t}
                </button>
              ))}
            </ScrollArea>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
            <Input
              placeholder="搜索登录账号 / 姓名"
              className="w-56 h-9"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            />
          </SearchToolbar>

          <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
          </BatchToolbar>

          <TableToolbar
            left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个平台用户</span>}
            right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
          />

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="min-w-36">登录账号</TableHead>
                  <TableHead className="min-w-32">姓名</TableHead>
                  <TableHead className="w-32">所属租户</TableHead>
                  <TableHead className="min-w-40">角色</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 1 ? 100 : 60 }} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : fetched.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">暂无平台用户</TableCell></TableRow>
                ) : (
                  fetched.map((row) => {
                    const isSel = selected.has(String(row.id))
                    return (
                      <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                        <TableCell>
                          <Checkbox checked={isSel} onCheckedChange={() => toggleOne(String(row.id))} />
                        </TableCell>
                        <TableCell className="font-medium text-foreground text-sm">{row.loginId}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tenantName[row.tenant] || row.tenant}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.roles.map((r, i) => <Tag key={i} color="info">{r}</Tag>)}
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
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
        title={editing ? '编辑平台用户' : '新增平台用户'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除平台用户"
        description={`确定要删除「${deleting?.loginId}」吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除平台用户"
        description={`确定要删除选中的 ${selected.size} 名平台用户吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />
    </div>
  )
}

export default PlatformUser
