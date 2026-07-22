import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useXcmsTheme } from '@/theme'
import { BRAND_PRESETS } from '@/theme'
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const THEME_OPTIONS = [
  { id: 'light', label: '亮色', icon: Sun },
  { id: 'dark', label: '暗色', icon: Moon },
  { id: 'system', label: '系统', icon: Monitor },
] as const

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { brand, setBrand } = useXcmsTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3" sideOffset={8}>
        {/* 外观模式 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">外观模式</div>
          <div className="grid grid-cols-3 gap-1.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = mounted && theme === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 rounded-md text-xs transition-colors border',
                    active
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30 font-medium'
                      : 'text-muted-foreground hover:bg-muted border-transparent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 主色调 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground">主色调</div>
            <span className="text-[10px] text-muted-foreground/60">
              {BRAND_PRESETS.find((b) => b.id === brand)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {BRAND_PRESETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                title={b.label}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110',
                  brand === b.id && 'ring-2 ring-offset-2 ring-offset-background ring-foreground/30'
                )}
                style={{ backgroundColor: b.swatch }}
              >
                {brand === b.id && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
