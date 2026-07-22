import { useState } from 'react'
import { PageHeader, StatusBadge, TableToolbar, Tag } from '@/components/xcms'
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
  Plus, Search, ChevronRight, ChevronDown, RefreshCw, MoreHorizontal,
  Pencil, Trash2, Lock, BookOpen, PencilLine,
} from 'lucide-react'
import { apiClient } from '@/utils/request'
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

export function DictType() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']))
  const [keyword, setKeyword] = useState('')

  const { list, loading } = usePaged<DictTypeDto>(
    () => apiClient.POST('/api/dict/type/page', { body: { pageNo: 1, pageSize: 100, keyword: keyword || undefined } }),
    [keyword],
  )
  const rows = list.map(toRow)

  const toggle = (id: string) => {
    const next = new Set(expandedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpandedIds(next)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="字典类型"
        description="维护数据字典类型，点击行展开可管理字典项；系统字典(锁定)只读"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            新增字典
          </Button>
        }
      />

      <TableToolbar
        left={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索字典编码 / 名称"
              className="h-8 pl-8 w-64 text-sm"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        }
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
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
                  />
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function DictTypeRowItem({
  row,
  isExpanded,
  onToggle,
  tagColorMap,
}: {
  row: DictTypeRow
  isExpanded: boolean
  onToggle: () => void
  tagColorMap: Record<DictEntry['tagType'], string>
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
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.entryCount}</TableCell>
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
              <DropdownMenuItem disabled={row.locked}>
                <Pencil className="h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" disabled={row.locked}>
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
                  <Tag color="brand">{row.entries.length} 项</Tag>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={row.locked}>
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
                    {row.entries.map((entry) => (
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={entry.locked}>
                              <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={entry.locked}>
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
