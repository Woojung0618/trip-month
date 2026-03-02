import { useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  type GeographyObject,
} from 'react-simple-maps'
import type { Destination } from '../api/client'
import { getCountryCentroid } from '../data/countryCentroids'
import DestinationMarker, { type TooltipState } from './DestinationMarker'
import MarkerTooltip from './MarkerTooltip'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const MIN_ZOOM = 0.5
const MAX_ZOOM = 8
const ZOOM_STEP = 0.5

interface WorldMapProps {
  destinations: Destination[]
  onDestinationClick: (destination: Destination) => void
}

/**
 * TopoJSON 기반 세계 지도.
 * 위·경도가 있으면 해당 도시 좌표 사용, 없으면 국가 중심(countryCentroids) 사용.
 * zoom 상태를 마커에 전달해, 확대 시에도 마커 원 크기는 일정하게 유지(scale 1/zoom 보정).
 */
export default function WorldMap({ destinations, onDestinationClick }: WorldMapProps) {
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([0, 20])
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const handleMoveEnd = useCallback(
    (payload: { coordinates: [number, number]; zoom: number }) => {
      if (payload.coordinates != null) setCenter(payload.coordinates)
      if (payload.zoom != null) setZoom(payload.zoom)
    },
    []
  )

  const pointsWithCoords = destinations
    .map((dest) => {
      const coordinates: [number, number] | null =
        dest.latitude != null && dest.longitude != null
          ? [dest.longitude, dest.latitude]
          : getCountryCentroid(dest.country)
      if (!coordinates) return null
      return {
        destination: dest,
        coordinates,
      }
    })
    .filter((p): p is { destination: Destination; coordinates: [number, number] } => p != null)

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  }, [])
  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  }, [])

  return (
    <div
      data-map-container="true"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 320,
        background: 'var(--gradient-map)',
        padding: '0 1rem 1rem',
        boxSizing: 'border-box',
      }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 147 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={0.5}
          maxZoom={8}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeographyObject[] }) =>
              geographies.map((geo: GeographyObject) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--color-map-fill)"
                  stroke="var(--color-map-stroke)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: 'var(--color-map-hover)', outline: 'none' },
                    pressed: { fill: 'var(--color-map-pressed)', outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {pointsWithCoords.map(({ destination, coordinates }) => (
            <DestinationMarker
              key={destination.id}
              coordinates={coordinates}
              destination={destination}
              zoom={zoom}
              onClick={() => onDestinationClick(destination)}
              onTooltipShow={setTooltip}
              onTooltipHide={() => setTooltip(null)}
            />
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <MarkerTooltip
          x={tooltip.x}
          y={tooltip.y}
          destination={tooltip.destination}
        />
      )}

      {/* 우측 하단 확대/축소 버튼 */}
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

      {destinations.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted-3)', marginTop: '1rem' }}>
          이 달에 등록된 추천 여행지가 없습니다.
        </p>
      )}
    </div>
  )
}
