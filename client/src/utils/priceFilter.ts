/**
 * averageFlightPrice 문자열에서 숫자만 추출 (원, 만원 등 제거 후 파싱).
 * 예: "120,000원" → 120000, "약 50만원" → 500000
 */
export function parsePriceValue(s: string | undefined | null): number | null {
  if (s == null || typeof s !== 'string') return null
  const trimmed = s.trim()
  if (!trimmed) return null
  // 숫자와 쉼표만 먼저 추출
  const numStr = trimmed.replace(/,/g, '').replace(/[^\d.]/g, '')
  const num = parseFloat(numStr)
  if (Number.isNaN(num)) return null
  // "만" 있으면 10000 곱
  if (/만|천/.test(trimmed)) {
    if (/천/.test(trimmed) && !/만/.test(trimmed)) return num * 1000
    return num * 10000
  }
  return num
}
