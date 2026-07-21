import schemas from './schemas.json'

/* ----------------------------- 工具函数 ----------------------------- */

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 基于种子的确定性伪随机数（LCG），保证同一端点多次请求数据稳定 */
export function makeRng(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const refName = (ref?: string): string | undefined =>
  ref ? ref.split('/').pop() : undefined

const CN_NAMES = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵磊', '黄敏', '周强', '吴婷', '孙悦', '马超']
const DEPTS = ['研发中心', '平台运营中心', '财务部', '人力资源部', '市场部', '运维保障部', '客户成功部']
const TENANTS = ['云栖科技', '瀚海集团', '星河网络', '远方物流', '智联教育']

interface Ctx {
  rng: () => number
  index?: number
  id?: string | number
  total?: number
  pageSize?: number
  pageNum?: number
  listLen?: number
  depth?: number
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function sampleString(name: string, ctx: Ctx): string {
  const n = name.toLowerCase()
  if (n.includes('email')) return `user${(ctx.index ?? 0) + 1}@xcms.io`
  if (n.includes('mobile') || n.includes('phone')) return '138' + String(10000000 + Math.floor(ctx.rng() * 89999999)).slice(0, 8)
  if (n === 'loginid' || n.includes('username') || n.includes('login')) return 'admin' + ((ctx.index ?? 0) + 1)
  if (n.includes('nickname') || n.includes('realname')) return pick(CN_NAMES, ctx.rng)
  if (n === 'name' && (n.includes('dept') || n.includes('org') || n.includes('tenant') || n.includes('role') || n.includes('menu')))
    return pick([...DEPTS, ...TENANTS], ctx.rng)
  if (n.includes('deptname') || n.includes('orgname')) return pick(DEPTS, ctx.rng)
  if (n.includes('tenantname')) return pick(TENANTS, ctx.rng)
  if (n.includes('rolename')) return pick(['超级管理员', '租户管理员', '普通用户', '审计员'], ctx.rng)
  if (n.includes('menuname')) return pick(['系统管理', '用户管理', '角色管理', '字典管理', '日志审计'], ctx.rng)
  if (n.endsWith('time') || n.includes('date') || n.includes('time')) {
    const base = Date.now() - Math.floor(ctx.rng() * 1000 * 3600 * 24 * 30)
    return new Date(base).toISOString().slice(0, 19).replace('T', ' ')
  }
  if (n.includes('remark') || n.includes('description') || n.includes('comment')) return '示例备注信息'
  if (n.includes('url') || n.includes('avatar') || n.includes('icon') || n.includes('image') || n.includes('logo') || n.includes('picture'))
    return `https://picsum.photos/seed/${Math.floor(ctx.rng() * 1000)}/80`
  if (n.includes('address')) return '北京市海淀区中关村大街 1 号'
  if (n.includes('code') || n === 'no' || n.includes('serial')) return 'XCMS' + String(Math.floor(ctx.rng() * 9000) + 1000)
  if (n.includes('token') || n.includes('secret') || n.includes('password') || n.includes('credential')) return '******'
  if (n === 'name') return pick(DEPTS, ctx.rng)
  return '文本' + ((ctx.index ?? 0) + 1)
}

function genProp(p: any, name: string, ctx: Ctx): any {
  if (p == null) return null
  if (p.$ref) return genSchema(refName(p.$ref)!, { ...ctx, depth: (ctx.depth ?? 0) + 1 })
  if (Array.isArray(p.enum) && p.enum.length) return p.enum[Math.floor(ctx.rng() * p.enum.length)]
  if (p.type === 'array' || p.items) {
    const itemRef = p.items?.$ref
    if (itemRef) {
      const n = ctx.listLen ?? 3 + Math.floor(ctx.rng() * 5)
      return Array.from({ length: n }, (_, i) => genSchema(refName(itemRef)!, { ...ctx, index: i, depth: (ctx.depth ?? 0) + 1 }))
    }
    const it = p.items?.type
    if (it === 'string') return ['示例A', '示例B']
    if (it === 'integer' || it === 'number') return [1, 2, 3]
    return []
  }
  if (p.type === 'object' || p.additionalProperties) return genObject(p, ctx)
  if (p.type === 'boolean') return ctx.rng() > 0.5
  if (p.type === 'integer' || p.type === 'number') {
    if (name === 'id' && ctx.id != null) return Number(ctx.id)
    if (/(^|[^a-z])id$/i.test(name)) return (ctx.index ?? 0) + 1
    if (name === 'total') return ctx.total ?? 57
    if (name === 'size' || name === 'pageSize') return ctx.pageSize ?? 10
    if (name === 'current' || name === 'pageNum' || name === 'page') return ctx.pageNum ?? 1
    if (name === 'pages') return Math.max(1, Math.ceil((ctx.total ?? 57) / (ctx.pageSize ?? 10)))
    if (name === 'orderNum' || name === 'sort') return (ctx.index ?? 0) + 1
    if (name === 'delFlag') return 0
    if (name.endsWith('Status') || name === 'status') return Math.floor(ctx.rng() * 2)
    return Math.floor(ctx.rng() * 1000)
  }
  if (p.type === 'string') return sampleString(name, ctx)
  return null
}

function genObject(sch: any, ctx: Ctx): Record<string, any> {
  const props = sch?.properties || {}
  const out: Record<string, any> = {}
  for (const [k, p] of Object.entries(props)) out[k] = genProp(p, k, ctx)
  if (sch?.additionalProperties && Object.keys(props).length === 0) {
    const v = typeof sch.additionalProperties === 'object' ? (sch.additionalProperties.type === 'string' ? '值' : 1) : '值'
    out['示例键'] = v
  }
  return out
}

export function genSchema(name: string, ctx: Ctx): any {
  const sch = (schemas as Record<string, any>)[name]
  if (!sch) return {}
  if ((ctx.depth ?? 0) > 5) return {}
  return genObject(sch, ctx)
}

function genPage(itemRef: string | undefined, ctx: Ctx, pageParams: { pageNum: number; pageSize: number }) {
  const total = ctx.total ?? 57
  const all = Array.from({ length: total }, (_, i) =>
    genSchema(itemRef!, { ...ctx, index: i, id: i + 1 }),
  )
  const pageNum = pageParams.pageNum || 1
  const pageSize = pageParams.pageSize || 10
  const start = (pageNum - 1) * pageSize
  return { total, data: all.slice(start, start + pageSize) }
}

function vo(data: any) {
  return { errorNo: '0', errorMsg: 'success', data }
}

/** 根据响应 schema 名（ResultVo*）生成完整响应体 */
export function genResultVo(
  respRef: string | null | undefined,
  ctx: Ctx,
  pageParams: { pageNum: number; pageSize: number },
): any {
  if (!respRef) return vo(null)
  const sch = (schemas as Record<string, any>)[respRef]
  const dataProp = sch?.properties?.data
  let data: any = null
  if (dataProp) {
    if (dataProp.$ref) {
      const inner = refName(dataProp.$ref)!
      if (inner.startsWith('PageVo')) {
        const itemRef = refName((schemas as any)[inner]?.properties?.data?.items?.$ref)
        data = genPage(itemRef, ctx, pageParams)
      } else {
        data = genSchema(inner, { ...ctx, id: ctx.id })
      }
    } else if (dataProp.type === 'array') {
      const itemRef = refName(dataProp.items?.$ref)
      if (itemRef) {
        const len = ctx.listLen ?? 8
        data = Array.from({ length: len }, (_, i) => genSchema(itemRef, { ...ctx, index: i, id: i + 1 }))
      } else data = []
    } else if (dataProp.type === 'object') {
      data = genObject(dataProp, ctx)
    }
  }
  return vo(data)
}

export { hash }
