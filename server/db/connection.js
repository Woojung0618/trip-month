import pg from 'pg'

const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.warn('DATABASE_URL이 설정되지 않았습니다. .env에 postgresql://... 형식으로 추가하세요.')
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export default pool
