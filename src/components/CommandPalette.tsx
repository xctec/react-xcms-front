import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { ALL_NAV_ITEMS } from '@/lib/navigation'
import { BRAND_PRESETS } from '@/lib/brand'
import { useTheme } from 'next-themes'
import { useXcmsTheme } from '@/lib/theme'
import { Compass, Sun, Moon, Monitor, Zap, CornerDownLeft, LogOut } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (page: string) => void
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const { setTheme } = useTheme()
  const { brand, setBrand } = useXcmsTheme()

  const close = () => onOpenChange(false)

  const handleNavigate = (page: string) => {
    onNavigate(page)
    close()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="搜索菜单、操作或主题..." />
      <CommandList>
        <CommandEmpty>未找到匹配项，按 Enter 全局搜索</CommandEmpty>

        {/* 导航 */}
        <CommandGroup heading="导航">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.id} ${item.page} 导航 跳转 goto navigate`}
                onSelect={() => handleNavigate(item.page)}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
                {!item.ready && (
                  <span className="ml-auto text-[10px] text-muted-foreground/50">设计待完成</span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* 外观 */}
        <CommandGroup heading="外观">
          <CommandItem
            value="亮色 浅色 light theme 主题 外观 切换"
            onSelect={() => { setTheme('light'); close() }}
          >
            <Sun className="h-4 w-4 text-muted-foreground" />
            <span>切换到亮色模式</span>
          </CommandItem>
          <CommandItem
            value="暗色 深色 dark theme 主题 外观 切换"
            onSelect={() => { setTheme('dark'); close() }}
          >
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span>切换到暗色模式</span>
          </CommandItem>
          <CommandItem
            value="跟随系统 system auto theme 主题 外观"
            onSelect={() => { setTheme('system'); close() }}
          >
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span>跟随系统主题</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* 主色 */}
        <CommandGroup heading="主色调">
          {BRAND_PRESETS.map((b) => (
            <CommandItem
              key={b.id}
              value={`主色 ${b.label} ${b.id} color 颜色 换色 brand`}
              onSelect={() => { setBrand(b.id); close() }}
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: b.swatch }}
              />
              <span>主色：{b.label}</span>
              {brand === b.id && (
                <span className="ml-auto text-[10px] text-muted-foreground">当前</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* 操作 */}
        <CommandGroup heading="操作">
          <CommandItem
            value="刷新 refresh reload 刷新页面"
            onSelect={() => window.location.reload()}
          >
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>刷新当前页</span>
          </CommandItem>
          <CommandItem
            value="折叠 侧边栏 sidebar toggle 收起"
            onSelect={() => {
              window.dispatchEvent(new CustomEvent('xcms:toggle-sidebar'))
              close()
            }}
          >
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span>折叠/展开侧边栏</span>
            <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              ⌘B
            </kbd>
          </CommandItem>
          <CommandItem
            value="退出登录 logout 登出 切换账号"
            onSelect={() => { onNavigate('login'); close() }}
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <span>退出登录</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* 底部提示 */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 rounded bg-muted">↑</kbd>
            <kbd className="font-mono px-1 py-0.5 rounded bg-muted">↓</kbd>
            选择
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 rounded bg-muted">↵</kbd>
            执行
          </span>
        </div>
        <span className="flex items-center gap-1">
          <CornerDownLeft className="h-3 w-3" />
          XCMS Command
        </span>
      </div>
    </CommandDialog>
  )
}
