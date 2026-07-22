import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, StatusBadge, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Folder, SquareMenu, Command, Plus, RefreshCw, Pencil, Trash2, Lock, ChevronRight, ChevronDown } from 'lucide-react'
import { apiClient } from '@/utils/request'
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

export function MenuManagement() {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2']))

  const { data, loading } = useApi<components['schemas']['ResultVoListMenuDto']>(
    () => apiClient.POST('/api/menu/tree', { body: {} }),
    [],
  )
  const tree = (data?.data || []).map(toRow)

  const matches = (n: MenuRow) =>
    (type === 'all' || n.type === type) &&
    (status === 'all' || n.status === (status === '0' ? 'active' : 'inactive')) &&
    (!keyword || n.name.includes(keyword) || n.code.includes(keyword))

  const filterTree = (nodes: MenuRow[]): MenuRow[] =>
    nodes
      .map((n) => {
        const kids = filterTree(n.children)
        if (matches(n) || kids.length) return { ...n, children: kids }
        return null
      })
      .filter((x): x is MenuRow => x !== null)

  const rows = filterTree(tree)
  const flatCount = (ns: MenuRow[]): number => ns.reduce((s, n) => s + 1 + flatCount(n.children), 0)
  const shownTotal = flatCount(rows)

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  const renderNode = (node: MenuRow, level: number) => {
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
              {node.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
          </TableCell>
          <TableCell className="font-mono text-xs text-muted-foreground">{node.code}</TableCell>
          <TableCell><Tag color={t.color}>{t.label}</Tag></TableCell>
          <TableCell className="font-mono text-xs text-muted-foreground">{node.path}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{node.perm}</TableCell>
          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{node.order}</TableCell>
          <TableCell><StatusBadge status={node.status}>{node.status === 'active' ? '显示' : '隐藏'}</StatusBadge></TableCell>
          <TableCell className="text-right">
            <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="h-3.5 w-3.5" />编辑</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>
          </TableCell>
        </TableRow>
        {hasChildren && isOpen && node.children.map((c) => renderNode(c, level + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="菜单管理"
        description="配置平台菜单与功能权限点，支持目录 / 菜单 / 按钮三级结构"
        actions={<Button><Plus className="h-4 w-4" />新增菜单</Button>}
      />

      <SearchToolbar>
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

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个菜单项</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-48">菜单名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="min-w-40">路由</TableHead>
              <TableHead className="min-w-32">权限标识</TableHead>
              <TableHead className="w-20 text-right">排序</TableHead>
              <TableHead className="w-20">状态</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground">暂无菜单数据</TableCell></TableRow>
            ) : (
              rows.map((n) => renderNode(n, 0))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default MenuManagement
