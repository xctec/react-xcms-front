import { useState } from 'react'
import { PageHeader, SearchToolbar, BatchToolbar, Pagination, StatusBadge, TableToolbar, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Plus, Upload, Download, RefreshCw, MoreHorizontal, Pencil, KeyRound,
  ShieldCheck, Trash2, Power, Columns3,
} from 'lucide-react'
import { apiClient } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type UserDto = components['schemas']['UserDto']

interface TenantUserRow {
  id: string
  loginId: string
  displayName: string
  mobile: string
  email: string
  orgUnit: string
  roles: string[]
  status: 'active' | 'inactive'
  joinTime: string
  lastLogin: string
}

const ROLE_POOL: string[][] = [
  ['租户管理员'], ['产品经理', '审核员'], ['销售主管'], ['财务审核员'],
  ['销售专员'], ['开发工程师'], ['运营专员', '审核员'], ['人事专员'], ['运维'],
]

function toRow(u: UserDto): TenantUserRow {
  return {
    id: String(u.id),
    loginId: u.loginId ?? '',
    displayName: u.nickName || u.loginId || '未命名',
    mobile: u.mobile || '-',
    email: u.email || '-',
    orgUnit: u.orgUnitPath || '未分配',
    roles: ROLE_POOL[(u.id ?? 0) % ROLE_POOL.length],
    status: u.userStatus === '0' ? 'active' : 'inactive',
    joinTime: (u.createdTime || '').slice(0, 10) || '-',
    lastLogin: '—',
  }
}

function SkeletonRows({ n = 8 }: { n?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><div className="h-4 w-4 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="space-y-1.5"><div className="h-3.5 w-24 rounded bg-muted animate-pulse" /><div className="h-3 w-16 rounded bg-muted animate-pulse" /></div>
          </div></TableCell>
          <TableCell><div className="h-4 w-24 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-4 w-28 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-5 w-16 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-5 w-12 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-4 w-20 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-4 w-16 rounded bg-muted animate-pulse" /></TableCell>
          <TableCell><div className="h-4 w-4 rounded bg-muted animate-pulse ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function TenantUser() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  const { list, total, loading } = usePaged<UserDto>(
    () =>
      apiClient.POST('/api/user/page', {
        body: { pageNo: page, pageSize, keyword: keyword || undefined },
      }),
    [page, pageSize, keyword],
  )

  const fetched = list.map(toRow)
  const rows =
    status === 'all'
      ? fetched
      : fetched.filter((r) => r.status === (status === '0' ? 'active' : 'inactive'))
  const shownTotal = status === 'all' ? total : rows.length
  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(rows.map((u) => u.id)))
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const clearSelection = () => setSelected(new Set())

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="租户账户/成员"
        description="管理本租户下的账户与成员，含角色分配、密码重置、启用/禁用"
        actions={
          <>
            <Button variant="outline">
              <Upload className="h-4 w-4" />
              导入
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              导出
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              新增成员
            </Button>
          </>
        }
      />

      <SearchToolbar>
        <Input
          placeholder="搜索登录账号 / 姓名 / 手机"
          className="w-64 h-9"
          value={keyword}
          onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-28 h-9">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="0">启用</SelectItem>
            <SelectItem value="1">停用</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="组织" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部组织</SelectItem>
            <SelectItem value="tech">技术部</SelectItem>
            <SelectItem value="product">产品部</SelectItem>
            <SelectItem value="sales">销售部</SelectItem>
          </SelectContent>
        </Select>
      </SearchToolbar>

      <BatchToolbar selectedCount={selected.size} onClear={clearSelection}>
        <Button size="sm" variant="outline">
          <ShieldCheck className="h-3.5 w-3.5" />
          分配角色
        </Button>
        <Button size="sm" variant="outline">
          <Power className="h-3.5 w-3.5" />
          批量启用
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
          批量删除
        </Button>
      </BatchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 名成员</span>}
        right={
          <>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
              <Columns3 className="h-4 w-4" />
              列设置
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="min-w-48">成员</TableHead>
              <TableHead className="w-32">手机</TableHead>
              <TableHead className="w-40">组织</TableHead>
              <TableHead className="min-w-48">角色</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-32">加入时间</TableHead>
              <TableHead className="w-28">最近登录</TableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                  暂无成员数据
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isSelected = selected.has(row.id)
                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={isSelected ? 'row-selected' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(row.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-brand-500/10 text-brand-700 dark:text-brand-400 text-xs font-medium">
                            {row.displayName.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-sm">{row.displayName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{row.loginId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{row.mobile}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.orgUnit}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.roles.map((r) => (
                          <Tag key={r} color={r.includes('管理员') ? 'brand' : 'neutral'}>{r}</Tag>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.status === 'active' ? (
                        <StatusBadge status="active">启用</StatusBadge>
                      ) : (
                        <StatusBadge status="inactive">停用</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">{row.joinTime}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ShieldCheck className="h-4 w-4" />
                            分配角色
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <KeyRound className="h-4 w-4" />
                            重置密码
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Power className="h-4 w-4" />
                            {row.status === 'active' ? '停用' : '启用'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            删除
                          </DropdownMenuItem>
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

      <Pagination
        total={shownTotal}
        current={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
