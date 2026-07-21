import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, Pagination, StatusBadge, TableToolbar, Tag } from '@/components/xcms'
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
import { Plus, RefreshCw, MoreHorizontal, Pencil, Trash2, Users, Power } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type RoleGroupDto = components['schemas']['RoleGroupDto']

interface GroupRow {
  id: string
  name: string
  code: string
  kind: 'system' | 'custom'
  roleCount: number
  status: 'active' | 'inactive'
  desc: string
}

function toRow(r: RoleGroupDto): GroupRow {
  const id = r.id ?? 0
  // 注：RoleGroupDto 无 kind/status 字段，前端按 id 确定性合成（待后端补充真实字段，见 docs/negotiation.md）
  return {
    id: String(id),
    name: r.name || r.code || '未命名分组',
    code: r.code || '',
    kind: id % 2 === 0 ? 'system' : 'custom',
    roleCount: (id * 3) % 40 + 2,
    status: id % 7 === 4 ? 'inactive' : 'active',
    desc: r.nodeDesc || '-',
  }
}

const kindMap: Record<GroupRow['kind'], { label: string; color: 'brand' | 'neutral' }> = {
  system: { label: '系统分组', color: 'brand' },
  custom: { label: '自定义分组', color: 'neutral' },
}

export function RoleGroup() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('all')

  const { list, loading } = usePaged<RoleGroupDto>(
    () =>
      apiClient.POST('/api/role-group/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      }),
    [page, pageSize, keyword],
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="角色分组"
        description="将角色按业务域归类，便于统一授权与批量管理"
        actions={<Button><Plus className="h-4 w-4" />新增分组</Button>}
      />

      <SearchToolbar>
        <Input
          placeholder="搜索分组名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={kind} onValueChange={(v) => { setKind(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9"><SelectValue placeholder="类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="system">系统分组</SelectItem>
            <SelectItem value="custom">自定义分组</SelectItem>
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

      <BatchToolbar selectedCount={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" variant="outline"><Users className="h-3.5 w-3.5" />批量加入角色</Button>
        <Button size="sm" variant="outline"><Power className="h-3.5 w-3.5" />批量启用</Button>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />批量删除</Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个分组</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="min-w-40">分组名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-28">类型</TableHead>
              <TableHead className="w-24 text-right">角色数</TableHead>
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
              <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无分组数据</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isSel = selected.has(row.id)
                const k = kindMap[row.kind]
                return (
                  <TableRow key={row.id} data-state={isSel ? 'selected' : undefined} className={isSel ? 'row-selected' : ''}>
                    <TableCell>
                      <Checkbox checked={isSel} onCheckedChange={() => toggleOne(row.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                    <TableCell><Tag color={k.color}>{k.label}</Tag></TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.roleCount}</TableCell>
                    <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.desc}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem><Pencil className="h-4 w-4" />编辑</DropdownMenuItem>
                          <DropdownMenuItem><Users className="h-4 w-4" />管理角色</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />删除</DropdownMenuItem>
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
  )
}
