declare module 'react-simple-maps' {
  import { ComponentType } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: { scale?: number; center?: [number, number] }
    width?: number
    height?: number
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  export interface GeographyObject {
    rsmKey?: string
    [key: string]: unknown
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: GeographyObject[] }) => React.ReactNode
  }

  export interface GeographyProps {
    geography: GeographyObject
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    /** return false to block zoom for this event (e.g. wheel). d3Event.sourceEvent is the DOM event. */
    filterZoomEvent?: (d3Event: { sourceEvent?: Event }) => boolean
    onMoveStart?: (props: { coordinates: [number, number]; zoom: number }, d3Event: unknown) => void
    onMove?: (props: { x: number; y: number; zoom: number; dragging?: Event }, d3Event: unknown) => void
    onMoveEnd?: (props: { coordinates: [number, number]; zoom: number }, d3Event: unknown) => void
    className?: string
    children?: React.ReactNode
  }

  export interface MarkerProps {
    coordinates: [number, number]
    children?: React.ReactNode
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Marker: ComponentType<MarkerProps>
}
