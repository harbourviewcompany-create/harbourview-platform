'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './HarbourviewGlobeClientLoader.module.css'
import { featureFlags } from '@/lib/harbourview/feature-flags'
import { classifyGpuHint, qualityTuning, selectQualityLevel, shouldBailoutToFallback, type GlobeQualityLevel } from '@/lib/harbourview/globe/quality'

type PremiumWebGLGlobeProps = {
  quality: Exclude<GlobeQualityLevel, 'fallback'>
  onReady?: () => void
  onError?: () => void
  onBailout?: () => void
}

type HarbourviewGlobeClientLoaderProps = {
  fallbackSrc?: string
}

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float uRotation;
uniform float uAspect;
uniform float uScale;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vObjectNormal;
varying float vDepth;

vec3 rotateX(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);

  return vec3(
    point.x,
    point.y * cosine - point.z * sine,
    point.y * sine + point.z * cosine
  );
}

vec3 rotateY(vec3 point, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);

  return vec3(
    point.x * cosine + point.z * sine,
    point.y,
    -point.x * sine + point.z * cosine
  );
}

void main() {
  float tilt = -0.16 + sin(uTime * 0.00018) * 0.009;
  float scale = uScale + sin(uTime * 0.00016) * 0.004;
  vec3 tiltedPosition = rotateX(aPosition, tilt);
  vec3 rotatedPosition = rotateY(tiltedPosition, uRotation);
  vec3 tiltedNormal = rotateX(aNormal, tilt);
  vec3 rotatedNormal = rotateY(tiltedNormal, uRotation);

  vNormal = normalize(rotatedNormal);
  vObjectNormal = normalize(aNormal);
  vDepth = rotatedPosition.z;

  gl_Position = vec4(
    rotatedPosition.x * scale / uAspect,
    rotatedPosition.y * scale,
    rotatedPosition.z * 0.08,
    1.0
  );
}
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform float uTime;

varying vec3 vNormal;
varying vec3 vObjectNormal;
varying float vDepth;

float ringLine(float value, float frequency, float width) {
  float wave = abs(sin(value * frequency));
  return smoothstep(1.0 - width, 1.0, wave);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 objectNormal = normalize(vObjectNormal);
  vec3 keyLight = normalize(vec3(-0.58, 0.48, 0.72));
  vec3 fillLight = normalize(vec3(0.42, -0.28, 0.86));
  vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0));

  float diffuse = max(dot(normal, keyLight), 0.0);
  float fill = max(dot(normal, fillLight), 0.0);
  float face = max(dot(normal, viewDirection), 0.0);
  float fresnel = pow(1.0 - face, 2.7);
  float rim = pow(1.0 - face, 4.5);
  float highlight = pow(max(dot(reflect(-keyLight, normal), viewDirection), 0.0), 28.0);
  float depthShade = smoothstep(-0.78, 0.42, vDepth);

  float longitudeAngle = atan(objectNormal.z, objectNormal.x);
  float latitudeAngle = asin(objectNormal.y);
  float longitude = ringLine(longitudeAngle, 22.0, 0.018);
  float latitude = ringLine(latitudeAngle, 19.0, 0.02);
  float fineLongitude = ringLine(longitudeAngle + sin(uTime * 0.00005) * 0.008, 44.0, 0.006);
  float fineLatitude = ringLine(latitudeAngle, 38.0, 0.006);
  float engraving = max(max(longitude, latitude) * 0.74, max(fineLongitude, fineLatitude) * 0.28);
  float equator = 1.0 - smoothstep(0.01, 0.042, abs(objectNormal.y));
  float polarRestraint = 1.0 - smoothstep(0.82, 0.98, abs(objectNormal.y));
  float surfaceGrain = sin(objectNormal.x * 33.0 + objectNormal.y * 17.0 + objectNormal.z * 23.0) * 0.5 + 0.5;

  vec3 abyss = vec3(0.006, 0.024, 0.05);
  vec3 deepNavy = vec3(0.012, 0.047, 0.092);
  vec3 enamelNavy = vec3(0.025, 0.112, 0.19);
  vec3 coolNavy = vec3(0.05, 0.16, 0.25);
  vec3 oldGold = vec3(0.78, 0.62, 0.32);
  vec3 paleGold = vec3(1.0, 0.83, 0.46);
  vec3 ivory = vec3(0.92, 0.9, 0.84);

  vec3 color = mix(abyss, deepNavy, depthShade);
  color = mix(color, enamelNavy, diffuse * 0.82 + fill * 0.18);
  color = mix(color, coolNavy, highlight * 0.32);
  color += oldGold * fresnel * 0.28;
  color += paleGold * rim * 0.18;
  color += ivory * highlight * 0.14;
  color += oldGold * engraving * polarRestraint * (0.09 + diffuse * 0.09);
  color += paleGold * equator * 0.045;
  color += (surfaceGrain - 0.5) * 0.018;

  float edgeFade = smoothstep(0.02, 0.2, face);
  float alpha = (0.93 + fresnel * 0.055) * edgeFade;
  gl_FragColor = vec4(color, alpha);
}
`

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type)

  if (!shader) {
    throw new Error('Unable to create Harbourview globe shader.')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader error.'
    gl.deleteShader(shader)
    throw new Error(message)
  }

  return shader
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Unable to create Harbourview globe program.')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Unknown program error.'
    gl.deleteProgram(program)
    throw new Error(message)
  }

  return program
}

function buildSphere(latitudeBands = 72, longitudeBands = 72) {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let lat = 0; lat <= latitudeBands; lat += 1) {
    const theta = (lat * Math.PI) / latitudeBands
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)

    for (let lon = 0; lon <= longitudeBands; lon += 1) {
      const phi = (lon * 2 * Math.PI) / longitudeBands
      const sinPhi = Math.sin(phi)
      const cosPhi = Math.cos(phi)
      const x = cosPhi * sinTheta
      const y = cosTheta
      const z = sinPhi * sinTheta

      positions.push(x, y, z)
      normals.push(x, y, z)
    }
  }

  for (let lat = 0; lat < latitudeBands; lat += 1) {
    for (let lon = 0; lon < longitudeBands; lon += 1) {
      const first = lat * (longitudeBands + 1) + lon
      const second = first + longitudeBands + 1

      indices.push(first, second, first + 1)
      indices.push(second, second + 1, first + 1)
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  }
}

function bindAttribute(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attributeName: string,
  data: Float32Array,
) {
  const buffer = gl.createBuffer()

  if (!buffer) {
    throw new Error(`Unable to create ${attributeName} buffer.`)
  }

  const location = gl.getAttribLocation(program, attributeName)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0)

  return buffer
}

function browserSupportsWebGL() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    return Boolean(window.WebGLRenderingContext && context)
  } catch {
    return false
  }
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function PremiumWebGLGlobe({ quality, onReady, onError, onBailout }: PremiumWebGLGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return undefined

    let frame = 0
    let destroyed = false
    let hasReportedReady = false
    let hasEvaluatedWarmup = false
    let lastFrameTimestamp: number | null = null
    let smoothedRotation = 0
    let frameTimeAverage = 16.7
    const frameTimes: number[] = []
    let program: WebGLProgram | null = null
    let positionBuffer: WebGLBuffer | null = null
    let normalBuffer: WebGLBuffer | null = null
    let indexBuffer: WebGLBuffer | null = null

    try {
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      })

      if (!gl) {
        throw new Error('WebGL is unavailable for the Harbourview globe.')
      }

      const tuning = qualityTuning[quality]
      const sphere = buildSphere(tuning.latitudeBands, tuning.longitudeBands)
      program = createProgram(gl)
      gl.useProgram(program)

      positionBuffer = bindAttribute(gl, program, 'aPosition', sphere.positions)
      normalBuffer = bindAttribute(gl, program, 'aNormal', sphere.normals)
      indexBuffer = gl.createBuffer()

      if (!indexBuffer) {
        throw new Error('Unable to create index buffer.')
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.enable(gl.CULL_FACE)
      gl.cullFace(gl.BACK)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      const rotationLocation = gl.getUniformLocation(program, 'uRotation')
      const aspectLocation = gl.getUniformLocation(program, 'uAspect')
      const scaleLocation = gl.getUniformLocation(program, 'uScale')
      const timeLocation = gl.getUniformLocation(program, 'uTime')

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, tuning.maxPixelRatio)
        const width = Math.max(1, Math.floor(rect.width * dpr))
        const height = Math.max(1, Math.floor(rect.height * dpr))

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
          gl.viewport(0, 0, width, height)
        }
      }

      const render = (timestamp: number) => {
        if (destroyed) return

        const rawDelta = lastFrameTimestamp === null ? 16.7 : timestamp - lastFrameTimestamp
        const clampedDelta = Math.max(8, Math.min(rawDelta, 40))
        frameTimeAverage = frameTimeAverage * 0.88 + clampedDelta * 0.12
        smoothedRotation += frameTimeAverage * tuning.rotationSpeed
        lastFrameTimestamp = timestamp

        if (!hasEvaluatedWarmup) {
          frameTimes.push(frameTimeAverage)

          if (frameTimes.length >= tuning.warmupFrames) {
            hasEvaluatedWarmup = true
            if (shouldBailoutToFallback(frameTimes)) {
              onBailout?.()
              return
            }
          }
        }

        resize()
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        gl.uniform1f(rotationLocation, smoothedRotation)
        gl.uniform1f(aspectLocation, Math.max(canvas.width / canvas.height, 0.1))
        gl.uniform1f(scaleLocation, 0.865)
        gl.uniform1f(timeLocation, timestamp)
        gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0)

        if (!hasReportedReady) {
          hasReportedReady = true
          onReady?.()
        }

        frame = window.requestAnimationFrame(render)
      }

      frame = window.requestAnimationFrame(render)
    } catch {
      onError?.()
    }

    return () => {
      destroyed = true
      window.cancelAnimationFrame(frame)

      const gl = canvas.getContext('webgl')

      if (!gl) return

      if (positionBuffer) gl.deleteBuffer(positionBuffer)
      if (normalBuffer) gl.deleteBuffer(normalBuffer)
      if (indexBuffer) gl.deleteBuffer(indexBuffer)
      if (program) gl.deleteProgram(program)
    }
  }, [onBailout, onError, onReady, quality])

  return <canvas ref={canvasRef} className={styles.webglCanvas} aria-hidden="true" />
}

export function HarbourviewGlobeClientLoader({
  fallbackSrc = '/assets/harbourview-globe-hero-v2.svg',
}: HarbourviewGlobeClientLoaderProps) {
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [quality, setQuality] = useState<GlobeQualityLevel>('medium')

  const selectedQuality = useMemo(() => {
    if (featureFlags.globeForceFallback) return 'fallback'

    const nav = typeof navigator === 'undefined'
      ? undefined
      : navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
    const gl = canvas?.getContext('webgl') ?? null
    const renderer = gl?.getExtension('WEBGL_debug_renderer_info')
    const rendererName = renderer
      ? gl?.getParameter((renderer as { UNMASKED_RENDERER_WEBGL: number }).UNMASKED_RENDERER_WEBGL)
      : undefined

    return selectQualityLevel({
      reducedMotion: prefersReducedMotion(),
      supportsWebGL: browserSupportsWebGL(),
      deviceMemoryGb: nav?.deviceMemory,
      hardwareConcurrency: nav?.hardwareConcurrency,
      gpuHint: classifyGpuHint(typeof rendererName === 'string' ? rendererName : undefined),
    })
  }, [])

  const handleReady = useCallback(() => {
    setCanvasReady(true)
  }, [])

  const handleError = useCallback(() => {
    setCanvasReady(false)
    setShouldRenderCanvas(false)
    setQuality('fallback')
  }, [])

  const handleBailout = useCallback(() => {
    setCanvasReady(false)
    setShouldRenderCanvas(false)
    setQuality('fallback')
  }, [])

  useEffect(() => {
    setQuality(selectedQuality)

    if (selectedQuality === 'fallback') {
      return
    }

    const win = window as IdleWindow
    let cancelled = false
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined

    const enableCanvas = () => {
      if (!cancelled) {
        setShouldRenderCanvas(true)
      }
    }

    if (win.requestIdleCallback) {
      idleHandle = win.requestIdleCallback(enableCanvas, { timeout: 900 })
    } else {
      timeoutHandle = window.setTimeout(enableCanvas, 450)
    }

    return () => {
      cancelled = true

      if (idleHandle !== undefined && win.cancelIdleCallback) {
        win.cancelIdleCallback(idleHandle)
      }

      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle)
      }
    }
  }, [selectedQuality])

  return (
    <div
      aria-hidden="true"
      className={`${styles.shell}${canvasReady ? ` ${styles.shellReady}` : ''}`}
      data-globe-mode={shouldRenderCanvas ? `webgl-${quality}` : 'static'}
    >
      <Image
        src={fallbackSrc}
        alt=""
        width={1600}
        height={1600}
        className={styles.fallback}
        priority
      />

      {shouldRenderCanvas ? (
        <div className={styles.canvasLayer}>
          <PremiumWebGLGlobe quality={quality as Exclude<GlobeQualityLevel, 'fallback'>} onReady={handleReady} onError={handleError} onBailout={handleBailout} />
        </div>
      ) : null}
    </div>
  )
}
