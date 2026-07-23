import { useState } from 'react'
import {
  PageHeader, SearchToolbar, BatchToolbar, Pagination, StatusBadge,
  TableToolbar, CrudDialog, ConfirmDialog, type CrudField,
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
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, Send, Undo2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import { UserMessageDialog } from '@/views/system/message/UserMessageDialog'

interface NoticeDto {
  id?: number
  title?: string
  content?: string
  status?: string
  targetType?: string
  targetValue?: string
  tenantUserId?: number
  publisherId?: number
  templateCode?: string
  publishTime?: string
  createTime?: string
}

interface NoticeRow {
  id: number
  title: string
  content: string
  status: '0' | '1' | '2'
  targetType: string
  targetValue: string
  tenantUserId?: number
  publisherId?: number
  templateCode?: string
  publishTime?: string
  createTime?: string
}

function toRow(n: NoticeDto): NoticeRow {
  const fromTarget =
    n.targetType === 'USER' && n.targetValue && Number.isFinite(Number(n.targetValue))
      ? Number(n.targetValue)
      : undefined
  return {
    id: n.id ?? 0,
    title: n.title || '-',
    content: n.content || '',
    status: (n.status as NoticeRow['status']) || '0',
    targetType: n.targetType || '',
    targetValue: n.targetValue || '',
    tenantUserId: n.tenantUserId ?? fromTarget,
    publisherId: n.publisherId,
    templateCode: n.templateCode,
    publishTime: n.publishTime,
    createTime: n.createTime,
  }
}

const statusMap: Record<NoticeRow['status'], { label: string; type: 'pending' | 'active' | 'inactive' }> = {
  '0': { label: '草稿', type: 'pending' },
  '1': { label: '已发布', type: 'active' },
  '2': { label: '已撤回', type: 'inactive' },
}
const targetTypeMap: Record<string, string> = {
  ROLE: '角色', DEPT: '部门', TENANT: '租户', USER: '用户',
}
const STATUS_OPTIONS = [
  { label: '草稿', value: '0' },
  { label: '已发布', value: '1' },
  { label: '已撤回', value: '2' },
]
const TARGET_OPTIONS = [
  { label: '角色', value: 'ROLE' },
  { label: '部门', value: 'DEPT' },
  { label: '租户', value: 'TENANT' },
  { label: '用户', value: 'USER' },
]

export function Notice() {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [reloadKey, setReloadKey] = useState(0)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NoticeRow | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<NoticeRow | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [msgOpen, setMsgOpen] = useState(false)
  const [msgTenantUserId, setMsgTenantUserId] = useState<number | undefined>()

  const { list, total, loading } = usePaged<NoticeDto>(
    () => apiClient.POST('/api/notice/page', { body: { pageNo: page, pageSize, keyword: keyword || undefined } } as any),
    [page, pageSize, keyword, reloadKey],
  )

  const fetched = list.map(toRow)
  const rows = fetched.filter((r) => status === 'all' || r.status === status)
  const shownTotal = status === 'all' ? total : rows.length
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))
  const toggleOne = (id: number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const clearSelection = () => setSelected(new Set())

  const fields: CrudField[] = [
    { name: 'title', label: '通知标题', type: 'text', required: true, placeholder: '请输入通知标题', colSpan: 2 },
    { name: 'content', label: '通知内容', type: 'textarea', required: true, placeholder: '请输入通知内容', colSpan: 2 },
    { name: 'targetType', label: '接收类型', type: 'select', required: true, options: TARGET_OPTIONS, colSpan: 1 },
    { name: 'targetValue', label: '接收对象', type: 'text', placeholder: '角色/部门/租户/用户 标识', colSpan: 1 },
    { name: 'publisherId', label: '发布人ID', type: 'number', placeholder: '发布人租户成员ID', colSpan: 1 },
    { name: 'templateCode', label: '模板编码', type: 'text', placeholder: '可选，消息模板编码', colSpan: 1 },
    { name: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS, colSpan: 1 },
  ]
  const dialogInitial = editing
    ? {
        title: editing.title,
        content: editing.content,
        targetType: editing.targetType,
        targetValue: editing.targetValue,
        publisherId: editing.publisherId ?? '',
        templateCode: editing.templateCode ?? '',
        status: editing.status,
      }
    : undefined

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (row: NoticeRow) => { setEditing(row); setDialogOpen(true) }
  const openMsg = (row: NoticeRow) => { setMsgTenantUserId(row.tenantUserId); setMsgOpen(true) }

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing ? { id: editing.id, ...values } : values
      const res = await call(apiClient.POST(editing ? '/api/notice/edit' : '/api/notice/add', { body: payload } as any))
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增通知')
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
      const res = await call(apiClient.POST('/api/notice/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除通知')
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
      const res = await call(apiClient.POST('/api/notice/deleteAll', { body: { ids: Array.from(selected) } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success(`已删除 ${selected.size} 条通知`)
      setSelected(new Set())
      setBatchOpen(false)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }
  const handlePublish = async (row: NoticeRow) => {
    const res = await call(apiClient.POST('/api/notice/publish', { body: { id: row.id } } as any))
    if (res.error) { toast.error(res.error.errorMsg || '发布失败'); return }
    toast.success('已发布')
    setReloadKey((k) => k + 1)
  }
  const handleWithdraw = async (row: NoticeRow) => {
    const res = await call(apiClient.POST('/api/notice/withdraw', { body: { id: row.id } } as any))
    if (res.error) { toast.error(res.error.errorMsg || '撤回失败'); return }
    toast.success('已撤回')
    setReloadKey((k) => k + 1)
  }

  const resetFilters = () => { setKeyword(''); setStatus('all'); setPage(1) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="通知管理"
        description="创建并发布系统通知，管理草稿、已发布与已撤回状态"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新建通知</Button>}
      />

      <SearchToolbar onSearch={() => setPage(1)} onReset={resetFilters}>
        <Input
          placeholder="搜索通知标题 / 内容"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">草稿</SelectItem>
            <SelectItem value="1">已发布</SelectItem>
            <SelectItem value="2">已撤回</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setBatchOpen(true)}><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 条通知</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-44">通知标题</TableHead>
              <TableHead className="min-w-56">内容</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-36">接收范围</TableHead>
              <TableHead className="w-40">发布时间</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
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
              <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">暂无通知数据</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isSel = selected.has(row.id)
                const st = statusMap[row.status]
                return (
                  <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                    <TableCell>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{row.title}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{row.content}</TableCell>
                    <TableCell><StatusBadge status={st.type}>{st.label}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {targetTypeMap[row.targetType] || row.targetType || '-'}
                      {row.targetValue ? ` · ${row.targetValue}` : ''}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.publishTime ? new Date(row.publishTime).toLocaleString('zh-CN', { hour12: false }) : '-'}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {row.status !== '1' && (
                            <DropdownMenuItem onClick={() => handlePublish(row)}><Send className="h-4 w-4" />发布</DropdownMenuItem>
                          )}
                          {row.status === '1' && (
                            <DropdownMenuItem onClick={() => handleWithdraw(row)}><Undo2 className="h-4 w-4" />撤回</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEdit(row)}><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                          {row.tenantUserId != null && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openMsg(row)}><MessageSquare className="h-4 w-4" />用户消息</DropdownMenuItem>
                            </>
                          )}
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
        title={editing ? '编辑通知' : '新建通知'}
        fields={fields}
        initialValues={dialogInitial}
        submitting={submitting}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleting}
        title="删除通知"
        description={`确定要删除通知「${deleting?.title}」吗？此操作不可恢复。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={batchOpen}
        title="批量删除通知"
        description={`确定要删除选中的 ${selected.size} 条通知吗？此操作不可恢复。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={setBatchOpen}
        onConfirm={handleBatchDelete}
      />

      <UserMessageDialog open={msgOpen} onOpenChange={setMsgOpen} tenantUserId={msgTenantUserId} />
    </div>
  )
}

export default Notice
