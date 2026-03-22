/**
 * 이미지 URL 감사 + Unsplash 자동 교체 스크립트
 *
 * 실행:
 *   UNSPLASH_ACCESS_KEY=your_key node server/scripts/auditAndFixImages.js
 *   또는 .env에 UNSPLASH_ACCESS_KEY 추가 후:
 *   node server/scripts/auditAndFixImages.js
 *
 * 동작:
 *  1. DB에서 전체 destinations 조회
 *  2. 각 imageUrl에 HEAD request → 404/오류 감지
 *  3. 깨진 URL은 Unsplash Search API로 도시명 검색 후 교체
 *  4. DB에 업데이트
 */

import '../load-env.js'
import pool from '../db/connection.js'

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY
const DRY_RUN = process.argv.includes('--dry-run')

if (!UNSPLASH_KEY) {
  console.error('❌ UNSPLASH_ACCESS_KEY가 없습니다. .env 또는 환경변수로 설정하세요.')
  process.exit(1)
}

if (DRY_RUN) {
  console.log('🔍 DRY RUN 모드: DB 업데이트 없이 감사만 수행합니다.')
}

async function checkUrl(url, timeoutMs = 7000) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
    clearTimeout(timer)
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err.message }
  }
}

async function searchUnsplashPhoto(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&content_filter=high`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    })
    if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`)
    const data = await res.json()
    if (!data.results || data.results.length === 0) return null
    // 첫 번째 결과의 regular URL (w=1080)
    return data.results[0].urls.regular
  } catch (err) {
    console.error(`  Unsplash 검색 실패 (${query}):`, err.message)
    return null
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const { rows: destinations } = await pool.query(
    'SELECT id, name, country, imageurl AS "imageUrl" FROM destinations ORDER BY month, id'
  )

  console.log(`\n총 ${destinations.length}개 여행지 이미지 URL 감사 시작...\n`)

  const stats = { ok: 0, broken: 0, fixed: 0, failed: 0 }
  const brokenList = []

  for (let i = 0; i < destinations.length; i++) {
    const { id, name, country, imageUrl } = destinations[i]
    const prefix = `[${i + 1}/${destinations.length}] ${name}(${country})`

    if (!imageUrl) {
      console.log(`${prefix} ⚠️  imageUrl 없음 → 스킵`)
      stats.broken++
      brokenList.push({ id, name, country, imageUrl: null, reason: 'empty' })
      continue
    }

    const { ok, status, error } = await checkUrl(imageUrl)

    if (ok) {
      console.log(`${prefix} ✅ 정상 (${status})`)
      stats.ok++
      continue
    }

    console.log(`${prefix} ❌ 깨짐 (status: ${status}, error: ${error ?? '-'})`)
    stats.broken++
    brokenList.push({ id, name, country, imageUrl, reason: error ?? `HTTP ${status}` })

    if (DRY_RUN) continue

    // Unsplash 검색 (도시명으로 먼저, 실패 시 도시명+관광지로 재시도)
    await sleep(1200) // Unsplash rate limit: 50 req/hour
    let newUrl = await searchUnsplashPhoto(`${name} travel`)
    if (!newUrl) {
      await sleep(1200)
      newUrl = await searchUnsplashPhoto(`${name} city`)
    }

    if (!newUrl) {
      console.log(`  → Unsplash 교체 실패`)
      stats.failed++
      continue
    }

    // DB 업데이트
    await pool.query('UPDATE destinations SET imageurl = $1, updated_at = NOW() WHERE id = $2', [
      newUrl,
      id,
    ])
    console.log(`  → 교체 완료: ${newUrl.slice(0, 80)}...`)
    stats.fixed++

    await sleep(500)
  }

  console.log('\n' + '='.repeat(60))
  console.log('감사 완료')
  console.log(`✅ 정상: ${stats.ok}개`)
  console.log(`❌ 깨진 URL 감지: ${stats.broken}개`)
  if (!DRY_RUN) {
    console.log(`🔄 교체 성공: ${stats.fixed}개`)
    console.log(`⚠️  교체 실패: ${stats.failed}개`)
  }

  if (brokenList.length > 0) {
    console.log('\n깨진 URL 목록:')
    brokenList.forEach(({ id, name, country, reason }) => {
      console.log(`  ID ${id}: ${name}(${country}) - ${reason}`)
    })
  }

  await pool.end()
}

main().catch((err) => {
  console.error('스크립트 오류:', err)
  process.exit(1)
})
