import * as XLSX from 'xlsx'
import { nameKoToCode } from '../data/countries'
import type { CreateDestinationInput } from '../api/client'

const EXCEL_HEADERS = [
  '월',
  '도시명',
  '한줄 소개',
  '국가명',
  '대표이모지',
  '날씨',
  '온도',
  '추천이유',
  '대표 이미지 URL',
  '항공권 가격',
  '비행시간',
] as const

function findColumnIndex(headers: unknown[], name: string): number {
  const s = String(name).trim()
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] ?? '').trim() === s) return i
  }
  return -1
}

function cellStr(row: unknown[], col: number): string {
  const v = row[col]
  if (v == null) return ''
  return String(v).trim()
}

function cellNum(row: unknown[], col: number, fallback: number): number {
  const v = row[col]
  if (v == null || v === '') return fallback
  if (typeof v === 'number' && !Number.isNaN(v)) return Math.round(v)
  const n = Number(String(v).trim())
  return Number.isNaN(n) ? fallback : Math.round(n)
}

/**
 * 엑셀 파일에서 첫 시트를 읽어 CreateDestinationInput[] 반환.
 * 헤더: 월, 도시명, 한줄 소개, 국가명, 대표이모지, 날씨, 온도, 추천이유, 대표 이미지 URL, 항공권 가격, 비행시간
 */
export async function parseExcelToDestinations(file: File): Promise<CreateDestinationInput[]> {
  const data = await file.arrayBuffer()
  const wb = XLSX.read(data, { type: 'array' })
  const firstSheetName = wb.SheetNames[0]
  if (!firstSheetName) return []
  const sheet = wb.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
  if (rows.length < 2) return []

  const headerRow = rows[0]
  const colMap: Record<string, number> = {}
  for (const name of EXCEL_HEADERS) {
    const idx = findColumnIndex(headerRow, name)
    if (idx >= 0) colMap[name] = idx
  }

  const monthCol = colMap['월'] ?? findColumnIndex(headerRow, '월')
  const nameCol = colMap['도시명'] ?? findColumnIndex(headerRow, '도시명')
  if (nameCol < 0) return []

  const results: CreateDestinationInput[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const name = cellStr(row, nameCol)
    if (!name) continue

    const countryRaw = cellStr(row, colMap['국가명'] ?? -1)
    const country = countryRaw ? nameKoToCode(countryRaw) : ''

    results.push({
      month: Math.min(12, Math.max(1, cellNum(row, monthCol, 1))),
      name,
      country: country || 'xx',
      tagline: cellStr(row, colMap['한줄 소개'] ?? -1) || undefined,
      weather: cellStr(row, colMap['날씨'] ?? -1) || undefined,
      temperature: cellStr(row, colMap['온도'] ?? -1) || undefined,
      reason: cellStr(row, colMap['추천이유'] ?? -1) || undefined,
      imageUrl: cellStr(row, colMap['대표 이미지 URL'] ?? -1) || undefined,
      averageFlightPrice: cellStr(row, colMap['항공권 가격'] ?? -1) || undefined,
      flightTime: cellStr(row, colMap['비행시간'] ?? -1) || undefined,
    })
  }
  return results
}
