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
      {
        id: 204, menuType: 'M', name: '消息中心', orderNum: 4, code: 'sys_msg',
        children: [
          { id: 205, menuType: 'D', name: '通知管理', routePath: '/notice', component: 'system/notice/index', code: 'sys_notice', icon: 'megaphone', orderNum: 1 },
          { id: 206, menuType: 'D', name: '消息管理', routePath: '/message', component: 'system/message/index', code: 'sys_message', icon: 'message-square', orderNum: 2 },
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

/* ============================================================================
 * 消息中心自定义 Mock
 * OpenAPI 未提供 /api/notice、/api/message 相关接口，自动生成器无法覆盖，
 * 故手写端点。关键点：通知与消息共用同一段「租户成员ID」(1..30)，
 * 这样通知管理里 USER 类型通知的「用户消息」按钮总能筛出对应成员的消息。
 * ========================================================================== */

const TENANT_USER_RANGE = 30

const MESSAGE_TITLES = [
  '账号安全提醒', '系统升级通知', '待办事项提醒', '密码即将过期', '新功能上线',
  '资源使用预警', '登录异常提醒', '工单处理进度', '账单已生成', '权限变更通知',
]
const MESSAGE_CONTENTS = [
  '您的账号于异地登录，请确认是否为本人操作。',
  '系统将于本周日 02:00 进行例行维护升级，期间服务可能短暂不可用。',
  '您有一条待处理审批，请尽快查看以免延误。',
  '您的登录密码将在 7 天后过期，请及时修改以保障安全。',
  '工作台新增批量导出功能，欢迎体验。',
  '当前租户资源使用率已达 85%，请关注配额。',
  '检测到非常用设备登录，已临时冻结部分敏感操作。',
  '您提交的工单已处理完成，请查收结果。',
  '本月账单已生成，可在费用中心查看明细。',
  '您所在的角色权限已更新，新增「消息管理」权限。',
]
const NOTICE_TITLES = [
  '系统停机维护公告', '节假日值班安排', '新版本发布说明', '安全合规专项通知',
  '全员大会通知', '机房迁移预告', '数据备份策略调整', '办公环境优化通知',
]
const NOTICE_CONTENTS = [
  '为提升稳定性，平台将于本周末进行停机维护，请提前保存工作。',
  '中秋假期值班表已发布，请相关同事留意排班。',
  'v2.4 版本已发布，重点优化了消息中心与权限体系。',
  '根据安全合规要求，即日起启用双因素认证。',
  '定于周五下午召开全员季度总结大会，请准时参加。',
  '核心机房将于下月迁移至新园区，网络可能短暂抖动。',
  '数据备份策略由每日改为每小时增量备份，降低丢失风险。',
  '新办公区已开放，工位调整请到行政前台办理。',
]

interface MockMessage {
  id: number
  title: string
  content: string
  type: string
  tenantUserId: number
  senderId: number
  read: string
  status: string
  createdTime: string
}
interface MockNotice {
  id: number
  title: string
  content: string
  status: string
  targetType: string
  targetValue: string
  tenantUserId?: number
  publisherId: number
  templateCode: string
  publishTime: string
  createTime: string
}

const ALL_MESSAGES: MockMessage[] = Array.from({ length: 137 }, (_, i) => {
  const r = makeRng(hash('/api/message/page:' + (i + 1)))
  return {
    id: i + 1,
    title: MESSAGE_TITLES[i % MESSAGE_TITLES.length],
    content: MESSAGE_CONTENTS[i % MESSAGE_CONTENTS.length],
    type: r() > 0.5 ? 'N' : 'D',
    tenantUserId: 1 + (i % TENANT_USER_RANGE),
    senderId: 1 + Math.floor(r() * 5),
    read: r() > 0.5 ? '1' : '0',
    status: r() > 0.15 ? '1' : '0',
    createdTime: new Date(Date.now() - i * 3600_000 * 7).toISOString().slice(0, 19).replace('T', ' '),
  }
})

const NOTICE_TARGET_TYPES = ['USER', 'USER', 'ROLE', 'DEPT', 'TENANT']
const ALL_NOTICES: MockNotice[] = Array.from({ length: 57 }, (_, i) => {
  const r = makeRng(hash('/api/notice/page:' + (i + 1)))
  const targetType = NOTICE_TARGET_TYPES[i % NOTICE_TARGET_TYPES.length]
  const isUser = targetType === 'USER'
  const tenantUserId = isUser ? 1 + (i % TENANT_USER_RANGE) : undefined
  const targetValue = isUser ? String(tenantUserId) : `${1 + Math.floor(r() * 8)}`
  const status = (['0', '1', '2'] as const)[Math.floor(r() * 3)]
  const created = new Date(Date.now() - i * 3600_000 * 11).toISOString().slice(0, 19).replace('T', ' ')
  const published = status !== '0' ? created : ''
  return {
    id: i + 1,
    title: NOTICE_TITLES[i % NOTICE_TITLES.length],
    content: NOTICE_CONTENTS[i % NOTICE_CONTENTS.length],
    status,
    targetType,
    targetValue,
    tenantUserId,
    publisherId: 1 + Math.floor(r() * 5),
    templateCode: r() > 0.7 ? 'NOTICE_TPL_' + (1 + Math.floor(r() * 3)) : '',
    publishTime: published,
    createTime: created,
  }
})

function readPageBody(body: any) {
  return {
    pageNo: Number(body?.pageNo ?? body?.pageNum ?? 1) || 1,
    pageSize: Number(body?.pageSize ?? body?.size ?? 10) || 10,
    keyword: (body?.keyword ?? '').toString().toLowerCase(),
  }
}

const ok = () => HttpResponse.json({ errorNo: '0', errorMsg: 'success', data: null })

const customHandlers = [
  http.get(API_BASE + '/api/frame/menu', () =>
    HttpResponse.json({ errorNo: '0', errorMsg: 'success', data: menuTree }),
  ),

  // ----------------------------- 通知管理 -----------------------------
  http.post(API_BASE + '/api/notice/page', async ({ request }) => {
    const body = (await request.clone().json().catch(() => ({}))) as any
    const { pageNo, pageSize, keyword } = readPageBody(body)
    let all = ALL_NOTICES
    if (keyword) all = all.filter((n) => n.title.toLowerCase().includes(keyword) || n.content.toLowerCase().includes(keyword))
    const start = (pageNo - 1) * pageSize
    return HttpResponse.json({
      errorNo: '0', errorMsg: 'success',
      data: { total: all.length, data: all.slice(start, start + pageSize) },
    })
  }),
  http.post(API_BASE + '/api/notice/add', ok),
  http.post(API_BASE + '/api/notice/edit', ok),
  http.post(API_BASE + '/api/notice/delete', ok),
  http.post(API_BASE + '/api/notice/deleteAll', ok),
  http.post(API_BASE + '/api/notice/publish', ok),
  http.post(API_BASE + '/api/notice/withdraw', ok),

  // ----------------------------- 消息管理 -----------------------------
  http.post(API_BASE + '/api/message/page', async ({ request }) => {
    const body = (await request.clone().json().catch(() => ({}))) as any
    const { pageNo, pageSize, keyword } = readPageBody(body)
    const tid = body?.tenantUserId != null ? Number(body.tenantUserId) : undefined
    let all = ALL_MESSAGES
    if (tid != null) all = all.filter((m) => m.tenantUserId === tid)
    if (keyword) all = all.filter((m) => m.title.toLowerCase().includes(keyword) || m.content.toLowerCase().includes(keyword))
    const start = (pageNo - 1) * pageSize
    return HttpResponse.json({
      errorNo: '0', errorMsg: 'success',
      data: { total: all.length, data: all.slice(start, start + pageSize) },
    })
  }),
  http.post(API_BASE + '/api/message/add', ok),
  http.post(API_BASE + '/api/message/edit', ok),
  http.post(API_BASE + '/api/message/delete', ok),
  http.post(API_BASE + '/api/message/deleteAll', ok),
]

export const allHandlers = [...handlers, ...customHandlers]
