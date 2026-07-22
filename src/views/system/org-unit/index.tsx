import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, StatusBadge, Tag, CrudDialog, ConfirmDialog, type CrudField } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Building2, Users2, UserSquare2, Plus, RefreshCw, Pencil, Trash2, UserPlus, ChevronRight, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient, call } from '@/utils/request'
import { useApi } from '@/lib/api/hooks'

type OrgType = 'company' | 'dept' | 'team'
interface OrgNode {
  id: number
  parentId: number
  code: string
  name: string
  nodeDesc?: string
  treeLevel: number
  orgUnitStatus: string
  children?: OrgNode[]
}
interface OrgUnitTreeResp {
  errorNo: string
  errorMsg: string
  data: OrgNode[]
}

interface OrgRow {
  id: string
  name: string
  code: string
  type: OrgType
  leader: string
  memberCount: number
  status: 'active' | 'inactive'
  children: OrgRow[]
}

const leaders = ['张伟', '李娜', '王强', '赵敏', '陈杰']
function toRow(o: OrgNode): OrgRow {
  const type: OrgType = o.treeLevel === 0 ? 'company' : o.treeLevel === 1 ? 'dept' : 'team'
  return {
    id: String(o.id),
    name: o.name,
    code: o.code,
    type,
    leader: leaders[o.id % leaders.length],
    memberCount: (o.id * 17) % 200 + 5,
    status: o.orgUnitStatus === '0' ? 'active' : 'inactive',
    children: (o.children || []).map(toRow),
  }
}

const typeMeta: Record<OrgType, { label: string; color: 'brand' | 'info' | 'neutral'; icon: typeof Building2 }> = {
  company: { label: '公司', color: 'brand', icon: Building2 },
  dept: { label: '部门', color: 'info', icon: Users2 },
  team: { label: '小组', color: 'neutral', icon: UserSquare2 },
}

export function OrgUnit() {
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3']))
  const [reloadKey, setReloadKey] = useState(0)

  const { data, loading } = useApi<OrgUnitTreeResp>(
    () => (apiClient.GET as any)('/api/org/unit/tree', {}),
    [reloadKey],
  )
  const tree = (data?.data || []).map(toRow)

  const matches = (n: OrgRow) => !keyword || n.name.includes(keyword) || n.code.includes(keyword)
  const filterTree = (nodes: OrgRow[]): OrgRow[] =>
    nodes
      .map((n) => {
        const kids = filterTree(n.children)
        if (matches(n) || kids.length) return { ...n, children: kids }
        return null
      })
      .filter((x): x is OrgRow => x !== null)
  const rows = filterTree(tree)
  const flatCount = (ns: OrgRow[]): number => ns.reduce((s, n) => s + 1 + flatCount(n.children), 0)
  const shownTotal = flatCount(rows)

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  // —— 新增 / 编辑 / 删除 ——
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OrgRow | null>(null)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<OrgRow | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fields: CrudField[] = [
    { name: 'name', label: '机构名称', type: 'text', required: true, placeholder: '请输入机构名称', colSpan: 1 },
    { name: 'code', label: '机构编码', type: 'text', required: true, placeholder: '如 TECH-01', colSpan: 1 },
    { name: 'leader', label: '负责人', type: 'text', placeholder: '请输入负责人', colSpan: 1 },
    { name: 'memberCount', label: '成员数', type: 'number', placeholder: '整数', colSpan: 1 },
    { name: 'orgUnitStatus', label: '启用', type: 'switch', colSpan: 1 },
    { name: 'nodeDesc', label: '备注', type: 'textarea', placeholder: '机构说明', colSpan: 2 },
  ]

  const openCreate = () => { setEditing(null); setCreateParentId(null); setDialogOpen(true) }
  const openCreateChild = (id: string) => { setEditing(null); setCreateParentId(id); setDialogOpen(true) }
  const openEdit = (node: OrgRow) => { setEditing(node); setCreateParentId(null); setDialogOpen(true) }

  const dialogInitial = editing
    ? {
        name: editing.name,
        code: editing.code,
        leader: editing.leader,
        memberCount: editing.memberCount,
        orgUnitStatus: editing.status === 'active' ? '0' : '1',
        nodeDesc: '',
      }
    : undefined
  const dialogTitle = editing ? '编辑机构' : createParentId ? '新增子机构' : '新增机构'

  const handleSubmit = async (values: Record<string, any>) => {
    setSubmitting(true)
    try {
      const payload: any = editing
        ? { id: editing.id, ...values }
        : { parentId: createParentId ?? null, ...values }
      const res = await call(
        apiClient.POST(editing ? '/api/org/unit/edit' : '/api/org/unit/add', { body: payload } as any),
      )
      if (res.error) { toast.error(res.error.errorMsg || '保存失败'); return }
      toast.success(editing ? '已保存修改' : '已新增机构')
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
      const res = await call(apiClient.POST('/api/org/unit/delete', { body: { id: deleting.id } } as any))
      if (res.error) { toast.error(res.error.errorMsg || '删除失败'); return }
      toast.success('已删除机构')
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } finally {
      setConfirmLoading(false)
    }
  }

  const resetFilters = () => setKeyword('')
  const renderNode = (node: OrgRow, level: number) => {
    const hasChildren = node.children.length > 0
    const isOpen = expanded.has(node.id)
    const t = typeMeta[node.type]
    const Icon = t.icon
    return (
      <div key={node.id}>
        <TableRow className="hover:bg-muted/40">
          <TableCell style={{ paddingLeft: 12 + level * 20 }}>
            <div className="flex items-center gap-1.5">
              {hasChildren ? (
                <button onClick={() => toggle(node.id)} className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              ) : <span className="w-4" />}
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground text-sm">{node.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{node.code}</span>
            </div>
          </TableCell>
          <TableCell><Tag color={t.color}>{t.label}</Tag></TableCell>
          <TableCell className="text-sm text-muted-foreground">{node.leader}</TableCell>
          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{node.memberCount}</TableCell>
          <TableCell><StatusBadge status={node.status}>{node.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openCreateChild(node.id)}><UserPlus className="h-3.5 w-3.5" />新增子级</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(node)}><Pencil className="h-3.5 w-3.5" />编辑</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10" onClick={() => setDeleting(node)}><Trash2 className="h-3.5 w-3.5" />删除</Button>
          </TableCell>
        </TableRow>
        {hasChildren && isOpen && node.children.map((c) => renderNode(c, level + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="组织机构"
        description="维护集团 / 工厂 / 部门层级，支撑按组织的数据权限与人员归属"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />新增机构</Button>}
      />

      <SearchToolbar onSearch={() => setReloadKey((k) => k + 1)} onReset={resetFilters}>
        <Input
          placeholder="搜索机构名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个机构</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setReloadKey((k) => k + 1)}><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-56">机构名称</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-24">负责人</TableHead>
              <TableHead className="w-24 text-right">成员数</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 160 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">暂无机构数据</TableCell></TableRow>
            ) : (
              rows.map((n) => renderNode(n, 0))
            )}
          </TableBody>
        </Table>
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
        title="删除机构"
        description={`确定要删除机构「${deleting?.name}」吗？若存在下级将被一并移除。`}
        confirmText="删除"
        loading={confirmLoading}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default OrgUnit
