const API_BASE = '/api'

export interface Destination {
  id: number
  month: number
  name: string
  /** 도시 한줄 소개 (모달 상단 도시명 밑 표시) */
  tagline?: string
  /** 국가 코드 (ISO 2자리, 예: jp). 위·경도 없으면 지도는 국가 중심에 핀 표시 */
  country: string
  /** 날씨 설명 (예: 쾌적함, 맑음) */
  weather: string
  /** 온도 (예: 20-30°C) */
  temperature: string
  reason: string
  imageUrl: string
  averageFlightPrice: string
  affiliateUrl: string
  /** 말풍선용: 직항·비행시간 (예: "직항 4시간") */
  flightTime: string
  /** 팝업 CTA 아래 제휴 안내 (예: "트립닷컴 제휴 할인 코드 적용 가능") */
  affiliateNote: string
  /** CTA 버튼 문구 (예: "이번 달 최저가 항공권 확인하기 →") */
  ctaButtonText: string
  /** 도시 위도 (-90~90). 있으면 지도에 이 좌표로 핀 표시 */
  latitude?: number | null
  /** 도시 경도 (-180~180). 있으면 지도에 이 좌표로 핀 표시 */
  longitude?: number | null
}

export async function getDestinations(month?: number): Promise<Destination[]> {
  const url = month != null ? `${API_BASE}/destinations?month=${month}` : `${API_BASE}/destinations`
  const res = await fetch(url)
  if (!res.ok) throw new Error('목적지 목록을 불러오지 못했습니다.')
  return res.json()
}

/** 같은 name+country인 목적지가 추천되는 모든 월(1–12) 반환. */
export async function getDestinationMonths(name: string, country: string): Promise<number[]> {
  const params = new URLSearchParams({ name: name.trim(), country: country.trim().toLowerCase() })
  const res = await fetch(`${API_BASE}/destinations/months?${params}`)
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data.months) ? data.months : []
}

export type CreateDestinationInput = {
  month: number
  name: string
  country: string
  tagline?: string
  weather?: string
  temperature?: string
  reason?: string
  imageUrl?: string
  averageFlightPrice?: string
  affiliateUrl?: string
  flightTime?: string
  affiliateNote?: string
  ctaButtonText?: string
  latitude?: number | null
  longitude?: number | null
}

export async function createDestination(data: CreateDestinationInput): Promise<Destination> {
  const res = await fetch(`${API_BASE}/destinations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || '추가에 실패했습니다.')
  }
  return res.json()
}

export type UpdateDestinationInput = Partial<
  Omit<Destination, 'id'>
>

export async function updateDestination(
  id: number,
  data: UpdateDestinationInput
): Promise<Destination> {
  const res = await fetch(`${API_BASE}/destinations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('수정에 실패했습니다.')
  return res.json()
}

export async function deleteDestination(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/destinations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('삭제에 실패했습니다.')
}

export async function adminLogin(password: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  return data
}

export async function updateFlightPrices(password: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/admin/update-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.json()
}
