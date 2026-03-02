import db from './connection.js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
db.exec(schema)
db.exec('DELETE FROM destinations')

const insert = db.prepare(`
  INSERT INTO destinations ("month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

/** CSV 한 줄 파싱 (쌍따옴표 안의 쉼표 무시, "" → ") */
function parseCSVLine(line) {
  const result = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let field = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            field += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          field += line[i++]
        }
      }
      result.push(field)
      if (line[i] === ',') i++
    } else {
      let end = line.indexOf(',', i)
      if (end === -1) end = line.length
      result.push(line.slice(i, end).trim())
      i = end + 1
    }
  }
  return result
}

const DEFAULT_CTA = '트립닷컴에서 항공권 확인하기'
const csvPath = join(__dirname, 'seed-data.csv')
const raw = readFileSync(csvPath, 'utf8')
const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
const header = lines[0]
const dataLines = lines.slice(1)

// CSV 컬럼 순서: 월, 이름, 한줄 소개, 국가, 날씨, 온도, 추천 이유, 이미지 URL, 항공권 가격, 비행시간, 제휴 링크, 제휴 안내, CTA 문구, 위도, 경도
const idx = {
  month: 0,
  name: 1,
  tagline: 2,
  country: 3,
  weather: 4,
  temperature: 5,
  reason: 6,
  imageUrl: 7,
  averageFlightPrice: 8,
  flightTime: 9,
  affiliateUrl: 10,
  affiliateNote: 11,
  ctaButtonText: 12,
  latitude: 13,
  longitude: 14,
}

let inserted = 0
for (const line of dataLines) {
  if (!line.trim()) continue
  const cols = parseCSVLine(line)
  const month = parseInt(cols[idx.month], 10)
  const name = cols[idx.name] ?? ''
  const tagline = cols[idx.tagline] ?? ''
  const country = (cols[idx.country] ?? '').trim().toLowerCase()
  const weather = cols[idx.weather] ?? ''
  const temperature = cols[idx.temperature] ?? ''
  const reason = cols[idx.reason] ?? ''
  const imageUrl = cols[idx.imageUrl] ?? ''
  const averageFlightPrice = cols[idx.averageFlightPrice] ?? ''
  const flightTime = cols[idx.flightTime] ?? ''
  const affiliateUrl = cols[idx.affiliateUrl] ?? ''
  const affiliateNote = cols[idx.affiliateNote] ?? ''
  const ctaButtonText = (cols[idx.ctaButtonText] ?? '').trim() || DEFAULT_CTA
  const lat = cols[idx.latitude]?.trim()
  const lon = cols[idx.longitude]?.trim()
  const latitude = lat === '' || lat == null ? null : parseFloat(lat)
  const longitude = lon === '' || lon == null ? null : parseFloat(lon)

  if (!country || !name) continue

  insert.run(
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
    longitude
  )
  inserted++
}

console.log('DB 초기화 및 시드 데이터 입력 완료.')
console.log(`총 ${inserted}건 삽입 (seed-data.csv 기반).`)
