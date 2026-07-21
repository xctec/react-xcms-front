import { readFileSync } from 'node:fs'

const spec = JSON.parse(readFileSync('/Users/cheng/CodeBuddy/design/openapi.json', 'utf8'))
const schemas = spec.components?.schemas || {}
const want = process.argv.slice(2)
for (const name of want) {
  const s = schemas[name]
  if (!s) { console.log(`\n## ${name}: NOT FOUND`); continue }
  console.log(`\n## ${name}`)
  const props = s.properties || {}
  for (const [k, p] of Object.entries(props)) {
    let t = p.type || ''
    if (!t && p.$ref) t = 'ref:' + p.$ref.split('/').pop()
    else if (!t && p.items?.$ref) t = 'array<ref:' + p.items.$ref.split('/').pop() + '>'
    else if (!t && p.items?.type) t = 'array<' + p.items.type + '>'
    console.log(`  ${k}: ${t}${p.enum ? ' enum=' + JSON.stringify(p.enum) : ''}`)
  }
}
