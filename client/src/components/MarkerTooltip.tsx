import type { Destination } from '../api/client'
import { codeToNameKo } from '../data/countries'
import { countryCodeToFlag } from './DestinationMarker'

interface MarkerTooltipProps {
  x: number
  y: number
  destination: Destination
}

/** 지도 위에 absolute로 띄우는 HTML 툴팁.
 *  부모 컨테이너가 position: relative 이어야 합니다. */
export default function MarkerTooltip({ x, y, destination }: MarkerTooltipProps) {
  const { name, country, weather, temperature, flightTime, averageFlightPrice } = destination
  const countryName = codeToNameKo(country)
  const displayEmoji = countryCodeToFlag(country) || '🏳️'
  const line2 = [weather, temperature, flightTime].filter(Boolean).join(' · ')

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, calc(-100% - 20px))',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* 말풍선 본체 */}
      <div
        style={{
          background: 'white',
          border: '2px solid var(--color-border)',
          borderRadius: 12,
          padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          minWidth: 160,
          maxWidth: 220,
          textAlign: 'center',
          fontFamily: 'inherit',
        }}
      >
        {/* 이모지 */}
        <div style={{ fontSize: 24, lineHeight: 1.3 }}>
          {displayEmoji}
        </div>

        {/* 도시명 */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text)',
            marginTop: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>

        {/* 국가명 */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-muted-2)',
            marginTop: 2,
          }}
        >
          {countryName}
        </div>

        {/* 날씨 · 기온 · 비행시간 */}
        {line2 && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted-2)',
              marginTop: 4,
            }}
          >
            {line2}
          </div>
        )}

        {/* 최저가 */}
        {averageFlightPrice && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginTop: 6,
              paddingTop: 6,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            ✈️ 최근 7일 최저가 {averageFlightPrice}
          </div>
        )}
      </div>

      {/* 말풍선 꼬리 */}
      <div
        style={{
          position: 'absolute',
          bottom: -11,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '9px solid transparent',
          borderRight: '9px solid transparent',
          borderTop: '11px solid var(--color-border)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -9,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: '9px solid white',
        }}
      />
    </div>
  )
}
