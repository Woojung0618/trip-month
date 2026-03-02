/**
 * seed-sample-backup.json 데이터만 INSERT. 기존 DB 데이터는 건드리지 않음.
 * 실행: node server/db/seed-insert-backup.js (프로젝트 루트) 또는 cd server && node db/seed-insert-backup.js
 */
import db from './connection.js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backupPath = join(__dirname, 'seed-sample-backup.json')

const raw = readFileSync(backupPath, 'utf8')
const { rows } = JSON.parse(raw)

const insert = db.prepare(`
  INSERT INTO destinations ("month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

let count = 0
for (const row of rows) {
  // backup JSON에는 emoji(인덱스 13) 포함 → 제거 후 삽입
  const withoutEmoji = [...row.slice(0, 13), row[14], row[15]]
  insert.run(...withoutEmoji)
  count++
}

console.log(`seed-sample-backup.json에서 ${count}건 INSERT 완료. (기존 데이터 유지)`)
