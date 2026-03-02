import { Marker } from 'react-simple-maps'
import type { Destination } from '../api/client'

/** ISO 3166-1 alpha-2 코드 → 깃발 이모지 (예: jp → 🇯🇵) */
export function countryCodeToFlag(code: string): string {
  const c = code.trim().toLowerCase()
  if (c.length !== 2 || c < 'aa' || c > 'zz') return ''
  return String.fromCodePoint(
    0x1f1e6 + (c.charCodeAt(0) - 97),
    0x1f1e6 + (c.charCodeAt(1) - 97)
  )
}

export interface TooltipState {
  x: number
  y: number
  destination: Destination
}

interface DestinationMarkerProps {
  coordinates: [number, number]
  destination: Destination
  zoom?: number
  onClick: () => void
  onTooltipShow: (state: TooltipState) => void
  onTooltipHide: () => void
}

/** TopoJSON 지도 위 마커: 국가 대표 이모지 원형 버튼.
 *  툴팁은 부모에서 HTML로 렌더링 (지도 밖 absolute 툴팁). */
export default function DestinationMarker({
  coordinates,
  destination,
  zoom = 1,
  onClick,
  onTooltipShow,
  onTooltipHide,
}: DestinationMarkerProps) {
  const { country } = destination
  const displayEmoji = countryCodeToFlag(country) || '🏳️'

  return (
    <Marker coordinates={coordinates}>
      <g
        transform={zoom !== 1 ? `scale(${1 / zoom})` : undefined}
        onMouseEnter={(e) => {
          const el = (e.target as SVGElement).closest('svg')
          const container = el?.closest('[data-map-container="true"]') as HTMLElement | null
          const rect = container?.getBoundingClientRect() ?? el?.getBoundingClientRect() ?? { left: 0, top: 0 }
          onTooltipShow({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            destination,
          })
        }}
        onMouseMove={(e) => {
          const el = (e.target as SVGElement).closest('svg')
          const container = el?.closest('[data-map-container="true"]') as HTMLElement | null
          const rect = container?.getBoundingClientRect() ?? el?.getBoundingClientRect() ?? { left: 0, top: 0 }
          onTooltipShow({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            destination,
          })
        }}
        onMouseLeave={onTooltipHide}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        <circle
          r={20}
          fill="var(--color-primary-muted)"
          style={{ animation: 'destination-marker-ping 2s ease-out infinite' }}
        />
        <circle
          r={16}
          fill="white"
          stroke="var(--color-primary)"
          strokeWidth={3}
          style={{ filter: 'drop-shadow(var(--shadow-marker))' }}
        />
        <text
          textAnchor="middle"
          y={6}
          fontSize="20"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {displayEmoji}
        </text>
      </g>
    </Marker>
  )
}
