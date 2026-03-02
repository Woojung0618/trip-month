import { Router } from 'express'
import db from '../db/connection.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const { month } = req.query
    let stmt
    let rows
    const cols = 'id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at'
    if (month != null) {
      const m = parseInt(month, 10)
      if (Number.isNaN(m) || m < 1 || m > 12) {
        return res.status(400).json({ error: 'month must be 1-12' })
      }
      stmt = db.prepare(`SELECT ${cols} FROM destinations WHERE "month" = ? ORDER BY id`)
      rows = stmt.all(m)
    } else {
      stmt = db.prepare(`SELECT ${cols} FROM destinations ORDER BY "month", id`)
      rows = stmt.all()
    }
    res.json(rows.map(rowToDestination))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/** 같은 name+country인 목적지가 추천되는 모든 월 반환 (1–12). 정렬됨. */
router.get('/months', (req, res) => {
  try {
    const { name, country } = req.query
    if (!name || typeof name !== 'string' || !country || typeof country !== 'string') {
      return res.status(400).json({ error: 'name and country query params are required' })
    }
    const stmt = db.prepare(
      'SELECT DISTINCT "month" FROM destinations WHERE name = ? AND country = ? ORDER BY "month"'
    )
    const rows = stmt.all(String(name).trim(), String(country).trim().toLowerCase())
    res.json({ months: rows.map((r) => r.month) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', (req, res) => {
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
    const stmt = db.prepare(`
      INSERT INTO destinations ("month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
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
      lng
    )
    const row = db.prepare('SELECT id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at FROM destinations WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(rowToDestination(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', (req, res) => {
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
    for (const [key, parse, validate] of optional) {
      const raw = body[key]
      if (raw === undefined) continue
      const parsed = parse(raw)
      if (parsed === null) continue
      if (!validate(parsed)) return res.status(400).json({ error: `Invalid ${key}` })
      updates.push(key === 'month' ? '"month" = ?' : `${key} = ?`)
      values.push(key === 'month' ? parsed : (key === 'latitude' || key === 'longitude' ? parsed : (parsed ?? '')))
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })
    updates.push("updated_at = datetime('now')")
    values.push(id)
    const stmt = db.prepare(
      `UPDATE destinations SET ${updates.join(', ')} WHERE id = ?`
    )
    const result = stmt.run(...values)
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
    const row = db.prepare('SELECT id, "month", name, tagline, country, weather, temperature, reason, imageUrl, averageFlightPrice, affiliateUrl, flightTime, affiliateNote, ctaButtonText, latitude, longitude, created_at, updated_at FROM destinations WHERE id = ?').get(id)
    res.json(rowToDestination(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const stmt = db.prepare('DELETE FROM destinations WHERE id = ?')
    const result = stmt.run(id)
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/** latitude/longitude: 빈 값·undefined → null, 숫자면 그대로(유효 범위는 PATCH에서 검사) */
function parseCoord(v) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function rowToDestination(row) {
  return {
    id: row.id,
    month: row.month != null ? Number(row.month) : row.month,
    name: row.name,
    tagline: row.tagline ?? '',
    country: row.country,
    weather: row.weather ?? '',
    temperature: row.temperature ?? '',
    reason: row.reason ?? '',
    imageUrl: row.imageUrl ?? '',
    averageFlightPrice: row.averageFlightPrice ?? '',
    affiliateUrl: row.affiliateUrl ?? '',
    flightTime: row.flightTime ?? '',
    affiliateNote: row.affiliateNote ?? '',
    ctaButtonText: row.ctaButtonText ?? '',
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
  }
}

export default router
