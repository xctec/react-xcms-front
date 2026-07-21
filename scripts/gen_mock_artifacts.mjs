import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const spec = JSON.parse(readFileSync('/Users/cheng/CodeBuddy/design/openapi.json', 'utf8'))
const paths = spec.paths || {}
const schemas = spec.components?.schemas || {}

const refName = (s) => (s?.$ref ? s.$ref.split('/').pop() : null)
const respOf = (resp) => refName(resp?.['*/*']?.schema) || refName(resp?.['application/json']?.schema)

const endpoints = []
for (const [path, methods] of Object.entries(paths)) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue
    const reqBody = op.requestBody?.content?.['application/json']?.schema
    const pathParams = (op.parameters || []).filter((p) => p.in === 'path').map((p) => p.name)
    endpoints.push({
      method: method.toUpperCase(),
      path,
      operationId: op.operationId,
      tag: (op.tags || [])[0],
      summary: op.summary || '',
      reqRef: refName(reqBody) || (reqBody ? (reqBody.type || 'inline') : null),
      respRef: respOf(op.responses?.['200']?.content),
      pathParams,
    })
  }
}

mkdirSync('/Users/cheng/CodeBuddy/design/app/src/mocks', { recursive: true })
writeFileSync('/Users/cheng/CodeBuddy/design/app/src/mocks/endpoints.json', JSON.stringify(endpoints, null, 2))
writeFileSync('/Users/cheng/CodeBuddy/design/app/src/mocks/schemas.json', JSON.stringify(schemas, null, 2))
console.error('mock artifacts:', endpoints.length, 'endpoints,', Object.keys(schemas).length, 'schemas')
