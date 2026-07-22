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
 * 自定义 Mock：自动生成器无法产出正确业务结构的端点，须手写返回。
 * - GET /api/frame/menu  动态菜单树（含 routePath/component/code，须与前端视图路径一致，
 *                          自动生成器只能产出随机数据，故手写 menuTree）
 * 注：/api/org-unit/tree、/api/platform/user/page 此前也在此手写，但已确认它们分别对应
 *     openapi 的 /api/org/unit/tree 与 /api/user/page，现已改回使用自动生成的通用 handler。
 * ========================================================================== */

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
]

export const allHandlers = [...handlers, ...customHandlers]
