/**
 * Figma Shadow 노드 JSON에서 2글자 코드 GROUP의 absoluteBoundingBox를 수집해
 * FIGMA_COUNTRY_LAYOUT을 Figma 값 그대로 생성. (변환 없음, SimpleMapView에서 viewBox 변환)
 *
 * 사용법:
 * 1) Figma API: FIGMA_ACCESS_TOKEN, FIGMA_FILE_KEY 환경변수 설정 후
 *    node scripts/figma-shadow-to-layout.js --fetch
 * 2) 파일: Talk to Figma MCP get_node_info(I2:15123;2:10158) 결과를
 *    scripts/shadow-response.json에 저장 후 node scripts/figma-shadow-to-layout.js
 * 3) stdin: node scripts/figma-shadow-to-layout.js -  후 JSON 파이프
 */
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')
const root = join(__dirname, '..')

// .env 로드 (FIGMA_ACCESS_TOKEN, FIGMA_FILE_KEY 사용 시)
const envPath = join(root, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}
const defaultPath = join(root, 'scripts/shadow-response.json')
const outPath = join(root, 'client/src/data/figmaCountryLayout.ts')
const SHADOW_NODE_ID = 'I2:15123;2:10158'

function round2 (n) {
  return Math.round(n * 100) / 100
}

function collectCodes (node, out) {
  if (!node) return
  const name = node.name
  const box = node.absoluteBoundingBox
  if (name && /^[a-z]{2}$/.test(name) && box) {
    out.push({
      code: name,
      x: round2(box.x),
      y: round2(box.y),
      width: round2(box.width),
      height: round2(box.height),
    })
  }
  const children = node.children || []
  for (const c of children) collectCodes(c, out)
}

function writeLayout (shadow) {
  const bounds = shadow.absoluteBoundingBox
  if (!bounds) {
    console.error('Shadow node must have absoluteBoundingBox')
    process.exit(1)
  }
  const entries = []
  collectCodes(shadow, entries)
  const byCode = new Map()
  for (const e of entries) {
    if (!byCode.has(e.code)) byCode.set(e.code, e)
  }
  const layout = [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code))

  const boundsStr = `{ x: ${round2(bounds.x)}, y: ${round2(bounds.y)}, width: ${round2(bounds.width)}, height: ${round2(bounds.height)} }`
  const lines = [
    '/**',
    ' * 지도 맵 영역: Figma Map Shadow 그룹의 absoluteBoundingBox.',
    ' * viewBox 변환은 SimpleMapView에서만 수행.',
    ' */',
    `export const FIGMA_MAP_BOUNDS = ${boundsStr} as const;`,
    '',
    '/**',
    ' * Figma에서 내보낸/복사한 원본 좌표만 저장한다.',
    ' * viewBox 등 다른 좌표계로 변환한 값을 넣지 말 것. (변환은 렌더 시 SimpleMapView에서만 수행)',
    ' */',
    'export const FIGMA_COUNTRY_LAYOUT = [',
    ...layout.map((e, i) =>
      `  { code: "${e.code}", x: ${e.x}, y: ${e.y}, width: ${e.width}, height: ${e.height} }${i < layout.length - 1 ? ',' : ''}`
    ),
    '] as const;',
    'export type CountryCode = (typeof FIGMA_COUNTRY_LAYOUT)[number]["code"];',
    '',
  ]
  writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log('Wrote', outPath, '-', layout.length, 'entries from Figma Shadow.')
}

async function fetchFromFigma () {
  const token = process.env.FIGMA_ACCESS_TOKEN
  const fileKey = process.env.FIGMA_FILE_KEY
  if (!token || !fileKey) {
    console.error('Set FIGMA_ACCESS_TOKEN and FIGMA_FILE_KEY (from Figma file URL) to use --fetch')
    process.exit(1)
  }
  const nodeIdEnc = encodeURIComponent(SHADOW_NODE_ID)
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeIdEnc}`
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } })
  if (!res.ok) {
    console.error('Figma API error:', res.status, await res.text())
    process.exit(1)
  }
  const data = await res.json()
  const doc = data?.nodes?.[SHADOW_NODE_ID]?.document
  if (!doc) {
    console.error('Shadow node not found in response')
    process.exit(1)
  }
  return doc
}

async function main () {
  if (process.argv[2] === '--fetch') {
    const shadow = await fetchFromFigma()
    writeLayout(shadow)
    return
  }
  const path = process.argv[2] || defaultPath
  const raw =
    path === '-' || path === 'stdin'
      ? require('fs').readFileSync(0, 'utf8')
      : readFileSync(path, 'utf8')
  const shadow = JSON.parse(raw)
  writeLayout(shadow)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
