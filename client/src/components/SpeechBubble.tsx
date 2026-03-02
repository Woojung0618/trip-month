/** ISO 3166-1 alpha-2 코드 → 깃발 이모지 (예: jp → 🇯🇵) */
export function countryCodeToFlag(code: string): string {
  const c = code.trim().toLowerCase()
  if (c.length !== 2 || c < 'aa' || c > 'zz') return ''
  return String.fromCodePoint(
    0x1f1e6 + (c.charCodeAt(0) - 97),
    0x1f1e6 + (c.charCodeAt(1) - 97)
  )
}

export interface SpeechBubbleProps {
  /** 국가 코드 (ISO 2자리). 깃발 이모지용 */
  countryCode: string
  /** 국가 한글명 */
  countryName: string
  /** 도시/여행지명 */
  placeName: string
  /** 날씨 요약 (예: "지금 가면 따뜻함(24°C)") */
  weather?: string
  /** 해당 월 키워드 한 줄 (예: "벚꽃 축제") */
  reason?: string
  /** 직항·비행시간 (예: "직항 4시간") */
  flightTime?: string
  /** 평균 항공권 가격 — "최근 7일 최저가" 워딩으로 표기 */
  averageFlightPrice?: string
  className?: string
}

/**
 * 말풍선 UI — 플랜: 1줄 국가/도시, 2줄 날씨+비행시간, 3줄 키워드+최저가.
 * 지도 핀 등에서 사용.
 */
export default function SpeechBubble({
  countryCode,
  countryName,
  placeName,
  weather,
  reason,
  flightTime,
  averageFlightPrice,
  className = '',
}: SpeechBubbleProps) {
  const flag = countryCodeToFlag(countryCode)
  const line2 = [weather, flightTime].filter(Boolean).join(' · ')
  const line3Parts: string[] = []
  if (reason) line3Parts.push(reason)
  const hasPrice = Boolean(averageFlightPrice)

  return (
    <div className={`map-speech-bubble ${className}`.trim()}>
      {flag && <span style={{ marginRight: 6 }}>{flag}</span>}
      <div style={{ lineHeight: 1.35 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>
          {placeName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted-2)', marginTop: 2 }}>
          {countryName}
        </div>
        {line2 && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted-2)', marginTop: 2 }}>
            {line2}
          </div>
        )}
        {line3Parts.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted-2)', marginTop: 2 }}>
            {line3Parts.join(' · ')}
          </div>
        )}
        {hasPrice && (
          <div style={{ fontSize: 12, color: 'var(--color-link)', fontWeight: 600, marginTop: 2 }}>
            ✈️ 최근 7일 최저가 {averageFlightPrice}
          </div>
        )}
      </div>
    </div>
  )
}
