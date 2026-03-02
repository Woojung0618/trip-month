/**
 * Figma에서 추출한 JSON + public 전용 수동 항목을 합쳐 figmaCountryLayout.ts 생성
 */
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const root = join(__dirname, '..')
const figmaPath = join(root, 'client/src/data/figma-layout-temp.json')
const outPath = join(root, 'client/src/data/figmaCountryLayout.ts')

const figma = JSON.parse(readFileSync(figmaPath, 'utf8'))
const figmaCodes = new Set(figma.map((e) => e.code))

// public/countries에 있지만 Figma에는 없는 코드 → 추정 좌표 유지
const manual = [
  { code: 'af', x: 627, y: 178, width: 28, height: 22 },
  { code: 'al', x: 528, y: 161, width: 7, height: 10 },
  { code: 'am', x: 592, y: 161, width: 7, height: 8 },
  { code: 'at', x: 528, y: 131, width: 12, height: 10 },
  { code: 'ba', x: 528, y: 155, width: 8, height: 10 },
  { code: 'be', x: 506, y: 127, width: 5, height: 7 },
  { code: 'bf', x: 494, y: 217, width: 14, height: 18 },
  { code: 'bg', x: 556, y: 156, width: 12, height: 10 },
  { code: 'bi', x: 556, y: 278, width: 6, height: 7 },
  { code: 'bj', x: 506, y: 233, width: 7, height: 16 },
  { code: 'bt', x: 722, y: 187, width: 6, height: 10 },
  { code: 'bw', x: 556, y: 328, width: 22, height: 20 },
  { code: 'by', x: 561, y: 118, width: 22, height: 16 },
  { code: 'cd', x: 556, y: 278, width: 42, height: 42 },
  { code: 'cf', x: 544, y: 247, width: 18, height: 22 },
  { code: 'cg', x: 533, y: 272, width: 14, height: 22 },
  { code: 'ch', x: 517, y: 144, width: 8, height: 10 },
  { code: 'ci', x: 489, y: 261, width: 11, height: 18 },
  { code: 'cm', x: 522, y: 250, width: 12, height: 22 },
  { code: 'co', x: 267, y: 256, width: 16, height: 26 },
  { code: 'cr', x: 256, y: 239, width: 6, height: 8 },
  { code: 'cz', x: 528, y: 131, width: 12, height: 10 },
  { code: 'dj', x: 606, y: 233, width: 5, height: 6 },
  { code: 'dz', x: 506, y: 189, width: 32, height: 32 },
  { code: 'eg', x: 569, y: 192, width: 22, height: 26 },
  { code: 'eh', x: 461, y: 200, width: 32, height: 11 },
  { code: 'et', x: 600, y: 242, width: 20, height: 24 },
  { code: 'gh', x: 494, y: 244, width: 9, height: 14 },
  { code: 'gt', x: 244, y: 222, width: 7, height: 12 },
  { code: 'gy', x: 317, y: 253, width: 14, height: 12 },
  { code: 'hu', x: 544, y: 144, width: 13, height: 10 },
  { code: 'il', x: 583, y: 178, width: 5, height: 8 },
  { code: 'iq', x: 589, y: 175, width: 13, height: 15 },
  { code: 'is', x: 439, y: 78, width: 11, height: 10 },
  { code: 'jo', x: 583, y: 181, width: 7, height: 10 },
  { code: 'ke', x: 594, y: 267, width: 12, height: 18 },
  { code: 'kg', x: 686, y: 153, width: 16, height: 14 },
  { code: 'kp', x: 782, y: 158, width: 15.5, height: 16.2 },
  { code: 'la', x: 764, y: 217, width: 11, height: 18 },
  { code: 'lr', x: 472, y: 250, width: 7, height: 10 },
  { code: 'ls', x: 567, y: 348, width: 5, height: 6 },
  { code: 'lt', x: 556, y: 108, width: 9, height: 8 },
  { code: 'lv', x: 556, y: 106, width: 9, height: 8 },
  { code: 'ly', x: 533, y: 192, width: 32, height: 26 },
  { code: 'ma', x: 483, y: 178, width: 16, height: 18 },
  { code: 'mk', x: 556, y: 156, width: 7, height: 8 },
  { code: 'ml', x: 489, y: 222, width: 25, height: 24 },
  { code: 'mn', x: 764, y: 139, width: 26, height: 20 },
  { code: 'mw', x: 583, y: 303, width: 7, height: 18 },
  { code: 'na', x: 533, y: 328, width: 20, height: 22 },
  { code: 'ne', x: 517, y: 225, width: 26, height: 26 },
  { code: 'ni', x: 256, y: 231, width: 7, height: 12 },
  { code: 'np', x: 714, y: 189, width: 9, height: 18 },
  { code: 'pe', x: 261, y: 294, width: 16, height: 32 },
  { code: 'pk', x: 672, y: 183, width: 20, height: 26 },
  { code: 'pl', x: 544, y: 122, width: 17, height: 14 },
  { code: 'py', x: 317, y: 331, width: 13, height: 22 },
  { code: 'ro', x: 556, y: 139, width: 13, height: 14 },
  { code: 'rw', x: 572, y: 272, width: 5, height: 6 },
  { code: 'si', x: 528, y: 144, width: 5, height: 8 },
  { code: 'sk', x: 544, y: 131, width: 9, height: 8 },
  { code: 'sn', x: 461, y: 228, width: 9, height: 14 },
  { code: 'sr', x: 317, y: 256, width: 11, height: 12 },
  { code: 'sv', x: 244, y: 228, width: 4, height: 6 },
  { code: 'sy', x: 589, y: 169, width: 9, height: 10 },
  { code: 'td', x: 539, y: 225, width: 26, height: 26 },
  { code: 'tg', x: 503, y: 244, width: 5, height: 14 },
  { code: 'tj', x: 675, y: 158, width: 11, height: 14 },
  { code: 'tm', x: 650, y: 158, width: 20, height: 14 },
  { code: 'ua', x: 578, y: 131, width: 26, height: 16 },
  { code: 'ug', x: 578, y: 264, width: 9, height: 12 },
  { code: 'uy', x: 317, y: 358, width: 11, height: 14 },
  { code: 'za', x: 556, y: 347, width: 20, height: 26 },
  { code: 'zm', x: 567, y: 308, width: 20, height: 22 },
  { code: 'zw', x: 572, y: 322, width: 13, height: 18 },
]

const manualOnly = manual.filter((m) => !figmaCodes.has(m.code))
const combined = [...figma, ...manualOnly].sort((a, b) => a.code.localeCompare(b.code))

function formatEntry(e) {
  return `  {
    "code": "${e.code}",
    "x": ${e.x},
    "y": ${e.y},
    "width": ${e.width},
    "height": ${e.height}
  }`
}

const lines = [
  'export const FIGMA_COUNTRY_LAYOUT = [',
  ...combined.map((e, i) => formatEntry(e) + (i < combined.length - 1 ? ',' : '')),
  '] as const;',
  'export type CountryCode = typeof FIGMA_COUNTRY_LAYOUT[number]["code"];',
  '',
]
writeFileSync(outPath, lines.join('\n'), 'utf8')
console.log('Wrote', outPath, '-', combined.length, 'entries (Figma:', figma.length, ', manual:', manualOnly.length, ')')
console.log('Manual-only codes:', manualOnly.map((m) => m.code).join(', '))
