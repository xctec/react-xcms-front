import { useState } from 'react'
import { PageHeader, StatusBadge, TableToolbar, Tag, SearchToolbar, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  Plus, ChevronRight, ChevronDown, RefreshCw, MoreHorizontal,
  Pencil, Trash2, Lock, BookOpen, PencilLine,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type DictTypeDto = components['schemas']['DictTypeDto']

interface DictEntry {
  id: string
  code: string
  name: string
  tagType: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  sort: number
  status: 'active' | 'inactive'
  locked?: boolean
}

interface DictTypeRow {
  id: string
  dictCode: string
  dictName: string
  locked: boolean
  status: 'active' | 'inactive'
  entryCount: number
  sort: number
  remark: string
  entries: DictEntry[]
}

const TAGS: DictEntry['tagType'][] = ['primary', 'success', 'info', 'warning', 'danger']
const SAMPLE_NAMES = ['选项一', '选项二', '选项三', '选项四', '选项五']

function makeEntries(id: number, locked: boolean): DictEntry[] {
  const n = (id % 4) + 2
  return Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i + 1}`,
    code: String(i),
    name: SAMPLE_NAMES[i] || `选项${i + 1}`,
    tagType: TAGS[(id + i) % TAGS.length],
    sort: i + 1,
    status: 'active' as const,
    locked,
  }))
}

function toRow(d: DictTypeDto): DictTypeRow {
  const id = d.id ?? 0
  const locked = !!d.locked
  return {
    id: String(id),
    dictCode: d.code || '',
    dictName: d.name || '未命名',
    locked,
    status: d.enableStatus === '0' ? 'active' : 'inactive',
    entryCount: (id % 4) + 2,
    sort: d.orderNum ?? id,
    remark: d.nodeDesc || '-',
    entries: makeEntries(id, locked),
  }
}

const tagColorMap: Record<DictEntry['tagType'], string> = {
  primary: 'bg-brand-500',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-destructive',
}

const TAG_OPTIONS = TAGS.map((t) => ({ label: t, value: t }))

export function DictType() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']))
  const [keyword, setKeyword] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // 字典项（子表）本地状态，刷新父表时回退到 row.entries
  const [entriesMap, setEntriesMap] = useState<Record<string, DictEntry[]>>({})
  const getEntries = (row: DictTypeRow) => entriesMap[row.id] ?? row.entries

  const { list, loading } = usePaged<DictTypeDto>(
    () => apiClient.POST('/api/dict/type/page', { body: { pageNo: 1, pageSize: 100, keyword: keyword || undefined } } as any),
    [keyword, reloadKey],
  )
  const rows = list.map(toRow)

  const toggle = (id: string) => {
    const next = new Set(expandedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedIds(next)
  }

  const resetFilters = () => { setKeyword(''); setPage1() }
  const setPage1 = () => setReloadKey((k) => k + 1)

  // —— 字典类型 增删改 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DictTypeRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<DictTypeRow | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const typeFields: CrudField[] = [
    { name: 'dictCode', label: '字典编码', type: 'text', required: true, placeholder: '如 gender', colSpan: 1 },
    { name: 'dictName', label: '字典名称', type: 'text', required: true, placeholder: '如 性别', colSpan: 1 },
    { name: 'orderNum', label: '排序', type: 'number', placeholder: '数字越小越靠前', colSpan: 1 },
    { name: 'enableStatus', label: '启用', type: 'switch', colSpan: 1 },
    { name: 'nodeDesc', label: '备注', type: 'textarea', placeholder: '字典说明', colSpan: 2 },
  ]
  const typeInitial = editing
    ? {
        dictCode: editing.dictCode,
        dictName: editing.dictName,
        orderNum: editing.sort,
        enableStatus: editing.status === 'active' ? '0' : '1',
        nodeDesc: editing.remark === '-' ? '' : editing.remark,
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: DictTypeRow) => { setEditing(row); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { ...editing, ...values } : values
      const res = await call(
        apiClient.POST(editing ? '/api/dict/type/edit' : '/api/dict/type/add', { body: payload } as any),
      )
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增字典类型')
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
      const res = await call(apiClient.POST('/api/dict/type/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除字典类型')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  // —— 字典项（子表）增删改 ——
  const [entryDialog, setEntryDialog] = useState<{ open: boolean; dictId: string; entry?: DictEntry }>({ open: false, dictId: '' })
  const [entrySubmitting, setEntrySubmitting] = useState(false)
  const entryFields: CrudField[] = [
    { name: 'code', label: '项编码', type: 'text', required: true, placeholder: '如 0', colSpan: 1 },
    { name: 'name', label: '项名称', type: 'text', required: true, placeholder: '如 男', colSpan: 1 },
    { name: 'tagType', label: '标签色', type: 'select', options: TAG_OPTIONS, colSpan: 1 },
    { name: 'sort', label: '排序', type: 'number', colSpan: 1 },
    { name: 'status', label: '启用', type: 'switch', colSpan: 2 },
  ]
  const entryInitial = entryDialog.entry
    ? {
        code: entryDialog.entry.code,
        name: entryDialog.entry.name,
        tagType: entryDialog.entry.tagType,
        sort: entryDialog.entry.sort,
        status: entryDialog.entry.status === 'active' ? '0' : '1',
      }
    : undefined
  const openEntryCreate = (dictId: string) => setEntryDialog({ open: true, dictId })
  const openEntryEdit = (dictId: string, entry: DictEntry) => setEntryDialog({ open: true, dictId, entry })
  const handleEntrySubmit = (values: Record<string, any>) => {
    setEntrySubmitting(true)
    try {
      const dictId = entryDialog.dictId
      const base = entriesMap[dictId] ?? rows.find((r) => r.id === dictId)?.entries ?? []
      const statusVal = values.status === true || values.status === '0' ? 'active' : 'inactive'
      let next: DictEntry[]
      if (entryDialog.entry) {
        next = base.map((e) => (e.id === entryDialog.entry!.id ? { ...e, code: values.code, name: values.name, tagType: values.tagType, sort: Number(values.sort), status: statusVal } : e))
      } else {
        next = [
          ...base,
          { id: `${dictId}-${Date.now()}`, code: values.code, name: values.name, tagType: values.tagType, sort: Number(values.sort), status: statusVal, locked: false },
        ]
      }
      setEntriesMap((m) => ({ ...m, [dictId]: next }))
      toast.success(entryDialog.entry ? '已保存字典项' : '已新增字典项')
      setEntryDialog({ open: false, dictId: '' })
    } finally {
      setEntrySubmitting(false)
    }
  }
  const removeEntry = (dictId: string, entryId: string) => {
    const base = entriesMap[dictId] ?? rows.find((r) => r.id === dictId)?.entries ?? []
    setEntriesMap((m) => ({ ...m, [dictId]: base.filter((e) => e.id !== entryId) }))
    toast.success('已删除字典项')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="字典类型"
        description="维护数据字典类型，点击行展开可管理字典项；系统字典(锁定)只读"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            新增字典
          </Button>
        }
      />

      <SearchToolbar onSearch={() => setReloadKey((k) => k + 1)} onReset={resetFilters}>
        <Input
          placeholder="搜索字典编码 / 名称"
          className="w-64 h-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {rows.length} 类字典</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="w-36">字典编码</TableHead>
              <TableHead className="min-w-40">字典名称</TableHead>
              <TableHead className="w-24">锁定</TableHead>
              <TableHead className="w-20 text-right">字典项</TableHead>
              <TableHead className="w-20 text-right">排序</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-40">备注</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 2 ? 100 : 50 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="h-40 text-center text-muted-foreground">暂无字典类型</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isExpanded = expandedIds.has(row.id)
                return (
                  <DictTypeRowItem
                    key={row.id}
                    row={row}
                    isExpanded={isExpanded}
                    onToggle={() => toggle(row.id)}
                    tagColorMap={tagColorMap}
                    entries={getEntries(row)}
                    onEdit={() => openEdit(row)}
                    onDelete={() => setDeleting(row)}
                    onAddEntry={() => openEntryCreate(row.id)}
                    onEditEntry={(e) => openEntryEdit(row.id, e)}
                    onDeleteEntry={(e) => removeEntry(row.id, e.id)}
                  />
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CrudDialog
        open={dialogOpen}
        title={editing ? '编辑字典类型' : '新增字典类型'}
        fields={typeFields}
        initialValues={typeInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除字典类型"
        description={`确定要删除字典类型「${deleting?.dictName}」吗？其下字典项将一并移除。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <CrudDialog
        open={entryDialog.open}
        title={entryDialog.entry ? '编辑字典项' : '新增字典项'}
        fields={entryFields}
        initialValues={entryInitial}
        submitting={entrySubmitting}
        onOpenChange={(o) => !o && setEntryDialog({ open: false, dictId: '' })}
        onSubmit={handleEntrySubmit}
      />
    </div>
  )
}

function DictTypeRowItem({
  row,
  isExpanded,
  onToggle,
  tagColorMap,
  entries,
  onEdit,
  onDelete,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: {
  row: DictTypeRow
  isExpanded: boolean
  onToggle: () => void
  tagColorMap: Record<DictEntry['tagType'], string>
  entries: DictEntry[]
  onEdit: () => void
  onDelete: () => void
  onAddEntry: () => void
  onEditEntry: (e: DictEntry) => void
  onDeleteEntry: (e: DictEntry) => void
}) {
  return (
    <>
      <TableRow className="h-12 cursor-pointer" onClick={onToggle}>
        <TableCell>
          <button className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </TableCell>
        <TableCell className="font-mono text-xs text-foreground">{row.dictCode}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm text-foreground">{row.dictName}</span>
          </div>
        </TableCell>
        <TableCell>
          {row.locked ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              系统
            </span>
          ) : (
            <Tag color="success">可编辑</Tag>
          )}
        </TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{entries.length}</TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.sort}</TableCell>
        <TableCell>
          <StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{row.remark || '—'}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onToggle}>
                <BookOpen className="h-4 w-4" />
                字典数据
              </DropdownMenuItem>
              <DropdownMenuItem disabled={row.locked} onClick={onEdit}>
                <Pencil className="h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={row.locked} onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={9} className="bg-secondary/40 p-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-foreground">{row.dictName} · 字典项</h4>
                  <Tag color="brand">{entries.length} 项</Tag>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={row.locked} onClick={onAddEntry}>
                  <Plus className="h-3.5 w-3.5" />
                  新增字典项
                </Button>
              </div>

              <div className="rounded-md border border-border overflow-hidden bg-background">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      <TableHead className="w-32 h-9 text-xs">项编码</TableHead>
                      <TableHead className="min-w-32 h-9 text-xs">项名称</TableHead>
                      <TableHead className="w-32 h-9 text-xs">标签色</TableHead>
                      <TableHead className="w-20 h-9 text-xs text-right">排序</TableHead>
                      <TableHead className="w-20 h-9 text-xs">状态</TableHead>
                      <TableHead className="w-20 h-9 text-xs text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} className="h-10">
                        <TableCell className="font-mono text-xs text-foreground">{entry.code}</TableCell>
                        <TableCell className="text-sm text-foreground">{entry.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            <span className={cn('h-3 w-3 rounded-full', tagColorMap[entry.tagType])} />
                            <span className="text-xs text-muted-foreground">{entry.tagType}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{entry.sort}</TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status}>{entry.status === 'active' ? '启用' : '停用'}</StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={entry.locked} onClick={() => onEditEntry(entry)}>
                              <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={entry.locked} onClick={() => onDeleteEntry(entry)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default DictType
