// 항공권 가격 자동 업데이트 스케줄러 메인 로직
// - Frankfurter API로 환율 조회 (무료, API Key 불필요)
// - destinations + iata_mappings JOIN으로 목적지 목록 조회
// - Duffel API로 ICN 출발 최저가 조회 후 KRW 변환
// - destinations.averageFlightPrice 업데이트

import pool from '../db/connection.js'
import { fetchLowestOffer } from './duffelFetcher.js'

// ── 환율 조회 ──────────────────────────────────────────────────────
// GET https://api.frankfurter.app/latest?to=KRW
// 응답: { "base": "EUR", "rates": { "KRW": 1530.2, "GBP": 0.845, "USD": 1.08, ... } }
async function fetchExchangeRatesToKRW() {
  const res = await fetch('https://api.frankfurter.app/latest?to=KRW')
  if (!res.ok) throw new Error(`환율 조회 실패: HTTP ${res.status}`)
  return res.json()
}

// 임의 통화 → KRW 변환
// rateData.base = "EUR" 기준, rateData.rates = { KRW, GBP, USD, ... }
function convertToKRW(amount, currency, rateData) {
  const krwPerBase = rateData.rates.KRW
  if (currency === rateData.base) {
    return Math.round(amount * krwPerBase)
  }
  const currencyPerBase = rateData.rates[currency]
  if (!currencyPerBase) throw new Error(`환율 데이터 없음: ${currency}`)
  return Math.round((amount / currencyPerBase) * krwPerBase)
}

// ── departureDate 계산 ─────────────────────────────────────────────
// 규칙:
//   day   = 오늘 날짜의 일(day)
//   month = destination 추천 월
//   year  = 추천 월 >= 오늘 월이면 올해, 아니면 내년
// 엣지케이스: 오늘 일이 해당 월 말일 초과 시 말일 사용
//   예) 오늘 1/31, 추천월 2 → 2026-02-28
function calcDepartureDate(today, recommendedMonth) {
  const todayYear  = today.getFullYear()
  const todayMonth = today.getMonth() + 1 // 1~12
  const todayDay   = today.getDate()

  const targetYear = recommendedMonth >= todayMonth ? todayYear : todayYear + 1
  const lastDay    = new Date(targetYear, recommendedMonth, 0).getDate()
  const targetDay  = Math.min(todayDay, lastDay)

  const mm = String(recommendedMonth).padStart(2, '0')
  const dd = String(targetDay).padStart(2, '0')
  return `${targetYear}-${mm}-${dd}`
}

// Duffel rate limit: 120 req/60s → 500ms 간격으로 안전하게 처리
const DELAY_MS = 500
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── 메인 업데이트 함수 ─────────────────────────────────────────────
export async function updateAllFlightPrices() {
  console.log('[FlightPriceUpdater] 시작:', new Date().toISOString())

  // 1. 환율 사전 조회 (전체 destination 공유, 1회만 호출)
  let rateData
  try {
    rateData = await fetchExchangeRatesToKRW()
    console.log(
      `[FlightPriceUpdater] 환율 조회 완료: 1 ${rateData.base} = ${rateData.rates.KRW} KRW`
    )
  } catch (err) {
    console.error('[FlightPriceUpdater] 환율 조회 실패:', err.message)
    return { updated: 0, skipped: 0, failed: 1 }
  }

  // 2. destinations + iata_mappings JOIN 조회
  //    iata_code가 없는 destination은 LEFT JOIN으로 null 반환 → skipped 처리
  const { rows } = await pool.query(`
    SELECT
      d.id,
      d.name,
      d.country,
      d."month",
      im.iata_code
    FROM destinations d
    LEFT JOIN iata_mappings im
      ON im.destination_name = d.name
     AND im.country_code     = d.country
    ORDER BY d.id
  `)

  const today = new Date()
  let updated = 0, skipped = 0, failed = 0

  for (const dest of rows) {
    // IATA 매핑 없는 destination 건너뜀
    if (!dest.iata_code) {
      console.warn(`[skip] IATA 매핑 없음: ${dest.name} (${dest.country})`)
      skipped++
      continue
    }

    const departureDate = calcDepartureDate(today, dest.month)

    try {
      const offer = await fetchLowestOffer(dest.iata_code, departureDate)

      if (!offer) {
        console.warn(
          `[no-result] ${dest.name} → ${dest.iata_code} (${departureDate}): 오퍼 없음`
        )
        skipped++
      } else {
        const priceKRW = convertToKRW(offer.amount, offer.currency, rateData)
        const priceStr = `₩${priceKRW.toLocaleString('ko-KR')}~`

        await pool.query(
          `UPDATE destinations
           SET "averageFlightPrice" = $1,
               price_updated_at     = NOW(),
               price_source         = 'duffel'
           WHERE id = $2`,
          [priceStr, dest.id]
        )
        console.log(
          `[updated] ${dest.name}: ${priceStr}` +
          ` (원본: ${offer.amount} ${offer.currency}, 출발일: ${departureDate})`
        )
        updated++
      }
    } catch (err) {
      console.error(`[error] ${dest.name} (${dest.iata_code}):`, err.message)
      failed++
    }

    await sleep(DELAY_MS)
  }

  const result = { updated, skipped, failed }
  console.log('[FlightPriceUpdater] 완료:', result)
  return result
}
