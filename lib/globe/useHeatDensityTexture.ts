'use client'

/**
 * Builds / updates the heat DataTexture off the critical path:
 * - Web Worker KDE when available (main-thread fallback)
 * - Throttle + fingerprint skip on realtime churn
 * - Reuse DataTexture + Uint8 buffer when resolution unchanged
 */

import { useEffect, useRef, useState } from 'react'
import { DataTexture, LinearFilter, RedFormat, SRGBColorSpace } from 'three'
import type { GlobeCountryMarker, GlobeSignal } from '@/lib/globe/supabaseGlobeData'
import {
  HEAT_CONFIG,
  HEAT_REBUILD_THROTTLE_MS,
  HEAT_RESOLUTION,
  type HeatQuality,
  buildHeatPoints,
  computeDensityField,
  densityToUint8,
  heatPointsFingerprint,
  meanTopHeat,
  resolveHeatQuality,
} from '@/lib/globe/heat-density'
import type { HeatWorkerRequest, HeatWorkerResponse } from '@/lib/globe/heat-density.worker'

export type HeatDensityTextureState = {
  texture: DataTexture | null
  boost: number
  quality: HeatQuality
  width: number
  height: number
  ready: boolean
}

function createWorker(): Worker | null {
  if (typeof window === 'undefined') return null
  try {
    return new Worker(new URL('./heat-density.worker.ts', import.meta.url))
  } catch {
    return null
  }
}

export function useHeatDensityTexture(opts: {
  countries: GlobeCountryMarker[]
  signalsByIso2: Record<string, GlobeSignal[]>
  prefersReducedMotion?: boolean
  quality?: HeatQuality
}): HeatDensityTextureState {
  const quality =
    opts.quality ??
    resolveHeatQuality({ prefersReducedMotion: opts.prefersReducedMotion ?? false })
  const res = HEAT_RESOLUTION[quality]

  const [texture, setTexture] = useState<DataTexture | null>(null)
  const [boost, setBoost] = useState(0)
  const [ready, setReady] = useState(false)

  const textureRef = useRef<DataTexture | null>(null)
  const bufferRef = useRef<Uint8Array | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const reqIdRef = useRef(0)
  const lastFingerprintRef = useRef<string>('')
  const lastBuildAtRef = useRef(0)
  const pendingPointsRef = useRef<ReturnType<typeof buildHeatPoints> | null>(null)
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Own the worker for this hook instance
  useEffect(() => {
    workerRef.current = createWorker()
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current)
      textureRef.current?.dispose()
      textureRef.current = null
    }
  }, [])

  useEffect(() => {
    const points = buildHeatPoints(opts.countries, opts.signalsByIso2)
    const fp = `${quality}:${res.width}x${res.height}:${heatPointsFingerprint(points)}`
    if (fp === lastFingerprintRef.current) return

    const runBuild = (pts: typeof points) => {
      lastFingerprintRef.current = fp
      lastBuildAtRef.current = Date.now()
      setBoost(meanTopHeat(pts))

      const applyUint8 = (data: Uint8Array, width: number, height: number) => {
        // Reuse buffer storage when size matches
        if (!bufferRef.current || bufferRef.current.length !== data.length) {
          bufferRef.current = new Uint8Array(data.length)
        }
        bufferRef.current.set(data)

        let tex = textureRef.current
        if (!tex || tex.image.width !== width || tex.image.height !== height) {
          tex?.dispose()
          tex = new DataTexture(bufferRef.current, width, height, RedFormat)
          tex.colorSpace = SRGBColorSpace
          tex.minFilter = LinearFilter
          tex.magFilter = LinearFilter
          tex.flipY = false
          textureRef.current = tex
          setTexture(tex)
        } else {
          tex.image.data = bufferRef.current
          tex.needsUpdate = true
        }
        setReady(true)
      }

      const worker = workerRef.current
      if (worker) {
        const id = ++reqIdRef.current
        const onMessage = (event: MessageEvent<HeatWorkerResponse & { error?: string }>) => {
          if (event.data.id !== id) return
          worker.removeEventListener('message', onMessage)
          applyUint8(event.data.data, event.data.width, event.data.height)
        }
        worker.addEventListener('message', onMessage)
        const msg: HeatWorkerRequest = {
          id,
          points: pts,
          width: res.width,
          height: res.height,
          bandwidthDeg: HEAT_CONFIG.bandwidthDeg,
        }
        worker.postMessage(msg)
        return
      }

      // Main-thread fallback (idle if available)
      const compute = () => {
        const field = computeDensityField(pts, res.width, res.height)
        const data = densityToUint8(field, bufferRef.current ?? undefined)
        bufferRef.current = data
        applyUint8(data, res.width, res.height)
      }
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => compute(), { timeout: 120 })
      } else {
        setTimeout(compute, 0)
      }
    }

    const elapsed = Date.now() - lastBuildAtRef.current
    if (lastBuildAtRef.current > 0 && elapsed < HEAT_REBUILD_THROTTLE_MS) {
      pendingPointsRef.current = points
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = setTimeout(() => {
        const pending = pendingPointsRef.current
        pendingPointsRef.current = null
        if (pending) runBuild(pending)
      }, HEAT_REBUILD_THROTTLE_MS - elapsed)
      return
    }

    runBuild(points)
  }, [opts.countries, opts.signalsByIso2, quality, res.width, res.height])

  return {
    texture,
    boost,
    quality,
    width: res.width,
    height: res.height,
    ready,
  }
}
