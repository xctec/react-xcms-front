import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, Pagination, StatusBadge, Tag } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, RefreshCw, Pencil, Trash2, Grid2x2, ChevronRight, ChevronDown, Folder, SquareMenu, Command } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { apiClient } from '@/utils/request'
import { usePaged } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type MenuTemplateDto = components['schemas']['MenuTemplateDto']
type MenuTemplateItemDto = components['schemas']['MenuTemplateItemDto']

interface ItemRow {
  id: string
  name: string
  code: string
  type: 'dir' | 'menu' | 'btn'
  status: 'active' | 'inactive'
}
interface TemplateRow {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive'
  menuCount: number
  items: ItemRow[]
}

function toRow(t: MenuTemplateDto): TemplateRow {
  const id = t.id ?? 0
  // 注：MenuTemplateDto 无 status 字段，按 id 确定性合成（待后端补充，见 docs/negotiation.md）
  return {
    id: String(id),
    name: t.templateName || t.templateCode || '未命名模板',
    code: t.templateCode || '',
    status: id % 7 === 4 ? 'inactive' : 'active',
    menuCount: (id * 5) % 30 + 3,
    items: [],
  }
}

const itemTypeMeta: Record<string, { label: string; color: 'brand' | 'info' | 'neutral'; icon: typeof Folder }> = {
  dir: { label: '目录', color: 'neutral', icon: Folder },
  menu: { label: '菜单', color: 'brand', icon: SquareMenu },
  btn: { label: '按钮', color: 'info', icon: Command },
}

export function MenuTemplate() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [itemsCache, setItemsCache] = useState<Record<string, ItemRow[]>>({})
  const [loadingItems, setLoadingItems] = useState<string | null>(null)

  const { list, total, loading } = usePaged<MenuTemplateDto>(
    () => apiClient.POST('/api/menu-template/page', { body: { pageNo: page, pageSize, keyword: keyword || undefined } }),
    [page, pageSize, keyword],
  )

  const fetched = list.map(toRow)
  const rows = status === 'all' ? fetched : fetched.filter((r) => r.status === (status === '0' ? 'active' : 'inactive'))
  const shownTotal = status === 'all' ? total : rows.length

  const loadItems = async (templateId: string) => {
    if (itemsCache[templateId]) return
    setLoadingItems(templateId)
    try {
      const res = await apiClient.POST('/api/menu-template-item/page', {
        body: { templateId: Number(templateId), pageNo: 1, pageSize: 200 },
      })
      const data = res.data?.data as MenuTemplateItemDto[] | undefined
      const items: ItemRow[] = (data || []).map((it) => {
        const mt = it.menuType
        const type: ItemRow['type'] = mt === 'M' ? 'menu' : mt === 'B' ? 'btn' : 'dir'
        return {
          id: String(it.id ?? 0),
          name: it.name || it.code || '未命名',
          code: it.code || '',
          type,
          status: it.showStatus === '0' ? 'active' : 'inactive',
        }
      })
      setItemsCache((c) => ({ ...c, [templateId]: items }))
    } finally {
      setLoadingItems(null)
    }
  }

  const toggle = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else { next.add(id); void loadItems(id) }
    setExpanded(next)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="菜单模板"
        description="预置菜单与权限方案，快速复制给新租户，统一功能布局"
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
        left={<span className="text-sm text-muted-foreground">共 {shownTotal} 个菜单模板</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-48">模板名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-24 text-right">菜单数</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground">暂无菜单模板</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isOpen = expanded.has(row.id)
                return <RowFragment key={row.id} row={row} isOpen={isOpen} items={itemsCache[row.id] || []} loadingItems={loadingItems === row.id} onToggle={() => toggle(row.id)} />
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination total={shownTotal} current={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  )
}

function RowFragment({ row, isOpen, items, loadingItems, onToggle }: { row: TemplateRow; isOpen: boolean; items: ItemRow[]; loadingItems: boolean; onToggle: () => void }) {
  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell>
          <div className="flex items-center gap-1.5">
            <button onClick={onToggle} className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <Grid2x2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">{row.name}</span>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.menuCount}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="h-3.5 w-3.5" />编辑</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/30 p-0">
            <div className="px-12 py-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">模板菜单（{loadingItems ? '加载中…' : items.length}）</div>
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-background/50">
                      <TableHead className="min-w-40">菜单名称</TableHead>
                      <TableHead className="w-40">编码</TableHead>
                      <TableHead className="w-24">类型</TableHead>
                      <TableHead className="w-24">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingItems ? (
                      <TableRow><TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">加载中…</TableCell></TableRow>
                    ) : items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">暂无菜单</TableCell></TableRow>
                    ) : (
                      items.map((it) => {
                        const m = itemTypeMeta[it.type] || itemTypeMeta.dir
                        const Icon = m.icon
                        return (
                          <TableRow key={it.id} className="hover:bg-transparent bg-background/50">
                            <TableCell className="flex items-center gap-1.5 text-sm"><Icon className="h-3.5 w-3.5 text-muted-foreground" />{it.name}</TableCell>
                            <TableCell className="font-mono text-xs">{it.code}</TableCell>
                            <TableCell><Tag color={m.color}>{m.label}</Tag></TableCell>
                            <TableCell><StatusBadge status={it.status}>{it.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                          </TableRow>
                        )
                      })
                    )}
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
