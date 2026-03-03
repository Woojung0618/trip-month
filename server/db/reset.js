/**
 * destinations 테이블을 삭제 후 schema 적용 + seed-data.csv로 초기 삽입.
 * 사용: npm run db:reset
 */
import './load-dotenv.js'
import pool from './connection.js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { runSeed } from './seed.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function reset() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL이 설정되지 않았습니다.')
    process.exit(1)
  }
  await pool.query('DROP TABLE IF EXISTS destinations')
  const schema = readFileSync(join(__dirname, 'schema.pg.sql'), 'utf8')
  await pool.query(schema)
  console.log('테이블 초기화 완료. seed 데이터 삽입 중...')
  await runSeed({ force: true })
}

reset().catch((err) => {
  console.error(err)
  process.exit(1)
})
