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
  /** 지도 컨테이너 너비(px). 주어지면 뷰포트가 달라져도 마커 픽셀 크기 일정 유지 */
  containerWidth?: number
  /** 마커 기준 너비 (containerWidth와 함께 사용) */
  referenceWidth?: number
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
  containerWidth,
  referenceWidth = 600,
  onClick,
  onTooltipShow,
  onTooltipHide,
}: DestinationMarkerProps) {
  const { country } = destination
  const displayEmoji = countryCodeToFlag(country) || '🏳️'

  // 줌 시: scale(1/zoom)으로 마커가 지도와 함께 커지지 않도록 유지.
  // 뷰포트: 가로가 좁을 때만 scale up (넓은 화면에서는 1 유지해서 원래 크기).
  const viewportScale =
    containerWidth != null && containerWidth > 0 && containerWidth < referenceWidth
      ? referenceWidth / containerWidth
      : 1
  const scale = viewportScale * (1 / zoom)

  return (
    <Marker coordinates={coordinates}>
      <g
        transform={scale !== 1 ? `scale(${scale})` : undefined}
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
          style={{ animation: 'destination-marker-ping 2s ease-out infinite', pointerEvents: 'none' }}
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
