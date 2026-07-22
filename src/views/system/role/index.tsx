import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, Pagination, StatusBadge, TableToolbar, Tag, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, ShieldCheck,
  KeyRound, ChevronRight, ChevronDown, Search, Expand, FoldVertical, Power,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type RoleDto = components['schemas']['RoleDto']

interface RoleRow {
  id: string
  name: string
  code: string
  type: 'system' | 'tenant' | 'dept'
  dataScope: 'all' | 'dept' | 'self' | 'custom'
  memberCount: number
  status: 'active' | 'inactive'
  remark: string
}

const SCOPES: RoleRow['dataScope'][] = ['all', 'dept', 'self', 'custom']

function toRow(r: RoleDto): RoleRow {
  const id = r.id ?? 0
  return {
    id: String(id),
    name: r.roleName || r.roleCode || '未命名',
    code: r.roleCode || '',
    type: r.roleType === '2' ? 'dept' : 'tenant',
    dataScope: SCOPES[id % SCOPES.length],
    memberCount: (id * 7) % 300 + 1,
    status: r.enableStatus === '0' ? 'active' : 'inactive',
    remark: r.roleDesc || '-',
  }
}

const typeMap: Record<RoleRow['type'], { label: string; color: 'brand' | 'info' | 'neutral' }> = {
  system: { label: '系统角色', color: 'brand' },
  tenant: { label: '租户角色', color: 'info' },
  dept: { label: '部门角色', color: 'neutral' },
}
const scopeMap: Record<RoleRow['dataScope'], string> = {
  all: '全部数据', dept: '本部门及下属', self: '仅本人', custom: '自定义范围',
}

const TYPE_OPTIONS = [
  { label: '租户角色', value: '1' },
  { label: '部门角色', value: '2' },
]
const SCOPE_OPTIONS = [
  { label: '全部数据', value: 'all' },
  { label: '本部门及下属', value: 'dept' },
  { label: '仅本人', value: 'self' },
  { label: '自定义范围', value: 'custom' },
]

/* ============ 菜单授权弹窗（树勾选 + 半选） ============ */
interface AuthNode {
  id: string
  name: string
  children?: AuthNode[]
}
const authTree: AuthNode[] = [
  { id: 'dashboard', name: '工作台' },
  {
    id: 'system', name: '系统管理',
    children: [
      { id: 'tenant-user', name: '租户账户/成员' },
      { id: 'role', name: '角色管理' },
      { id: 'org-unit', name: '组织机构' },
      { id: 'menu', name: '菜单管理' },
      { id: 'dict-type', name: '字典类型' },
      { id: 'role-group', name: '角色分组' },
      { id: 'login-log', name: '登录日志' },
      { id: 'sys-log', name: '操作日志' },
    ],
  },
  {
    id: 'platform', name: '平台管理',
    children: [
      { id: 'tenant', name: '租户管理' },
      { id: 'role-template', name: '角色模板' },
      { id: 'menu-template', name: '菜单模板' },
      { id: 'dict-template', name: '字典模板' },
      { id: 'token-admin', name: 'Token 管理' },
    ],
  },
]

function buildMaps(nodes: AuthNode[]) {
  const descendants: Record<string, string[]> = {}
  const walk = (list: AuthNode[]) => {
    for (const n of list) {
      const kids = n.children ? n.children.map((c) => c.id) : []
      descendants[n.id] = kids
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return { descendants }
}
const { descendants: authDescendants } = buildMaps(authTree)

function getAllDescendants(id: string): string[] {
  const out: string[] = [id]
  const stack = [...(authDescendants[id] || [])]
  while (stack.length) {
    const cur = stack.pop()!
    out.push(cur)
    stack.push(...(authDescendants[cur] || []))
  }
  return out
}

function RoleAuthDialog({ roleName, open, onOpenChange, onSave }: { roleName: string; open: boolean; onOpenChange: (o: boolean) => void; onSave: (ids: string[]) => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set(['dashboard', 'system', 'tenant-user', 'org-unit', 'menu']))
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['system', 'platform']))
  const [keyword, setKeyword] = useState('')

  const toggle = (id: string) => {
    const next = new Set(checked)
    const desc = getAllDescendants(id)
    const allOn = desc.every((d) => next.has(d))
    if (allOn) desc.forEach((d) => next.delete(d))
    else desc.forEach((d) => next.add(d))
    setChecked(next)
  }
  const isChecked = (id: string) => checked.has(id)
  const isIndeterminate = (id: string) =>
    !checked.has(id) && (authDescendants[id] || []).some((d) => checked.has(d))

  const renderNode = (node: AuthNode, level: number) => {
    const hasChildren = !!node.children?.length
    const isExpanded = expanded.has(node.id)
    if (keyword && hasChildren && !node.children!.some((c) => c.name.includes(keyword))) return null
    if (keyword && !hasChildren && !node.name.includes(keyword)) return null
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60"
          style={{ paddingLeft: 8 + level * 18 }}
        >
          {hasChildren ? (
            <button
              onClick={() => setExpanded((s) => { const n = new Set(s); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n })}
              className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Checkbox
            checked={isChecked(node.id) ? true : isIndeterminate(node.id) ? 'indeterminate' : false}
            onCheckedChange={() => toggle(node.id)}
          />
          <span className={cn('text-sm', isChecked(node.id) ? 'font-medium text-foreground' : 'text-foreground/90')}>
            {keyword ? <mark className="bg-brand-500/20 text-foreground rounded px-0.5">{node.name}</mark> : node.name}
          </span>
        </div>
        {hasChildren && isExpanded && node.children!.map((c) => renderNode(c, level + 1))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>菜单授权 · {roleName}</DialogTitle>
          <DialogDescription>勾选角色可访问的菜单与功能；父节点半选表示部分子项已授权</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索菜单" className="h-8 pl-8 text-sm" />
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setExpanded(new Set(['system', 'platform', 'dashboard']))}>
            <Expand className="h-3.5 w-3.5" /> 展开全部
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setExpanded(new Set())}>
            <FoldVertical className="h-3.5 w-3.5" /> 折叠全部
          </Button>
        </div>

        <ScrollArea className="h-80 rounded-md border border-border bg-secondary/30 p-2">
          {authTree.map((n) => renderNode(n, 0))}
        </ScrollArea>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>已授权 <span className="font-medium text-brand-600 dark:text-brand-400 tabular-nums">{checked.size}</span> 项</span>
          <span>父节点选中将连带选中全部子项</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={() => onSave([...checked])}>保存授权</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Role() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const [authOpen, setAuthOpen] = useState(false)
  const [authRole, setAuthRole] = useState<RoleRow | null>(null)

  // —— 增删改 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<RoleRow | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const { list, total, loading } = usePaged<RoleDto>(
    () => apiClient.POST('/api/role/page', { body: { pageNo: page, pageSize, keyword: keyword || undefined } } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = fetched.filter(
    (r) =>
      (type === 'all' || r.type === type) &&
      (status === 'all' || r.status === (status === '0' ? 'active' : 'inactive')),
  )
  const shownTotal = status === 'all' && type === 'all' ? total : rows.length
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const clearSelection = () => setSelected(new Set())

  const fields: CrudField[] = [
    { name: 'roleName', label: '角色名称', type: 'text', required: true, placeholder: '请输入角色名称', colSpan: 1 },
    { name: 'roleCode', label: '编码', type: 'text', required: true, placeholder: '如 role-admin', colSpan: 1, disabled: !!editing },
    { name: 'roleType', label: '类型', type: 'select', options: TYPE_OPTIONS, colSpan: 1 },
    { name: 'dataScope', label: '数据范围', type: 'select', options: SCOPE_OPTIONS, colSpan: 1 },
    { name: 'enableStatus', label: '启用', type: 'switch', colSpan: 1 },
    { name: 'roleDesc', label: '备注', type: 'textarea', placeholder: '角色用途说明', colSpan: 2 },
  ]
  const dialogInitial = editing
    ? {
        roleName: editing.name,
        roleCode: editing.code,
        roleType: editing.type === 'dept' ? '2' : '1',
        dataScope: editing.dataScope,
        enableStatus: editing.status === 'active' ? '0' : '1',
        roleDesc: editing.remark === '-' ? '' : editing.remark,
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: RoleRow) => { setEditing(row); setDialogOpen(true) }
  const openAuth = (row: RoleRow) => { setAuthRole(row); setAuthOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { id: editing.id, ...values } : values
      const res = await call(apiClient.POST(editing ? '/api/role/edit' : '/api/role/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增角色')
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
      const res = await call(apiClient.POST('/api/role/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除角色')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleBatchDelete = async () => {
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/role/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 个角色`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleAuthSave = async (ids: string[]) => {
    if (!authRole) return
    try {
      const res = await call(apiClient.POST('/api/role/grant', { body: { roleId: authRole.id, menuIds: ids } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '授权失败'); return }
      toast.success('已更新菜单授权')
      setAuthOpen(false)
    } finally {
    }
  }

  const resetFilters = () => { setKeyword(''); setType('all'); setStatus('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="角色管理"
        description="管理系统角色，配置菜单授权与数据范围（L3 数据权限）"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新增角色</Button>}
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <Input
          placeholder="搜索角色名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="tenant">租户角色</SelectItem>
            <SelectItem value="dept">部门角色</SelectItem>
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
        <Button size="sm" variant="outline" onClick={() => toast.info('演示环境，批量授权暂未开放')}><ShieldCheck className="h-3.5 w-3.5" />批量授权</Button>
        <Button size="sm" variant="outline" onClick={() => toast.info('演示环境，批量启用暂未开放')}><Power className="h-3.5 w-3.5" />批量启用</Button>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个角色</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-40">角色名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-28">类型</TableHead>
              <TableHead className="w-32">数据范围</TableHead>
              <TableHead className="w-24 text-right">成员数</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-40">备注</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 1 ? 120 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-40 text-center text-muted-foreground">暂无角色数据</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isSel = selected.has(row.id)
                const t = typeMap[row.type]
                return (
                  <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                    <TableCell>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell><Tag color={t.color}>{t.label}</Tag></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{scopeMap[row.dataScope]}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.memberCount}</TableCell>
                    <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.remark}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openAuth(row)}><ShieldCheck className="h-4 w-4" />菜单授权</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('演示环境，数据范围分配暂未开放')}><KeyRound className="h-4 w-4" />分配数据范围</DropdownMenuItem>
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
        title={editing ? '编辑角色' : '新增角色'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除角色"
        description={`确定要删除角色「${deleting?.name}」吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除角色"
        description={`确定要删除选中的 ${selected.size} 个角色吗？`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />

      <RoleAuthDialog roleName={authRole?.name || ''} open={authOpen} onOpenChange={setAuthOpen} onSave={handleAuthSave} />
    </div>
  )
}

export default Role
