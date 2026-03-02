/**
 * lng: -180 ~ 180 -> x% (0 ~ 100)
 * lat: 90 ~ -90 -> y% (0 ~ 100)
 */
export function latLngToPercent(lng: number, lat: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100
  const y = ((90 - lat) / 180) * 100
  return { x, y }
}

/** viewBox 기준 픽셀 좌표 (기본 1000×500, 지도는 figmaCountryLayout의 VIEWBOX_W×VIEWBOX_H 사용) */
export function latLngToViewBox(
  lng: number,
  lat: number,
  viewBoxW: number = 1000,
  viewBoxH: number = 500
): { x: number; y: number } {
  const p = latLngToPercent(lng, lat)
  return { x: (p.x / 100) * viewBoxW, y: (p.y / 100) * viewBoxH }
}
