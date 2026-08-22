/**
 * Web Worker entry for spherical KDE.
 * Bundled via `new Worker(new URL('./heat-density.worker.ts', import.meta.url))`.
 */

import { computeDensityField, densityToUint8, type HeatPoint } from './heat-density'

export type HeatWorkerRequest = {
  id: number
  points: HeatPoint[]
  width: number
  height: number
  bandwidthDeg: number
}

export type HeatWorkerResponse = {
  id: number
  width: number
  height: number
  /** Transferable Uint8Array (R channel). */
  data: Uint8Array
}

self.onmessage = (event: MessageEvent<HeatWorkerRequest>) => {
  const { id, points, width, height, bandwidthDeg } = event.data
  try {
    const field = computeDensityField(points, width, height, bandwidthDeg)
    const data = densityToUint8(field)
    const response: HeatWorkerResponse = { id, width, height, data }
    // Transfer buffer ownership back to main thread
    ;(self as unknown as Worker).postMessage(response, [data.buffer])
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      id,
      width,
      height,
      data: new Uint8Array(width * height),
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export {}
