import { Router } from 'express'
import { updateAllFlightPrices } from '../jobs/updateFlightPrices.js'

const router = Router()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

router.post('/login', (req, res) => {
  const { password } = req.body || {}
  const ok = password === ADMIN_PASSWORD
  res.json({ ok })
})

// 항공권 가격 수동 업데이트 트리거
// POST /api/admin/update-prices  { "password": "..." }
router.post('/update-prices', (req, res) => {
  const { password } = req.body || {}
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: '인증 실패' })
  }
  // 응답 먼저 반환 후 백그라운드 실행 (124개 처리에 약 60초 소요)
  res.json({ ok: true, message: '가격 업데이트가 시작되었습니다. 약 60초 후 완료됩니다.' })
  updateAllFlightPrices().catch((err) =>
    console.error('[admin/update-prices] 실패:', err)
  )
})

export default router
