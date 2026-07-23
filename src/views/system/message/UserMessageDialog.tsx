import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Message } from './index'

interface UserMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 嵌入场景传入的租户成员ID，用于筛选接收人；不传则展示全部消息 */
  tenantUserId?: number
}

/** 将「用户消息管理」以弹框形式嵌入其它页面（如通知管理）。 */
export function UserMessageDialog({ open, onOpenChange, tenantUserId }: UserMessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 py-3 border-b">
          <DialogTitle>
            {tenantUserId != null ? `用户消息管理 · 租户成员 #${tenantUserId}` : '用户消息管理'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <Message tenantUserId={tenantUserId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
