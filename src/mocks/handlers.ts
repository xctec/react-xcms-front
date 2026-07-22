import { http, HttpResponse } from 'msw'
import endpoints from './endpoints.json'
import { genResultVo, makeRng, hash } from './mockGen'
import { API_BASE } from '@/utils/request'

const toMswPath = (p: string) => API_BASE + p.replace(/\{(\w+)\}/g, ':$1')

function readPageParams(body: any) {
  return {
    // 兼容多套分页入参命名：pageNum/pageNo/current（页码）、pageSize/size（大小）
    pageNum: Number(body?.pageNum ?? body?.pageNo ?? body?.current ?? 1) || 1,
    pageSize: Number(body?.pageSize ?? body?.size ?? 10) || 10,
  }
}

/** 由 OpenAPI 端点清单自动生成 MSW 拦截器，覆盖全部接口 */
export const handlers = endpoints.map((e: any) => {
  const method = e.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch'
  const url = toMswPath(e.path)
  return http[method](url, async ({ request, params }) => {
    let body: any = {}
    if (e.method !== 'GET') {
      try {
        body = await request.clone().json()
      } catch {
        body = {}
      }
    }
    const pageParams = readPageParams(body)

    const idParam = e.pathParams?.find((p: string) => /id$/i.test(p))
    const ctx: any = {
      path: e.path,
      rng: makeRng(hash(e.path)),
      total: 57,
      ...pageParams,
    }
    if (idParam && params[idParam] != null) {
      ctx.id = params[idParam]
      ctx.rng = makeRng(hash(e.path + ':' + params[idParam]))
    }

    const data = genResultVo(e.respRef, ctx, pageParams)
    return HttpResponse.json(data)
  })
})

/* ============================================================================
 * 自定义 Mock：补齐 OpenAPI 中缺失、但前端页面需要的端点（已记入 docs/negotiation.md）
 * - GET  /api/org-unit/tree      组织机构树（openapi 无 org-unit 模块）
 * - POST /api/platform/user/page 平台用户分页（openapi 无 platform-user 模块）
 * 待后端补齐真实接口后，可直接删除此处自定义 handler。
 * ========================================================================== */

// 组织机构树（确定性手写数据，便于前端联调）
const orgTree: any[] = [
  {
    id: 1, parentId: 0, code: 'HQ', name: '中台中心', nodeDesc: '集团总部', treeLevel: 0,
    orgUnitStatus: '0', children: [
      {
        id: 11, parentId: 1, code: 'RD', name: '研发中心', nodeDesc: '负责平台研发', treeLevel: 1,
        orgUnitStatus: '0', children: [
          { id: 111, parentId: 11, code: 'FE', name: '前端组', nodeDesc: '', treeLevel: 2, orgUnitStatus: '0', children: [] },
          { id: 112, parentId: 11, code: 'BE', name: '后端组', nodeDesc: '', treeLevel: 2, orgUnitStatus: '0', children: [] },
        ],
      },
      {
        id: 12, parentId: 1, code: 'OPS', name: '运营中心', nodeDesc: '负责客户与运营', treeLevel: 1,
        orgUnitStatus: '0', children: [
          { id: 121, parentId: 12, code: 'CUS', name: '客户成功组', nodeDesc: '', treeLevel: 2, orgUnitStatus: '0', children: [] },
        ],
      },
      {
        id: 13, parentId: 1, code: 'FIN', name: '财务中心', nodeDesc: '财务与合规', treeLevel: 1,
        orgUnitStatus: '1', children: [],
      },
    ],
  },
  {
    id: 2, parentId: 0, code: 'EAST', name: '华东制造工厂', nodeDesc: '生产制造租户', treeLevel: 0,
    orgUnitStatus: '0', children: [
      { id: 21, parentId: 2, code: 'PROD', name: '生产部', nodeDesc: '', treeLevel: 1, orgUnitStatus: '0', children: [] },
      { id: 22, parentId: 2, code: 'QA', name: '质检部', nodeDesc: '', treeLevel: 1, orgUnitStatus: '0', children: [] },
    ],
  },
  {
    id: 3, parentId: 0, code: 'SOUTH', name: '华南物流', nodeDesc: '物流租户', treeLevel: 0,
    orgUnitStatus: '0', children: [
      { id: 31, parentId: 3, code: 'DISP', name: '调度组', nodeDesc: '', treeLevel: 1, orgUnitStatus: '0', children: [] },
    ],
  },
]

const platformUsers: any[] = Array.from({ length: 23 }, (_, i) => {
  const id = i + 1
  const tenants = ['PLATFORM', 'EAST-FACTORY', 'SOUTH-LOGI', 'WEST-RETAIL']
  const tenant = tenants[id % tenants.length]
  const allRoles = [['超级管理员'], ['租户管理员', '运营管理员'], ['审核员'], ['普通员工'], ['系统服务'], ['普通员工']]
  return {
    id,
    loginId: ['admin', 'lihua', 'wang', 'zhao', 'svc-billing', 'chen'][i % 6] + (id > 6 ? String(id) : ''),
    name: ['超级管理员', '李华', '王芳', '赵敏', '计费服务', '陈杰'][i % 6] + (id > 6 ? String(id) : ''),
    tenant,
    roles: allRoles[i % allRoles.length],
    status: id % 7 === 4 ? 'inactive' : 'active',
  }
})

/* 后端菜单接口：只返回「动态菜单」部分（系统管理 / 平台管理 等后台功能）。
 * 工作区、个人中心为前端静态路由，由 STATIC_MENU 内置，服务端不返回，避免重复。 */
const menuTree: any[] = [
  {
    id: 2, menuType: 'M', name: '系统管理', orderNum: 2, code: 'sys',
    children: [
      {
        id: 201, menuType: 'M', name: '账户与权限', orderNum: 1, code: 'sys_auth',
        children: [
          { id: 21, menuType: 'D', name: '租户账户/成员', routePath: '/tenant-user', component: 'system/tenant-user/index', code: 'sys_tenant_user', icon: 'users', orderNum: 1 },
          { id: 22, menuType: 'D', name: '角色管理', routePath: '/role', component: 'system/role/index', code: 'sys_role', icon: 'shield', orderNum: 2 },
          { id: 26, menuType: 'D', name: '角色分组', routePath: '/role-group', component: 'system/role-group/index', code: 'sys_role_group', icon: 'group', orderNum: 3 },
          { id: 23, menuType: 'D', name: '组织机构', routePath: '/org-unit', component: 'system/org-unit/index', code: 'sys_org_unit', icon: 'network', orderNum: 4 },
        ],
      },
      {
        id: 202, menuType: 'M', name: '字典与菜单', orderNum: 2, code: 'sys_dict_menu',
        children: [
          { id: 24, menuType: 'D', name: '菜单管理', routePath: '/menu', component: 'system/menu/index', code: 'sys_menu', icon: 'menu', orderNum: 1 },
          { id: 25, menuType: 'D', name: '字典类型', routePath: '/dict-type', component: 'system/dict-type/index', code: 'sys_dict_type', icon: 'book', orderNum: 2 },
        ],
      },
      {
        id: 203, menuType: 'M', name: '日志中心', orderNum: 3, code: 'sys_log',
        children: [
          { id: 27, menuType: 'D', name: '登录日志', routePath: '/login-log', component: 'system/login-log/index', code: 'sys_login_log', icon: 'login', orderNum: 1 },
          { id: 28, menuType: 'D', name: '操作日志', routePath: '/sys-log', component: 'system/sys-log/index', code: 'sys_oper_log', icon: 'file', orderNum: 2 },
        ],
      },
    ],
  },
  {
    id: 3, menuType: 'M', name: '平台管理', orderNum: 3, code: 'platform',
    children: [
      {
        id: 301, menuType: 'M', name: '租户与模板', orderNum: 1, code: 'platform_tenant',
        children: [
          { id: 31, menuType: 'D', name: '租户管理', routePath: '/tenant', component: 'system/tenant/index', code: 'sys_tenant', icon: 'building', orderNum: 1 },
          { id: 32, menuType: 'D', name: '角色模板', routePath: '/role-template', component: 'system/role-template/index', code: 'sys_role_template', icon: 'key', orderNum: 2 },
          { id: 33, menuType: 'D', name: '菜单模板', routePath: '/menu-template', component: 'system/menu-template/index', code: 'sys_menu_template', icon: 'layers', orderNum: 3 },
          { id: 34, menuType: 'D', name: '字典模板', routePath: '/dict-template', component: 'system/dict-template/index', code: 'sys_dict_template', icon: 'database', orderNum: 4 },
        ],
      },
      {
        id: 302, menuType: 'M', name: '用户与凭据', orderNum: 2, code: 'platform_credential',
        children: [
          { id: 35, menuType: 'D', name: 'Token 管理', routePath: '/token-admin', component: 'system/token-admin/index', code: 'sys_token_admin', icon: 'fingerprint', orderNum: 1 },
          { id: 36, menuType: 'D', name: '用户池', routePath: '/user-pool', component: 'system/user-pool/index', code: 'sys_user_pool', icon: 'boxes', orderNum: 2 },
          { id: 37, menuType: 'D', name: '平台用户', routePath: '/platform-user', component: 'system/platform-user/index', code: 'sys_platform_user', icon: 'user-cog', orderNum: 3 },
        ],
      },
    ],
  },
]

const customHandlers = [
  http.get(API_BASE + '/api/frame/menu', () =>
    HttpResponse.json({ errorNo: '0', errorMsg: 'success', data: menuTree }),
  ),
  http.get(API_BASE + '/api/org-unit/tree', () =>
    HttpResponse.json({ errorNo: '0', errorMsg: 'success', data: orgTree }),
  ),
  http.post(API_BASE + '/api/platform/user/page', async ({ request }) => {
    const body = (await request.clone().json().catch(() => ({}))) as any
    const { pageNum: pageNo, pageSize } = readPageParams(body)
    const kw = (body.keyword || '').toLowerCase()
    const filtered = kw
      ? platformUsers.filter((u) => u.loginId.toLowerCase().includes(kw) || u.name.toLowerCase().includes(kw))
      : platformUsers
    const start = (pageNo - 1) * pageSize
    return HttpResponse.json({
      errorNo: '0', errorMsg: 'success',
      data: { total: filtered.length, data: filtered.slice(start, start + pageSize) },
    })
  }),
]

export const allHandlers = [...handlers, ...customHandlers]
