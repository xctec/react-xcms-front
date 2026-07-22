import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, StatusBadge, Tag, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Folder, SquareMenu, Command, Plus, RefreshCw, Pencil, Trash2, Lock, ChevronRight, ChevronDown, ListTree } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { useApi } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type MenuDto = components['schemas']['MenuDto']

interface MenuRow {
  id: string
  name: string
  code: string
  type: 'dir' | 'menu' | 'btn'
  icon: string
  path: string
  order: number
  status: 'active' | 'inactive'
  perm: string
  locked: boolean
  children: MenuRow[]
}

function toRow(m: MenuDto): MenuRow {
  const mt = m.menuType
  const type: MenuRow['type'] = mt === 'M' ? 'menu' : mt === 'B' ? 'btn' : 'dir'
  return {
    id: String(m.id ?? 0),
    name: m.name || m.code || '未命名',
    code: m.code || '',
    type,
    icon: m.icon || '-',
    path: m.routePath || '-',
    order: m.orderNum ?? 0,
    status: m.showStatus === '0' ? 'active' : 'inactive',
    perm: m.perm || '-',
    locked: m.locked === '1',
    children: (m.children || []).map(toRow),
  }
}

const typeMeta: Record<MenuRow['type'], { label: string; color: 'brand' | 'info' | 'neutral'; icon: typeof Folder }> = {
  dir: { label: '目录', color: 'neutral', icon: Folder },
  menu: { label: '菜单', color: 'brand', icon: SquareMenu },
  btn: { label: '按钮', color: 'info', icon: Command },
}

const TYPE_OPTIONS = [
  { label: '目录', value: 'D' },
  { label: '菜单', value: 'M' },
  { label: '按钮', value: 'B' },
]

function findChildren(nodes: MenuRow[], id: string): MenuRow[] | null {
  for (const n of nodes) {
    if (n.id === id) return n.children
    const found = findChildren(n.children, id)
    if (found) return found
  }
  return null
}

export function MenuManagement() {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2']))
  const [selectedId, setSelectedId] = useState<string>('root')
  const [reloadKey, setReloadKey] = useState(0)

  const { data, loading } = useApi<components['schemas']['ResultVoListMenuDto']>(
    () => apiClient.POST('/api/menu/tree', { body: {} } as any),
    [reloadKey],
  )
  const tree = (data?.data || []).map(toRow)

  const matches = (n: MenuRow) =>
    (type === 'all' || n.type === type) &&
    (status === 'all' || n.status === (status === '0' ? 'active' : 'inactive')) &&
    (!keyword || n.name.includes(keyword) || n.code.includes(keyword))

  const selectedChildren = selectedId === 'root' ? tree : (findChildren(tree, selectedId) ?? [])
  const rows = selectedChildren.filter(matches)
  const flatCount = (ns: MenuRow[]): number => ns.reduce((s, n) => s + 1 + flatCount(n.children), 0)
  const totalCount = flatCount(tree)

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  // —— 增删改 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MenuRow | null>(null)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<MenuRow | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fields: CrudField[] = [
    { name: 'name', label: '菜单名称', type: 'text', required: true, placeholder: '请输入菜单名称', colSpan: 1 },
    { name: 'code', label: '编码', type: 'text', required: true, placeholder: '如 system:user:list', colSpan: 1 },
    { name: 'menuType', label: '类型', type: 'select', options: TYPE_OPTIONS, colSpan: 1 },
    { name: 'icon', label: '图标', type: 'text', placeholder: 'lucide 图标名', colSpan: 1 },
    { name: 'routePath', label: '路由', type: 'text', placeholder: '/system/user', colSpan: 1 },
    { name: 'perm', label: '权限标识', type: 'text', placeholder: 'system:user:list', colSpan: 1 },
    { name: 'orderNum', label: '排序', type: 'number', colSpan: 1 },
    { name: 'showStatus', label: '显示', type: 'switch', colSpan: 1 },
  ]
  const dialogInitial = editing
    ? {
        name: editing.name,
        code: editing.code,
        menuType: editing.type === 'dir' ? 'D' : editing.type === 'menu' ? 'M' : 'B',
        icon: editing.icon === '-' ? '' : editing.icon,
        routePath: editing.path === '-' ? '' : editing.path,
        perm: editing.perm === '-' ? '' : editing.perm,
        orderNum: editing.order,
        showStatus: editing.status === 'active' ? '0' : '1',
      }
    : undefined
  const dialogTitle = editing ? '编辑菜单' : createParentId ? '新增子菜单' : '新增菜单'

  const openCreateRoot = () => { setEditing(null); setCreateParentId(null); setDialogOpen(true) }
  const openCreateChild = (id: string) => { setEditing(null); setCreateParentId(id); setDialogOpen(true) }
  const openEdit = (row: MenuRow) => { setEditing(row); setCreateParentId(null); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing
        ? { id: editing.id, ...values }
        : { parentId: createParentId ?? null, ...values }
      const res = await call(apiClient.POST(editing ? '/api/menu/edit' : '/api/menu/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增菜单')
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
      const res = await call(apiClient.POST('/api/menu/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除菜单')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => { setKeyword(''); setType('all'); setStatus('all') }

  const selectedLabel = selectedId === 'root' ? '全部菜单' : (findNodeName(tree, selectedId) || '菜单')
  function findNodeName(nodes: MenuRow[], id: string): string | null {
    for (const n of nodes) {
      if (n.id === id) return n.name
      const r = findNodeName(n.children, id)
      if (r) return r
    }
    return null
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="菜单管理"
        description="配置平台菜单与功能权限点，左侧选择目录 / 菜单，右侧维护其下子项"
        actions={<Button onClick={openCreateRoot}><Plus className="h-4 w-4" />新增菜单</Button>}
      />

      <SearchToolbar onSearch={() => setReloadKey((k) => k + 1)} onReset={resetFilters}>
        <Input
          placeholder="搜索菜单名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="dir">目录</SelectItem>
            <SelectItem value="menu">菜单</SelectItem>
            <SelectItem value="btn">按钮</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">显示</SelectItem>
            <SelectItem value="1">隐藏</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <div className="flex gap-4 flex-1 overflow-hidden">
        <aside className="w-64 shrink-0">
          <div className="rounded-lg border border-border bg-card flex flex-col h-full">
            <div className="px-3 py-2.5 text-sm font-medium border-b border-border flex items-center gap-2">
              <ListTree className="h-4 w-4 text-muted-foreground" />菜单结构
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              <button
                onClick={() => setSelectedId('root')}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md ${selectedId === 'root' ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60'}`}
              >
                <ListTree className="h-4 w-4" />全部菜单
              </button>
              {tree.map((n) => (
                <TreeItem
                  key={n.id}
                  node={n}
                  level={0}
                  selectedId={selectedId}
                  expanded={expanded}
                  onSelect={setSelectedId}
                  onToggle={toggle}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TableToolbar
            left={<span className="text-sm text-muted-foreground">「{selectedLabel}」下 {rows.length} 项 · 共 {totalCount} 个菜单项</span>}
            right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
          />

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-40">菜单名称</TableHead>
                  <TableHead className="w-44">编码</TableHead>
                  <TableHead className="w-24">类型</TableHead>
                  <TableHead className="min-w-40">路由</TableHead>
                  <TableHead className="min-w-32">权限标识</TableHead>
                  <TableHead className="w-20 text-right">排序</TableHead>
                  <TableHead className="w-20">状态</TableHead>
                  <TableHead className="w-40 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 120 : 50 }} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">该节点下暂无菜单项</TableCell></TableRow>
                ) : (
                  rows.map((row) => {
                    const t = typeMeta[row.type]
                    const Icon = t.icon
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground text-sm">{row.name}</span>
                            {row.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                        <TableCell><Tag color={t.color}>{t.label}</Tag></TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.path}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.perm}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.order}</TableCell>
                        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '显示' : '隐藏'}</StatusBadge></TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openCreateChild(row.id)}><Plus className="h-3.5 w-3.5" />子项</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(row)} disabled={row.locked}><Pencil className="h-3.5 w-3.5" />编辑</Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => setDeleting(row)} disabled={row.locked}><Trash2 className="h-3.5 w-3.5" />删除</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <CrudDialog
        open={dialogOpen}
        title={dialogTitle}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除菜单"
        description={`确定要删除菜单「${deleting?.name}」吗？其下子项将一并移除。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function TreeItem({ node, level, selectedId, expanded, onSelect, onToggle }: {
  node: MenuRow
  level: number
  selectedId: string
  expanded: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.id)
  const isSel = selectedId === node.id
  const t = typeMeta[node.type]
  const Icon = t.icon
  return (
    <div>
      <div
        onClick={() => onSelect(node.id)}
        className={`flex items-center gap-1 px-2 py-1.5 text-sm rounded-md cursor-pointer ${isSel ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-medium' : 'text-foreground/80 hover:bg-muted/60'}`}
        style={{ paddingLeft: 8 + level * 14 }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id) }}
            className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="w-4" />}
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{node.name}</span>
        {node.locked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
      </div>
      {hasChildren && isOpen && node.children.map((c) => (
        <TreeItem key={c.id} node={c} level={level + 1} selectedId={selectedId} expanded={expanded} onSelect={onSelect} onToggle={onToggle} />
      ))}
    </div>
  )
}

export default MenuManagement
