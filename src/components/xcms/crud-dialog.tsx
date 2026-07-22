import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type CrudFieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch'

export interface CrudField {
  name: string
  label: string
  type: CrudFieldType
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string | number }[]
  disabled?: boolean
  defaultValue?: string | number | boolean
  colSpan?: 1 | 2
  help?: string
}

export interface CrudDialogProps {
  open: boolean
  title: string
  description?: string
  fields: CrudField[]
  initialValues?: Record<string, any>
  submitting?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: Record<string, any>) => void
}

function initialForField(f: CrudField, values?: Record<string, any>): any {
  if (values && values[f.name] !== undefined && values[f.name] !== null) return values[f.name]
  if (f.defaultValue !== undefined) return f.defaultValue
  if (f.type === 'switch') return false
  if (f.type === 'number') return ''
  return ''
}

export function CrudDialog({
  open,
  title,
  description,
  fields,
  initialValues,
  submitting,
  onOpenChange,
  onSubmit,
}: CrudDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    const init: Record<string, any> = {}
    fields.forEach((f) => {
      init[f.name] = initialForField(f, initialValues)
    })
    setValues(init)
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const setField = (name: string, v: any) => {
    setValues((prev) => ({ ...prev, [name]: v }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = () => {
    const errs: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.required && f.type !== 'switch') {
        const v = values[f.name]
        if (v === '' || v === null || v === undefined) errs[f.name] = `${f.label}不能为空`
      }
    })
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 py-1">
          {fields.map((f) => (
            <div
              key={f.name}
              className={cn('space-y-1.5', f.colSpan === 2 && 'col-span-2')}
            >
              <Label htmlFor={f.name}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {renderField(f, values, setField, errors)}
              {f.help && !errors[f.name] && (
                <p className="text-[11px] text-muted-foreground/70">{f.help}</p>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function renderField(
  f: CrudField,
  values: Record<string, any>,
  setField: (name: string, v: any) => void,
  errors: Record<string, string>
) {
  const err = errors[f.name]
  const v = values[f.name]

  if (f.type === 'textarea') {
    return (
      <Textarea
        id={f.name}
        value={v ?? ''}
        disabled={f.disabled}
        placeholder={f.placeholder}
        onChange={(e) => setField(f.name, e.target.value)}
        className={cn(err && 'border-destructive')}
        rows={3}
      />
    )
  }

  if (f.type === 'switch') {
    return (
      <div className="flex h-9 items-center gap-2">
        <Switch
          id={f.name}
          checked={v === '0' || v === true}
          disabled={f.disabled}
          onCheckedChange={(c) => setField(f.name, c ? '0' : '1')}
        />
        <span className="text-sm text-muted-foreground">{v === '0' || v === true ? '开启' : '关闭'}</span>
      </div>
    )
  }

  if (f.type === 'select') {
    return (
      <Select value={v === '' || v === undefined ? undefined : String(v)} onValueChange={(val) => setField(f.name, val)}>
        <SelectTrigger id={f.name} className={cn('w-full', err && 'border-destructive')} disabled={f.disabled}>
          <SelectValue placeholder={f.placeholder ?? `请选择${f.label}`} />
        </SelectTrigger>
        <SelectContent>
          {(f.options ?? []).map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      id={f.name}
      type={f.type === 'number' ? 'number' : 'text'}
      value={v ?? ''}
      disabled={f.disabled}
      placeholder={f.placeholder}
      onChange={(e) => setField(f.name, f.type === 'number' ? e.target.value : e.target.value)}
      className={cn(err && 'border-destructive')}
    />
  )
}
