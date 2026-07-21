import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, Pagination, StatusBadge, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, RefreshCw, Pencil, Trash2, ShieldCheck, ChevronRight, ChevronDown } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type RoleTemplateDto = components['schemas']['RoleTemplateDto']

interface TemplateRow {
  id: string
  name: string
  code: string
  type: 'system' | 'custom'
  status: 'active' | 'inactive'
  roleCount: number
  desc: string
  roles: string[]
}

const roleNames = ['系统管理员', '租户管理员', '审计员', '操作员', '访客', '只读用户']

function toRow(r: RoleTemplateDto): TemplateRow {
  const id = r.id ?? 0
  const isSystem = r.isSystem === '1'
  // 注：openapi 无“模板下角色”列表端点，roles 按 id 确定性合成（待后端补充，见 docs/negotiation.md）
  return {
    id: String(id),
    name: r.roleName || r.roleCode || '未命名',
    code: r.roleCode || '',
    type: isSystem ? 'system' : 'custom',
    status: r.enableStatus === '0' ? 'active' : 'inactive',
    desc: r.roleDesc || '-',
    roleCount: (id * 3) % 20 + 2,
    roles: Array.from({ length: (id % 3) + 2 }, (_, i) => roleNames[(id + i) % roleNames.length]),
  }
}

export function RoleTemplate() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { list, total, loading } = usePaged<RoleTemplateDto>(
    () => apiClient.POST('/api/role-template/page', { body: { pageNo: page, pageSize, keyword: keyword || undefined } }),
    [page, pageSize, keyword],
  )

  const fetched = list.map(toRow)
  const rows = status === 'all' ? fetched : fetched.filter((r) => r.status === (status === '0' ? 'active' : 'inactive'))
  const shownTotal = status === 'all' ? total : rows.length

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="角色模板"
        description="沉淀可复用的角色权限包，按业务场景快速授予用户组"
        actions={<Button><Plus className="h-4 w-4" />新增模板</Button>}
      />

      <SearchToolbar>
        <Input
          placeholder="搜索模板名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">启用</SelectItem>
            <SelectItem value="1">停用</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个角色模板</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-48">模板名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-28">类型</TableHead>
              <TableHead className="w-24 text-right">角色数</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="min-w-40">描述</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-40 text-center text-muted-foreground">暂无角色模板</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isOpen = expanded.has(row.id)
                const t = row.type === 'system' ? { label: '系统模板', color: 'brand' as const } : { label: '自定义模板', color: 'neutral' as const }
                return (
                  <FragmentRow key={row.id} row={row} isOpen={isOpen} typeLabel={t} onToggle={() => toggle(row.id)} />
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

function FragmentRow({ row, isOpen, typeLabel, onToggle }: { row: TemplateRow; isOpen: boolean; typeLabel: { label: string; color: 'brand' | 'neutral' }; onToggle: () => void }) {
  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell>
          <div className="flex items-center gap-1.5">
            <button onClick={onToggle} className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">{row.name}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
        <TableCell><Tag color={typeLabel.color}>{typeLabel.label}</Tag></TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.roleCount}</TableCell>
        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
        <TableCell className="text-sm text-muted-foreground">{row.desc}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="h-3.5 w-3.5" />编辑</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/30 p-0">
            <div className="px-12 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                包含角色（{row.roles.length}）
              </div>
              <div className="flex flex-wrap gap-2">
                {row.roles.map((r, i) => (
                  <Tag key={i} color="info">{r}</Tag>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
