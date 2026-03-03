// .env 로드를 pool 생성보다 먼저 하기 위해 반드시 첫 번째 import
import './load-dotenv.js'
import pool from './connection.js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_CTA = '트립닷컴에서 항공권 확인하기'
const INSERT_SQL = `
  INSERT INTO destinations ("month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
`

/**
 * @param {{ force?: boolean }} options - force: true면 데이터 개수 확인 없이 CSV 삽입 (db:reset용)
 */
export async function runSeed(options = {}) {
  const { force = false } = options

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL이 설정되지 않았습니다. .env에 Supabase PostgreSQL URL을 넣어주세요.')
    process.exit(1)
  }

  // 테이블 없을 때만 생성 (DROP 없음 → 재배포해도 데이터 보존)
  const schemaPath = join(__dirname, 'schema.pg.sql')
  const schema = readFileSync(schemaPath, 'utf8')
  await pool.query(schema)

  // 데이터가 이미 있으면 seed 스킵 → 관리자가 수정한 데이터 보존 (force 시 스킵 안 함)
  if (!force) {
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM destinations')
    const count = Number(rows[0]?.count ?? 0) || 0
    if (count > 0) {
      console.log(`destinations 테이블에 이미 ${count}건이 있습니다. seed를 스킵합니다.`)
      console.log('데이터를 초기화하려면 npm run db:reset 을 실행하세요.')
      await pool.end()
      return
    }
  }

  // 테이블이 비어있을 때만 CSV에서 초기 데이터 삽입
  const csvPath = join(__dirname, 'seed-data.csv')
  let raw = readFileSync(csvPath, 'utf8')
  raw = raw.replace(/^\uFEFF/, '') // BOM 제거
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
    trim: true,
  })

  let inserted = 0
  for (const r of records) {
    const month = parseInt(r['월'], 10)
    const name = (r['이름'] ?? '').trim()
    const tagline = (r['한줄 소개'] ?? '').trim()
    const country = (r['국가'] ?? '').trim().toLowerCase()
    const weather = (r['날씨'] ?? '').trim()
    const temperature = (r['온도'] ?? '').trim()
    const reason = (r['추천 이유'] ?? '').trim()
    const imageUrl = (r['이미지 URL'] ?? '').trim()
    const averageFlightPrice = (r['항공권 가격'] ?? '').trim()
    const flightTime = (r['비행시간'] ?? '').trim()
    const affiliateUrl = (r['제휴 링크'] ?? '').trim()
    const affiliateNote = (r['제휴 안내'] ?? '').trim()
    const ctaButtonText = (r['CTA 문구'] ?? '').trim() || DEFAULT_CTA
    const lat = (r['위도'] ?? '').trim()
    const lon = (r['경도'] ?? '').trim()
    const latitude = lat === '' || lat == null ? null : parseFloat(lat)
    const longitude = lon === '' || lon == null ? null : parseFloat(lon)

    if (!country || !name || Number.isNaN(month) || month < 1 || month > 12) continue

    await pool.query(INSERT_SQL, [
      month,
      name,
      tagline,
      country,
      weather,
      temperature,
      reason,
      imageUrl,
      averageFlightPrice,
      affiliateUrl,
      flightTime,
      affiliateNote,
      ctaButtonText,
      latitude,
      longitude,
    ])
    inserted++
  }

  console.log(`초기 데이터 삽입 완료: ${inserted}건`)
  await pool.end()
}

// 직접 실행할 때만 시드 실행 (reset.js에서 import 시에는 실행하지 않음)
const isSeedMain = process.argv[1]?.endsWith('seed.js')
if (isSeedMain) {
  runSeed().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
