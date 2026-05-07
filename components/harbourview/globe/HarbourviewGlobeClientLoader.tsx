'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './HarbourviewGlobeClientLoader.module.css'

type PremiumWebGLGlobeProps = {
  onReady?: () => void
  onError?: () => void
}

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float uRotation;
uniform float uAspect;
uniform float uScale;

varying vec3 vNormal;
varying vec3 vObjectNormal;

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
  vec3 tiltedPosition = rotateX(aPosition, -0.16);
  vec3 rotatedPosition = rotateY(tiltedPosition, uRotation);
  vec3 tiltedNormal = rotateX(aNormal, -0.16);
  vec3 rotatedNormal = rotateY(tiltedNormal, uRotation);

  vNormal = normalize(rotatedNormal);
  vObjectNormal = normalize(aNormal);

  gl_Position = vec4(
    rotatedPosition.x * uScale / uAspect,
    rotatedPosition.y * uScale,
    rotatedPosition.z * 0.08,
    1.0
  );
}
`

const FRAGMENT_SHADER = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vObjectNormal;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(vec3(-0.55, 0.46, 0.74));
  vec3 secondaryLight = normalize(vec3(0.58, -0.36, 0.72));
  vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0));

  float diffuse = max(dot(normal, lightDirection), 0.0);
  float secondary = max(dot(normal, secondaryLight), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.35);
  float highlight = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 18.0);

  float longitude = abs(sin(atan(vObjectNormal.z, vObjectNormal.x) * 18.0));
  float latitude = abs(sin(asin(vObjectNormal.y) * 16.0));
  float engraving = smoothstep(0.986, 1.0, max(longitude, latitude));
  float equator = 1.0 - smoothstep(0.012, 0.048, abs(vObjectNormal.y));

  vec3 deepNavy = vec3(0.012, 0.045, 0.09);
  vec3 enamelNavy = vec3(0.026, 0.105, 0.18);
  vec3 gold = vec3(0.78, 0.62, 0.32);
  vec3 offWhite = vec3(0.92, 0.90, 0.84);

  vec3 color = mix(deepNavy, enamelNavy, diffuse * 0.78 + secondary * 0.18);
  color += gold * fresnel * 0.34;
  color += offWhite * highlight * 0.12;
  color += gold * engraving * 0.11 * (0.45 + diffuse);
  color += gold * equator * 0.055;

  float alpha = 0.94 + fresnel * 0.05;
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
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function PremiumWebGLGlobe({ onReady, onError }: PremiumWebGLGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return undefined

    let frame = 0
    let destroyed = false
    let hasReportedReady = false
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

      const sphere = buildSphere()
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
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)

      const rotationLocation = gl.getUniformLocation(program, 'uRotation')
      const aspectLocation = gl.getUniformLocation(program, 'uAspect')
      const scaleLocation = gl.getUniformLocation(program, 'uScale')

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 1.45)
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

        resize()
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(program)
        gl.uniform1f(rotationLocation, timestamp * 0.000045)
        gl.uniform1f(aspectLocation, Math.max(canvas.width / canvas.height, 0.1))
        gl.uniform1f(scaleLocation, 0.84)
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
  }, [onError, onReady])

  return <canvas ref={canvasRef} className={styles.webglCanvas} aria-hidden="true" />
}

export function HarbourviewGlobeClientLoader() {
  const [shouldRenderCanvas, setShouldRenderCanvas] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)

  const handleReady = useCallback(() => {
    setCanvasReady(true)
  }, [])

  const handleError = useCallback(() => {
    setCanvasReady(false)
    setShouldRenderCanvas(false)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion() || !browserSupportsWebGL()) {
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
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`${styles.shell}${canvasReady ? ` ${styles.shellReady}` : ''}`}
      data-globe-mode={shouldRenderCanvas ? 'webgl' : 'static'}
    >
      <Image
        src="/assets/harbourview-globe-hero.svg"
        alt=""
        width={1600}
        height={1600}
        className={styles.fallback}
        priority
      />

      {shouldRenderCanvas ? (
        <div className={styles.canvasLayer}>
          <PremiumWebGLGlobe onReady={handleReady} onError={handleError} />
        </div>
      ) : null}
    </div>
  )
}
