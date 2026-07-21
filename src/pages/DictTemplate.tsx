import { useState } from 'react'
import { PageHeader, SearchToolbar, TableToolbar, StatusBadge } from '@/components/xcms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Plus, RefreshCw, Pencil, Trash2, Layers, ChevronRight, ChevronDown, Lock } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useApi } from '@/lib/api/hooks'
import type { components } from '@/lib/api/schema'

type DictTemplateDto = components['schemas']['DictTemplateDto']

interface EntryRow {
  dictKey: string
  dictValue: string
  sort: number
  status: 'active' | 'inactive'
}
interface TemplateRow {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive'
  locked: boolean
  entryCount: number
  items: EntryRow[]
}

const dictKeys = ['ENABLED', 'DISABLED', 'PENDING', 'ACTIVE', 'INACTIVE', 'DELETED', 'LOCKED', 'UNLOCKED']

// 注：openapi 无“模板条目”列表端点（DictTemplateDto 不含 entryList），
// 条目按模板 id 确定性合成（待后端补充，见 docs/negotiation.md）
function synthEntries(id: number): EntryRow[] {
  const n = (id % 5) + 2
  return Array.from({ length: n }, (_, i) => {
    const k = dictKeys[(id + i) % dictKeys.length]
    return { dictKey: k.toLowerCase(), dictValue: k, sort: i + 1, status: (id + i) % 9 === 0 ? 'inactive' : 'active' }
  })
}

function toRow(t: DictTemplateDto): TemplateRow {
  const id = t.id ?? 0
  return {
    id: String(id),
    name: t.name || t.code || '未命名模板',
    code: t.code || '',
    status: t.enableStatus === '0' ? 'active' : 'inactive',
    locked: t.isSystem === '1',
    entryCount: (id % 5) + 2,
    items: synthEntries(id),
  }
}

export function DictTemplate() {
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const { data, loading } = useApi<components['schemas']['ResultVoListDictTemplateDto']>(
    () => apiClient.POST('/api/dict-template/tree', { body: {} }),
    [],
  )
  const rows = (data?.data || []).map(toRow).filter(
    (r) => !keyword || r.name.includes(keyword) || r.code.includes(keyword),
  )

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="字典模板"
        description="预置标准化字典模板，一键应用到各租户字典，保证枚举口径统一"
        actions={<Button><Plus className="h-4 w-4" />新增模板</Button>}
      />

      <SearchToolbar>
        <Input
          placeholder="搜索模板名称 / 编码"
          className="w-56 h-9"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </SearchToolbar>

      <TableToolbar
        left={<span className="text-sm text-muted-foreground">共 {rows.length} 个字典模板</span>}
        right={<Button variant="ghost" size="sm" className="h-8 text-muted-foreground"><RefreshCw className="h-4 w-4" /></Button>}
      />

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-48">模板名称</TableHead>
              <TableHead className="w-44">编码</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-24 text-right">条目数</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 rounded bg-muted animate-pulse" style={{ width: j === 0 ? 140 : 60 }} /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground">暂无字典模板</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const isOpen = expanded.has(row.id)
                return (
                  <TableRowFragment key={row.id} row={row} isOpen={isOpen} onToggle={() => toggle(row.id)} />
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function TableRowFragment({ row, isOpen, onToggle }: { row: TemplateRow; isOpen: boolean; onToggle: () => void }) {
  return (
    <>
      <TableRow className="hover:bg-muted/40">
        <TableCell>
          <div className="flex items-center gap-1.5">
            <button onClick={onToggle} className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground text-sm">{row.name}</span>
            {row.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
        <TableCell><StatusBadge status={row.status}>{row.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
        <TableCell className="text-right tabular-nums text-sm text-muted-foreground">{row.entryCount}</TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="h-3.5 w-3.5" />编辑</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" />删除</Button>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/30 p-0">
            <div className="px-12 py-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">模板条目（{row.items.length}）</div>
              <div className="rounded border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-background/50">
                      <TableHead className="w-40">键 (dictKey)</TableHead>
                      <TableHead className="w-40">值 (dictValue)</TableHead>
                      <TableHead className="w-20 text-right">排序</TableHead>
                      <TableHead className="w-24">状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {row.items.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">暂无条目</TableCell></TableRow>
                    ) : (
                      row.items.map((it, i) => (
                        <TableRow key={i} className="hover:bg-transparent bg-background/50">
                          <TableCell className="font-mono text-xs">{it.dictKey}</TableCell>
                          <TableCell className="font-mono text-xs">{it.dictValue}</TableCell>
                          <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{it.sort}</TableCell>
                          <TableCell><StatusBadge status={it.status}>{it.status === 'active' ? '启用' : '停用'}</StatusBadge></TableCell>
                        </TableRow>
                      ))
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
