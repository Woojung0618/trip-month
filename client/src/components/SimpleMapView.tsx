import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import {
  FIGMA_COUNTRY_LAYOUT,
  FIGMA_MAP_BOUNDS,
  VIEWBOX_W,
  VIEWBOX_H,
  getCountryViewBoxCenter,
} from '../data/figmaCountryLayout'
import { latLngToViewBox } from '../utils/mapCoord'

/** 레이아웃에는 있으나 public/countries에 PNG가 없는 코드 — 이미지 요청 생략으로 404/깨진 아이콘 방지 */
const CODES_WITHOUT_PNG = new Set(['gp', 'xj', 'xn', 'xo', 'xp', 'xs'])

/** Figma 좌표 → viewBox (x·y 동일 스케일로 비율 유지) */
function figmaToViewBox(f: { x: number; y: number; width: number; height: number }) {
  const b = FIGMA_MAP_BOUNDS
  const scale = VIEWBOX_W / b.width
  return {
    x: (f.x - b.x) * scale,
    y: (f.y - b.y) * scale,
    width: f.width * scale,
    height: f.height * scale,
  }
}
import SpeechBubble from './SpeechBubble'
import type { Destination } from '../api/client'
import { codeToNameKo } from '../data/countries'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

/** 핀이 있는 국가 강조 색 (파란색) */
const HIGHLIGHT_COLOR = 'var(--color-primary)'

interface SimpleMapViewProps {
  destinations: Destination[]
  onSelectDestination: (d: Destination) => void
  /** 확대/축소·패닝 유지용 (월 변경 시에도 유지) */
  zoom?: number
  pan?: { x: number; y: number }
  onZoomChange?: (zoom: number) => void
  onPanChange?: (pan: { x: number; y: number }) => void
  /** 핀이 있는 국가 강조 색 (hex). 미지정 시 HIGHLIGHT_COLOR(파란색) */
  highlightedCountryColor?: string
}

/**
 * 지도 뷰 — Figma Map 국가 단위 PNG, 확대/축소·드래그 패닝 지원.
 */
export default function SimpleMapView({
  destinations,
  onSelectDestination,
  zoom: controlledZoom,
  pan: controlledPan,
  onZoomChange,
  onPanChange,
  highlightedCountryColor = HIGHLIGHT_COLOR,
}: SimpleMapViewProps) {
  const [internalZoom, setInternalZoom] = useState(1)
  const [internalPan, setInternalPan] = useState({ x: 0, y: 0 })
  const zoom = controlledZoom ?? internalZoom
  const pan = controlledPan ?? internalPan
  const setZoom = useCallback(
    (v: number | ((prev: number) => number)) => {
      const next = typeof v === 'function' ? v(zoom) : v
      onZoomChange?.(next)
      if (onZoomChange == null) setInternalZoom(next)
    },
    [zoom, onZoomChange]
  )
  const setPan = useCallback(
    (v: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
      const next = typeof v === 'function' ? v(pan) : v
      onPanChange?.(next)
      if (onPanChange == null) setInternalPan(next)
    },
    [pan, onPanChange]
  )
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapAreaRef = useRef<HTMLDivElement>(null)
  const [mapAreaSize, setMapAreaSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = mapAreaRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setMapAreaSize({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    setMapAreaSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  /** 도시 위·경도가 있으면 해당 좌표에, 없으면 국가 viewBox 중심에 핀 표시. 레이아웃에 없는 국가는 제외 */
  const points = useMemo(() => {
    return destinations
      .map((d) => {
        const pos =
          d.latitude != null && d.longitude != null
            ? latLngToViewBox(d.longitude, d.latitude, VIEWBOX_W, VIEWBOX_H)
            : getCountryViewBoxCenter(d.country)
        if (!pos) return null
        return { ...d, x: pos.x, y: pos.y }
      })
      .filter((p): p is Destination & { x: number; y: number } => p != null)
  }, [destinations])

  /** 이번 달 핀이 있는 국가 코드만 파란색(강조)으로 표시 */
  const highlightedCountryCodes = useMemo(
    () => new Set(destinations.map((d) => d.country.toLowerCase())),
    [destinations]
  )

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  }, [])
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    setZoom((z) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta))
    })
  }, [])

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest?.('.simple-map-pin')) return
    setIsDragging(true)
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }, [pan])
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current == null) return
    setPan({
      x: e.clientX - dragRef.current.x,
      y: e.clientY - dragRef.current.y,
    })
  }, [])
  const handleMouseUp = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])
  const handleMouseLeave = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 92px)',
        minHeight: 320,
        padding: '0 1rem 1rem',
        boxSizing: 'border-box',
        background: 'var(--gradient-map)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          background: 'var(--color-bg)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* 확대/축소 버튼 */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--color-bg)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-zoom)',
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            style={{
              width: 36,
              height: 32,
              border: 'none',
              background: zoom >= MAX_ZOOM ? 'var(--color-bg-disabled)' : 'var(--color-bg)',
              borderRadius: 6,
              fontSize: 18,
              fontWeight: 600,
              cursor: zoom >= MAX_ZOOM ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted-4)',
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            style={{
              width: 36,
              height: 32,
              border: 'none',
              background: zoom <= MIN_ZOOM ? 'var(--color-bg-disabled)' : 'var(--color-bg)',
              borderRadius: 6,
              fontSize: 18,
              fontWeight: 600,
              cursor: zoom <= MIN_ZOOM ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted-4)',
            }}
          >
            −
          </button>
        </div>

        {/* 확대/축소·패닝 적용 영역 (크기 측정용) */}
        <div
          ref={mapAreaRef}
          style={{ position: 'absolute', inset: 0 }}
        >
          {/* 지도만 확대/축소 (scale 적용) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '50% 50%',
              pointerEvents: 'none',
            }}
          >
            <svg
              viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              {highlightedCountryCodes.size > 0 && (
                <defs>
                  <filter id="country-highlight-tint" colorInterpolationFilters="sRGB">
                    <feColorMatrix
                      in="SourceGraphic"
                      type="matrix"
                      result="luminance"
                      values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"
                    />
                    <feFlood
                      floodColor={highlightedCountryColor}
                      floodOpacity={1}
                      result="tint"
                    />
                    <feBlend in="luminance" in2="tint" mode="multiply" result="tinted" />
                    <feComposite in="tinted" in2="SourceGraphic" operator="in" result="out" />
                  </filter>
                </defs>
              )}
              <g>
                {FIGMA_COUNTRY_LAYOUT.map((entry) => {
                  const v = figmaToViewBox(entry)
                  const hasPng = !CODES_WITHOUT_PNG.has(entry.code)
                  const highlight = highlightedCountryCodes.has(entry.code)
                  return (
                    <g key={entry.code}>
                      {hasPng && (
                        <image
                          href={`/countries/${entry.code}.png`}
                          x={v.x}
                          y={v.y}
                          width={v.width}
                          height={v.height}
                          preserveAspectRatio="xMidYMid meet"
                          {...(highlight && { filter: 'url(#country-highlight-tint)' })}
                        />
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
          </div>
          {/* 핀·말풍선 레이어: pan만 적용. 말풍선이 항상 핀 위에 오도록 2레이어로 분리 (z-index는 index.css 참고).
              말풍선이 가려질 때 Chrome으로 원인 확인: client/docs/DEBUGGING-MAP-LAYERS.md 참고. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              pointerEvents: 'none',
            }}
          >
            {mapAreaSize.width > 0 &&
              mapAreaSize.height > 0 && (() => {
                const cx = mapAreaSize.width / 2
                const cy = mapAreaSize.height / 2
                const getPinStyle = (p: (typeof points)[0]) => {
                  const px = (p.x / VIEWBOX_W) * mapAreaSize.width
                  const py = (p.y / VIEWBOX_H) * mapAreaSize.height
                  const left = cx + (px - cx) * zoom
                  const top = cy + (py - cy) * zoom
                  return {
                    left: `${left}px`,
                    top: `${top}px`,
                    pointerEvents: 'auto' as const,
                    transform: 'translate(-50%, -50%)',
                  }
                }
                const pinProps = (p: (typeof points)[0]) => ({
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation()
                    onSelectDestination(p)
                  },
                  onKeyDown: (e: React.KeyboardEvent) =>
                    e.key === 'Enter' && onSelectDestination(p),
                  role: 'button' as const,
                  tabIndex: 0,
                })
                return (
                  <>
                    <div
                      className="simple-map-pins-layer simple-map-pins-layer--pin"
                      data-map-layer="pin"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        pointerEvents: 'none',
                        isolation: 'isolate',
                      }}
                    >
                      {points.map((p) => (
                        <div
                          key={`pin-${p.id}`}
                          className="simple-map-pin"
                          style={getPinStyle(p)}
                          {...pinProps(p)}
                        >
                          <div className="simple-map-pin-pin" aria-hidden />
                        </div>
                      ))}
                    </div>
                    <div
                      className="simple-map-pins-layer simple-map-pins-layer--bubble"
                      data-map-layer="bubble"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'none',
                        isolation: 'isolate',
                      }}
                    >
                      {points.map((p) => (
                        <div
                          key={`bubble-${p.id}`}
                          className="simple-map-pin"
                          style={getPinStyle(p)}
                          {...pinProps(p)}
                        >
                          <SpeechBubble
                            countryCode={p.country}
                            countryName={codeToNameKo(p.country)}
                            placeName={p.name}
                            weather={p.weather || undefined}
                            reason={p.reason || undefined}
                            flightTime={p.flightTime || undefined}
                            averageFlightPrice={p.averageFlightPrice || undefined}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
          </div>
        </div>
      </div>
      {destinations.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted-3)', marginTop: '1rem' }}>
          이 달에 등록된 추천 여행지가 없습니다.
        </p>
      )}
    </div>
  )
}
