import { useState } from 'react'
import {
  PageHeader, SearchToolbar, BatchToolbar, Pagination, StatusBadge,
  TableToolbar, Tag, CrudDialog, ConfirmDialog, type CrudField,
} from '@/components/xcms'
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
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'

interface UserMessageDto {
  id?: number
  title?: string
  content?: string
  type?: string
  tenantUserId?: number
  senderId?: number
  read?: string
  status?: string
  createdTime?: string
}

interface MessageRow {
  id: number
  title: string
  content: string
  type: string
  tenantUserId?: number
  senderId?: number
  read: '0' | '1'
  status: '0' | '1'
  createdTime?: string
}

function toRow(m: UserMessageDto): MessageRow {
  return {
    id: m.id ?? 0,
    title: m.title || '-',
    content: m.content || '',
    type: m.type || 'N',
    tenantUserId: m.tenantUserId,
    senderId: m.senderId,
    read: (m.read as MessageRow['read']) || '0',
    status: (m.status as MessageRow['status']) || '1',
    createdTime: m.createdTime,
  }
}

const typeMap: Record<string, { label: string; color: 'brand' | 'info' }> = {
  N: { label: '通知', color: 'brand' },
  D: { label: '私信', color: 'info' },
}
const TYPE_OPTIONS = [
  { label: '通知', value: 'N' },
  { label: '私信', value: 'D' },
]
const READ_OPTIONS = [
  { label: '未读', value: '0' },
  { label: '已读', value: '1' },
]
const STATUS_OPTIONS = [
  { label: '正常', value: '1' },
  { label: '已撤回', value: '0' },
]

export function Message({ tenantUserId }: { tenantUserId?: number } = {}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const [read, setRead] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MessageRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<MessageRow | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const { list, loading } = usePaged<UserMessageDto>(
    () => apiClient.POST('/api/message/page', { body: { pageNo: page, pageSize, keyword: keyword || undefined, tenantUserId: tenantUserId ?? undefined } } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = fetched.filter(
    (r) =>
      (type === 'all' || r.type === type) &&
      (read === 'all' || r.read === read) &&
      (tenantUserId == null || r.tenantUserId === tenantUserId),
  )
  const shownTotal = rows.length
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const clearSelection = () => setSelected(new Set())

  const allFields: CrudField[] = [
    { name: 'title', label: '消息标题', type: 'text', required: true, placeholder: '请输入消息标题', colSpan: 2 },
    { name: 'content', label: '消息内容', type: 'textarea', required: true, placeholder: '请输入消息内容', colSpan: 2 },
    { name: 'type', label: '类型', type: 'select', required: true, options: TYPE_OPTIONS, colSpan: 1 },
    { name: 'tenantUserId', label: '接收人ID', type: 'number', placeholder: '接收消息的租户成员ID', colSpan: 1 },
    { name: 'senderId', label: '发送人ID', type: 'number', placeholder: '发送消息的租户成员ID', colSpan: 1 },
    { name: 'read', label: '已读', type: 'select', options: READ_OPTIONS, colSpan: 1 },
    { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS, colSpan: 1 },
  ]
  // 传入 tenantUserId 时（嵌入弹框场景），接收人固定为该用户，不在界面上可选/显示
  const fields = tenantUserId != null ? allFields.filter((f) => f.name !== 'tenantUserId') : allFields
  const dialogInitial = editing
    ? {
        title: editing.title,
        content: editing.content,
        type: editing.type,
        tenantUserId: editing.tenantUserId ?? '',
        senderId: editing.senderId ?? '',
        read: editing.read,
        status: editing.status,
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: MessageRow) => { setEditing(row); setDialogOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { id: editing.id, ...values } : values
      // 嵌入弹框时固定接收人为传入的租户成员，不可更改
      if (tenantUserId != null) payload.tenantUserId = tenantUserId
      const res = await call(apiClient.POST(editing ? '/api/message/edit' : '/api/message/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增消息')
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
      const res = await call(apiClient.POST('/api/message/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除消息')
      setSelected((s) => { const n = new Set(s); n.delete(deleting.id); return n })
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handleBatchDelete = async () => {
    setConfirmLoading(true)
    try {
      const res = await call(apiClient.POST('/api/message/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 条消息`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => { setKeyword(''); setType('all'); setRead('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={tenantUserId != null ? `用户消息 · 租户成员 #${tenantUserId}` : '消息管理'}
        description={tenantUserId != null ? '已按指定租户成员筛选接收人，接收人不可更改' : '管理系统通知与站内私信，支持新增、编辑、删除与批量删除'}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新建消息</Button>}
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <Input
          placeholder="搜索标题 / 内容"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="N">通知</SelectItem>
            <SelectItem value="D">私信</SelectItem>
          </SelectContent>
        </Select>
        <Select value={read} onValueChange={(v) => { setRead(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="已读状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">未读</SelectItem>
            <SelectItem value="1">已读</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 条消息</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-44">标题</TableHead>
              <TableHead className="min-w-56">内容</TableHead>
              <TableHead className="w-20">类型</TableHead>
              <TableHead className="w-24">已读</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-40">创建时间</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 1 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无消息数据</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isSel = selected.has(row.id)
                const t = typeMap[row.type]
                return (
                  <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                    <TableCell>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{row.title}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{row.content}</TableCell>
                    <TableCell><Tag color={t.color}>{t.label}</Tag></TableCell>
                    <TableCell>
                      {row.read === '1'
                        ? <StatusBadge status="active">已读</StatusBadge>
                        : <StatusBadge status="warning">未读</StatusBadge>}
                    </TableCell>
                    <TableCell>
                      {row.status === '1'
                        ? <StatusBadge status="active">正常</StatusBadge>
                        : <StatusBadge status="inactive">已撤回</StatusBadge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.createdTime ? new Date(row.createdTime).toLocaleString('zh-CN', { hour12: false }) : '-'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
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

      <CrudDialog
        open={dialogOpen}
        title={editing ? '编辑消息' : '新建消息'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除消息"
        description={`确定要删除消息「${deleting?.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除消息"
        description={`确定要删除选中的 ${selected.size} 条消息吗？此操作不可恢复。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />
    </div>
  )
}

export default Message
