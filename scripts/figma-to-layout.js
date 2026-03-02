/**
 * Figma Map 노드 JSON에서 Shadow 그룹의 국가별 absoluteBoundingBox를
 * viewBox 0 0 1000 500 좌표로 변환해 FIGMA_COUNTRY_LAYOUT 형식으로 출력합니다.
 * 사용: node scripts/figma-to-layout.js < path/to/figma-node.json
 */
import { readFileSync } from 'fs'

const path = process.argv[2] || '/Users/woojung/.cursor/projects/Users-woojung-Projects-trip-map-global/agent-tools/7fe62ec4-c5fd-4410-a5ca-97643a2707b4.txt'
const raw = readFileSync(path, 'utf8')
const data = JSON.parse(raw)

const shadow = data.children?.find((c) => c.name === 'Shadow')
if (!shadow?.children) {
  console.error('Shadow group not found')
  process.exit(1)
}

const originX = shadow.absoluteBoundingBox.x
const originY = shadow.absoluteBoundingBox.y
const mapW = shadow.absoluteBoundingBox.width
const mapH = shadow.absoluteBoundingBox.height

function toViewBox(box) {
  return {
    x: Math.round((box.x - originX) * (1000 / mapW) * 10) / 10,
    y: Math.round((box.y - originY) * (500 / mapH) * 10) / 10,
    width: Math.round((box.width * (1000 / mapW)) * 10) / 10,
    height: Math.round((box.height * (500 / mapH)) * 10) / 10,
  }
}

const entries = []
for (const child of shadow.children) {
  const name = child.name
  if (!name || name.length !== 2 || !/^[a-z]{2}$/.test(name)) continue
  if (!child.absoluteBoundingBox) continue
  const vb = toViewBox(child.absoluteBoundingBox)
  entries.push({ code: name, ...vb })
}

entries.sort((a, b) => a.code.localeCompare(b.code))

console.log(JSON.stringify(entries, null, 2))
