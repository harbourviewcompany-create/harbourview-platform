'use client'

/**
 * Builds / updates the heat DataTexture off the critical path:
 * - Web Worker KDE when available (main-thread fallback)
 * - Throttle + fingerprint skip on realtime churn
 * - Reuse DataTexture + Uint8 buffer when resolution unchanged
 */

import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
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
  const { invalidate } = useThree()
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
  const pendingRef = useRef<{
    points: ReturnType<typeof buildHeatPoints>
    quality: HeatQuality
    width: number
    height: number
  } | null>(null)
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    const runBuild = (
      pts: ReturnType<typeof buildHeatPoints>,
      q: HeatQuality,
      width: number,
      height: number,
    ) => {
      const buildFp = `${q}:${width}x${height}:${heatPointsFingerprint(pts)}`
      lastFingerprintRef.current = buildFp
      lastBuildAtRef.current = Date.now()
      setBoost(meanTopHeat(pts))

      const applyUint8 = (data: Uint8Array, w: number, h: number) => {
        if (!bufferRef.current || bufferRef.current.length !== data.length) {
          bufferRef.current = new Uint8Array(data.length)
        }
        bufferRef.current.set(data)

        let tex = textureRef.current
        if (!tex || tex.image.width !== w || tex.image.height !== h) {
          tex?.dispose()
          tex = new DataTexture(bufferRef.current, w, h, RedFormat)
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
        invalidate()
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
          width,
          height,
          bandwidthDeg: HEAT_CONFIG.bandwidthDeg,
        }
        worker.postMessage(msg)
        return
      }

      const compute = () => {
        const field = computeDensityField(pts, width, height)
        const data = densityToUint8(field, bufferRef.current ?? undefined)
        bufferRef.current = data
        applyUint8(data, width, height)
      }
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => compute(), { timeout: 120 })
      } else {
        setTimeout(compute, 0)
      }
    }

    const elapsed = Date.now() - lastBuildAtRef.current
    if (lastBuildAtRef.current > 0 && elapsed < HEAT_REBUILD_THROTTLE_MS) {
      pendingRef.current = {
        points,
        quality,
        width: res.width,
        height: res.height,
      }
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = setTimeout(() => {
        const pending = pendingRef.current
        pendingRef.current = null
        if (pending) {
          runBuild(pending.points, pending.quality, pending.width, pending.height)
        }
      }, HEAT_REBUILD_THROTTLE_MS - elapsed)
      return
    }

    runBuild(points, quality, res.width, res.height)
  }, [opts.countries, opts.signalsByIso2, quality, res.width, res.height, invalidate])

  return {
    texture,
    boost,
    quality,
    width: res.width,
    height: res.height,
    ready,
  }
}
