import './load-env.js'

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import cron from 'node-cron'
import destinations from './routes/destinations.js'
import admin from './routes/admin.js'
import { updateAllFlightPrices } from './jobs/updateFlightPrices.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientDist = join(__dirname, '..', 'client', 'dist')
const isProduction = existsSync(clientDist)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/destinations', destinations)
app.use('/api/admin', admin)

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

// 프로덕션: 클라이언트 빌드 정적 제공 + SPA 폴백
if (isProduction) {
  app.use(express.static(clientDist))
  app.get('*', (_, res) => {
    res.sendFile(join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  if (isProduction) console.log('Serving client build from client/dist')
})

// 항공권 가격 자동 업데이트 스케줄러
// 매일 03:00 KST = UTC 18:00 (전날)
// cron 표현식: '분 시 일 월 요일' → '0 18 * * *'
cron.schedule('0 18 * * *', async () => {
  console.log('[cron] 항공권 가격 업데이트 시작')
  try {
    await updateAllFlightPrices()
  } catch (err) {
    console.error('[cron] 항공권 가격 업데이트 실패:', err)
  }
})
console.log('[cron] 항공권 가격 스케줄러 등록 완료 (매일 03:00 KST)')
