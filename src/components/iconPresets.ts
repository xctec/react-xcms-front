import type { LucideIcon } from 'lucide-react'
import {
  Ban,
  Bell,
  Book,
  Boxes,
  Building2,
  CircleHelp,
  Database,
  Download,
  File,
  Fingerprint,
  Group,
  KeyRound,
  Layers,
  LayoutDashboard,
  List,
  LogIn,
  Menu,
  Network,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react'

/**
 * 预设图标表（kebab-case 名 -> 同步组件）。
 *
 * 这些图标在编译期被「静态导入」并随 AppLayout chunk 一起打进主框架包，
 * 菜单渲染时零额外请求、无 Suspense 闪烁。覆盖：
 *   - 内置静态菜单（工作区 / 个人中心）：layout-dashboard / user / settings / bell
 *   - 后端动态菜单（/api/frame/menu）下发的全部图标名（见 menu 配置表）
 *   - 兜底图标：circle-help
 *
 * 若后端新增了表外的图标名，resolveIcon 会自动走 lucide 动态兜底；
 * 若要将其转为同步加载，在此追加一行对应导入与映射即可。
 */
export const ICON_PRESETS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  'user': User,
  'settings': Settings,
  'bell': Bell,
  'circle-help': CircleHelp,
  'users': Users,
  'search': Search,
  'plus': Plus,
  'pencil': Pencil,
  'trash-2': Trash2,
  'power': Power,
  'user-check': UserCheck,
  'key-round': KeyRound,
  'upload': Upload,
  'download': Download,
  'shield-check': ShieldCheck,
  'network': Network,
  'menu': Menu,
  'book': Book,
  'list': List,
  'group': Group,
  'log-in': LogIn,
  'file': File,
  'server': Server,
  'building-2': Building2,
  'refresh-cw': RefreshCw,
  'layers': Layers,
  'database': Database,
  'fingerprint': Fingerprint,
  'ban': Ban,
  'user-cog': UserCog,
  'boxes': Boxes,
}
