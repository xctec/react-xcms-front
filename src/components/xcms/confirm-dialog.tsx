import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title = '确认操作',
  description,
  confirmText = '确定',
  cancelText = '取消',
  danger = true,
  loading,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {danger && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
