import { Router } from 'express'

const router = Router()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

router.post('/login', (req, res) => {
  const { password } = req.body || {}
  const ok = password === ADMIN_PASSWORD
  res.json({ ok })
})

export default router
