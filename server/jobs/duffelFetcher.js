// Duffel API 클라이언트
// POST /air/offer_requests?return_offers=true
// 인증: Authorization: Bearer {DUFFEL_API_TOKEN}
// Rate Limit: 120 req/60s

const BASE_URL = 'https://api.duffel.com'

/**
 * ICN(인천) 출발 → 목적지 편도 이코노미 최저가 조회
 * @param {string} iataCode      목적지 IATA 코드 (예: 'BKK')
 * @param {string} departureDate 출발일 "YYYY-MM-DD" 포맷
 * @returns {Promise<{amount: number, currency: string}|null>} 오퍼 없으면 null
 */
export async function fetchLowestOffer(iataCode, departureDate) {
  const res = await fetch(
    `${BASE_URL}/air/offer_requests?return_offers=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DUFFEL_API_TOKEN}`,
        'Duffel-Version': 'v2',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          slices: [
            {
              origin: 'ICN',
              destination: iataCode,
              departure_date: departureDate,
            },
          ],
          passengers: [{ type: 'adult' }],
          cabin_class: 'economy',
        },
      }),
    }
  )

  if (res.status === 429) throw new Error('Rate limit exceeded')

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Duffel API error ${res.status}: ${errText}`)
  }

  const json = await res.json()
  const offers = json.data?.offers

  if (!offers || offers.length === 0) return null

  // total_amount 오름차순 정렬 → 최저가 선택
  offers.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
  const cheapest = offers[0]

  return {
    amount: parseFloat(cheapest.total_amount),
    currency: cheapest.total_currency, // 예: "GBP", "USD"
  }
}
