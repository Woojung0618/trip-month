import { Router } from 'express'
import pool from '../db/connection.js'

const router = Router()
const COLS = 'id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at'

router.get('/', async (req, res) => {
  try {
    const { month } = req.query
    let result
    if (month != null) {
      const m = parseInt(month, 10)
      if (Number.isNaN(m) || m < 1 || m > 12) {
        return res.status(400).json({ error: 'month must be 1-12' })
      }
      result = await pool.query(`SELECT ${COLS} FROM destinations WHERE "month" = $1 ORDER BY id`, [m])
    } else {
      result = await pool.query(`SELECT ${COLS} FROM destinations ORDER BY "month", id`)
    }
    res.json(result.rows.map(rowToDestination))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/** 같은 name+country인 목적지가 추천되는 모든 월 반환 (1–12). 정렬됨. */
router.get('/months', async (req, res) => {
  try {
    const { name, country } = req.query
    if (!name || typeof name !== 'string' || !country || typeof country !== 'string') {
      return res.status(400).json({ error: 'name and country query params are required' })
    }
    const result = await pool.query(
      'SELECT DISTINCT "month" FROM destinations WHERE name = $1 AND country = $2 ORDER BY "month"',
      [String(name).trim(), String(country).trim().toLowerCase()]
    )
    res.json({ months: result.rows.map((r) => r.month) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { month, name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude } = req.body || {}
    const m = month != null ? parseInt(month, 10) : NaN
    if (Number.isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: 'month must be 1-12' })
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    if (!country || typeof country !== 'string' || !country.trim()) {
      return res.status(400).json({ error: 'country is required (국가 코드, 예: jp)' })
    }
    const countryCode = String(country).trim().toLowerCase()
    const lat = parseCoord(latitude)
    const lng = parseCoord(longitude)
    const result = await pool.query(
      `INSERT INTO destinations ("month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING ${COLS}`,
      [
        m,
        String(name).trim(),
        tagline != null ? String(tagline).trim() : '',
        countryCode,
        weather != null ? String(weather) : '',
        temperature != null ? String(temperature).trim() : '',
        reason != null ? String(reason) : '',
        imageUrl != null ? String(imageUrl) : '',
        averageFlightPrice != null ? String(averageFlightPrice) : '',
        affiliateUrl != null ? String(affiliateUrl) : '',
        flightTime != null ? String(flightTime).trim() : '',
        affiliateNote != null ? String(affiliateNote).trim() : '',
        ctaButtonText != null ? String(ctaButtonText).trim() : '',
        lat,
        lng,
      ]
    )
    const row = result.rows[0]
    res.status(201).json(rowToDestination(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const body = req.body || {}
    const updates = []
    const values = []
    const optional = [
      ['month', (v) => (v !== undefined && v !== null ? parseInt(v, 10) : null), (v) => !Number.isNaN(v) && v >= 1 && v <= 12],
      ['name', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['tagline', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['country', (v) => (v !== undefined ? String(v).trim().toLowerCase() : null), () => true],
      ['weather', (v) => (v !== undefined ? String(v) : null), () => true],
      ['temperature', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['reason', (v) => (v !== undefined ? String(v) : null), () => true],
      ['imageUrl', (v) => (v !== undefined ? String(v) : null), () => true],
      ['averageFlightPrice', (v) => (v !== undefined ? String(v) : null), () => true],
      ['affiliateUrl', (v) => (v !== undefined ? String(v) : null), () => true],
      ['flightTime', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['affiliateNote', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['ctaButtonText', (v) => (v !== undefined ? String(v).trim() : null), () => true],
      ['latitude', (v) => parseCoord(v), (v) => v == null || (typeof v === 'number' && v >= -90 && v <= 90)],
      ['longitude', (v) => parseCoord(v), (v) => v == null || (typeof v === 'number' && v >= -180 && v <= 180)],
    ]
    let idx = 0
    for (const [key, parse, validate] of optional) {
      const raw = body[key]
      if (raw === undefined) continue
      const parsed = parse(raw)
      if (parsed === null) continue
      if (!validate(parsed)) return res.status(400).json({ error: `Invalid ${key}` })
      idx++
      updates.push(key === 'month' ? `"month" = $${idx}` : `${key} = $${idx}`)
      values.push(key === 'month' ? parsed : (parsed ?? ''))
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)
    const idParam = idx + 1
    const setClause = updates.join(', ')
    const result = await pool.query(
      `UPDATE destinations SET ${setClause} WHERE id = $${idParam} RETURNING ${COLS}`,
      values
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rowToDestination(result.rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const result = await pool.query('DELETE FROM destinations WHERE id = $1', [id])
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

function parseCoord(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** pg는 따옴표 없는 컬럼명을 소문자로 반환하므로 둘 다 확인 */
function rowToDestination(row) {
  const get = (camel, lower) => (row[camel] ?? row[lower ?? camel.toLowerCase()] ?? '')
  const getNum = (camel, lower) => {
    const v = row[camel] ?? row[lower ?? camel.toLowerCase()]
    return v != null ? Number(v) : null
  }
  return {
    id: row.id,
    month: row.month != null ? Number(row.month) : row.month,
    name: row.name ?? '',
    tagline: get('tagline'),
    country: row.country ?? '',
    weather: get('weather'),
    temperature: get('temperature'),
    reason: get('reason'),
    imageUrl: get('imageUrl', 'imageurl'),
    averageFlightPrice: get('averageFlightPrice', 'averageflightprice'),
    affiliateUrl: get('affiliateUrl', 'affiliateurl'),
    flightTime: get('flightTime', 'flighttime'),
    affiliateNote: get('affiliateNote', 'affiliatenote'),
    ctaButtonText: get('ctaButtonText', 'ctabuttontext'),
    latitude: getNum('latitude'),
    longitude: getNum('longitude'),
  }
}

export default router
