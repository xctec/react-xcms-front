export type BrandPreset = 'indigo' | 'blue' | 'emerald' | 'violet' | 'orange'

export interface BrandOption {
  id: BrandPreset
  label: string
  swatch: string
}

export const BRAND_PRESETS: BrandOption[] = [
  { id: 'indigo', label: '靛蓝', swatch: '#6366F1' },
  { id: 'blue', label: '品牌蓝', swatch: '#3B82F6' },
  { id: 'emerald', label: '翠绿', swatch: '#10B981' },
  { id: 'violet', label: '紫罗兰', swatch: '#8B5CF6' },
  { id: 'orange', label: '暖橙', swatch: '#F97316' },
]

export const DEFAULT_BRAND: BrandPreset = 'indigo'
