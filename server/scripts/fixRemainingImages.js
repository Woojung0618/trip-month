/**
 * 교체 실패한 27개 이미지 URL을 영어 검색어로 재시도
 * node server/scripts/fixRemainingImages.js
 */

import '../load-env.js'
import pool from '../db/connection.js'

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY

// 교체 실패한 여행지: ID → 영어 검색어
const FAILED_IDS = {
  2: 'Chiang Mai Thailand temple',
  3: 'Hanoi Vietnam old quarter',
  7: 'Havana Cuba classic cars',
  9: 'New Orleans jazz street',
  14: 'Hue Vietnam imperial city',
  21: 'New Orleans mardi gras',
  42: 'Vancouver Canada cityscape',
  47: 'Dubrovnik Croatia adriatic',
  55: 'Cebu Philippines island',
  58: 'Algarve Portugal coast cliff',
  59: 'Florence Italy cathedral dome',
  68: 'Dubrovnik Croatia island hopping',
  69: 'Edinburgh Scotland castle',
  76: 'Edinburgh Scotland festival',
  83: 'Shanghai China skyline',
  85: 'Munich Oktoberfest Bavaria',
  88: 'Bodrum Turkey coast',
  89: 'Medellin Colombia city',
  90: 'Boston New England autumn fall foliage',
  95: 'Darjeeling India tea plantation mountains',
  96: 'Florence Tuscany Italy vineyard',
  97: 'Scotland Highland landscape',
  100: 'New Orleans Louisiana bayou',
  104: 'Bagan Myanmar temples sunrise',
  142: 'Hanoi Vietnam street',
  148: 'Naha Okinawa Japan',
  170: 'Valencia Spain beach summer',
  176: 'Budapest Hungary summer Danube',
  184: 'Boston summer harbor',
  209: 'Seville Spain autumn',
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function searchUnsplash(query, retryOnLimit = true) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&content_filter=high`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  })

  if (res.status === 403 || res.status === 429) {
    console.log(`  ⏳ Rate limit 도달, 90초 대기 후 재시도...`)
    await sleep(90000)
    if (retryOnLimit) return searchUnsplash(query, false)
    return null
  }

  if (!res.ok) {
    console.error(`  Unsplash 오류: ${res.status}`)
    return null
  }

  const data = await res.json()
  if (!data.results || data.results.length === 0) return null
  return data.results[0].urls.regular
}

async function main() {
  if (!UNSPLASH_KEY) {
    console.error('❌ UNSPLASH_ACCESS_KEY 없음')
    process.exit(1)
  }

  const ids = Object.keys(FAILED_IDS).map(Number)
  console.log(`\n${ids.length}개 이미지 재교체 시작...\n`)

  let fixed = 0
  let failed = 0

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const query = FAILED_IDS[id]
    const { rows } = await pool.query('SELECT name, country FROM destinations WHERE id = $1', [id])
    const dest = rows[0]
    const prefix = `[${i + 1}/${ids.length}] ID ${id} ${dest?.name ?? '?'}(${dest?.country ?? '?'})`

    process.stdout.write(`${prefix} 검색 중 ("${query}")...`)

    const newUrl = await searchUnsplash(query)

    if (!newUrl) {
      console.log(` ❌ 교체 실패`)
      failed++
    } else {
      await pool.query('UPDATE destinations SET imageurl = $1, updated_at = NOW() WHERE id = $2', [
        newUrl,
        id,
      ])
      console.log(` ✅ 교체 완료`)
      fixed++
    }

    // Unsplash 50 req/hour → 1.5초 간격으로 안전하게
    if (i < ids.length - 1) await sleep(1500)
  }

  console.log(`\n재교체 완료: 성공 ${fixed}개 / 실패 ${failed}개`)
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
