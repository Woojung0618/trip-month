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
// 완료까지 대기 후 결과 반환 (약 60~120초 소요)
router.post('/update-prices', async (req, res) => {
  const { password } = req.body || {}
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: '인증 실패' })
  }
  try {
    const result = await updateAllFlightPrices()
    const msg = `완료: ${result.updated}개 업데이트, ${result.skipped}개 건너뜀, ${result.failed}개 실패`
    res.json({ ok: true, message: msg, result })
  } catch (err) {
    console.error('[admin/update-prices] 실패:', err)
    res.status(500).json({ ok: false, message: `오류: ${err.message}` })
  }
})

export default router
