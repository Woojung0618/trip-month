import { useState } from 'react'
import { Marker } from 'react-simple-maps'
import type { Destination } from '../api/client'
import { codeToNameKo } from '../data/countries'
import { countryCodeToFlag } from './SpeechBubble'

interface DestinationMarkerProps {
  coordinates: [number, number]
  destination: Destination
  /** 지도 zoom 레벨. 확대 시 마커 원이 일정한 크기로 보이도록 scale(1/zoom) 보정에 사용 */
  zoom?: number
  onClick: () => void
}

/** TopoJSON 지도 위 마커: 국가 대표 이모지 원형 버튼 + 호버 시 툴팁 (ref 스타일).
 *  zoom 전달 시 scale(1/zoom)으로 지도 확대/축소와 관계없이 원 크기 유지 */
export default function DestinationMarker({ coordinates, destination, zoom = 1, onClick }: DestinationMarkerProps) {
  const [hover, setHover] = useState(false)
  const { name, country, weather, temperature, flightTime, averageFlightPrice } = destination
  const countryName = codeToNameKo(country)
  const line2 = [weather, temperature, flightTime].filter(Boolean).join(' · ')
  /** 항상 국기 이모지로 표시 (국가 코드 2자리가 아니면 빈 문자열) */
  const displayEmoji = countryCodeToFlag(country) || '🏳️'

  return (
    <Marker coordinates={coordinates}>
      <g
        transform={zoom !== 1 ? `scale(${1 / zoom})` : undefined}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        {/* 펄스 배경 링 */}
        <circle
          r={20}
          fill="var(--color-primary-muted)"
          style={{ animation: 'destination-marker-ping 2s ease-out infinite' }}
        />
        {/* 메인 버튼 배경: 흰 원 + 파란 테두리 (ref 스타일) */}
        <circle
          r={16}
          fill="white"
          stroke="var(--color-primary)"
          strokeWidth={3}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
        />
        {/* 이모지 */}
        <text
          textAnchor="middle"
          y={6}
          fontSize="20"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {displayEmoji}
        </text>

        {/* 호버 시 툴팁 — 내부 콘텐츠가 모두 들어가도록 여유 크기 (220×118) */}
        {hover && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={-110}
              y={-136}
              width={220}
              height={118}
              rx={12}
              fill="white"
              stroke="var(--color-border)"
              strokeWidth={2}
              filter={`url(#marker-shadow-${destination.id})`}
            />
            <polygon
              points="-8,-18 8,-18 0,-8"
              fill="white"
              stroke="var(--color-border)"
              strokeWidth={2}
            />
            <text x={0} y={-116} textAnchor="middle" fontSize="24" style={{ fill: 'var(--color-text)' }}>
              {displayEmoji}
            </text>
            <text x={0} y={-93} textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: 'var(--color-text)' }}>
              {name}
            </text>
            <text x={0} y={-76} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--color-text-muted-2)' }}>
              {countryName}
            </text>
            {line2 && (
              <text x={0} y={-59} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--color-text-muted-2)' }}>
                {line2}
              </text>
            )}
            {averageFlightPrice && (
              <text x={0} y={-42} textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-primary)' }}>
                ✈️ 최근 7일 최저가 {averageFlightPrice}
              </text>
            )}
          </g>
        )}
      </g>
      <defs>
        <filter id={`marker-shadow-${destination.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx={0} dy={4} stdDeviation={6} floodOpacity={0.15} />
        </filter>
      </defs>
    </Marker>
  )
}
