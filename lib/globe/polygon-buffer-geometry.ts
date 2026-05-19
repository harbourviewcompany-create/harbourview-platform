import { BufferAttribute, BufferGeometry } from 'three'
import type { HarbourviewCountryGeometry } from './geojson-country-types'
import { lonLatToVector3 } from './globe-geometry'

export interface GlobeExtrusionConfig {
  radius: number
  extrusionHeight: number
}

const DEFAULT_CONFIG: GlobeExtrusionConfig = {
  radius: 2.35,
  extrusionHeight: 0.06,
}

function flattenRingVertices(points: [number, number][], config: GlobeExtrusionConfig) {
  return points.flatMap((point) => {
    const vector = lonLatToVector3(point[0], point[1], config.radius + config.extrusionHeight)
    return [vector.x, vector.y, vector.z]
  })
}

function createTriangleFanIndices(vertexCount: number) {
  const indices: number[] = []

  for (let index = 1; index < vertexCount - 1; index += 1) {
    indices.push(0, index, index + 1)
  }

  return indices
}

export function createCountryBufferGeometry(
  country: HarbourviewCountryGeometry,
  config: Partial<GlobeExtrusionConfig> = {},
) {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  const geometry = new BufferGeometry()

  const outerRing = country.polygons[0]?.rings.find((ring) => ring.kind === 'outer')

  if (!outerRing || outerRing.points.length < 3) {
    return geometry
  }

  const vertices = flattenRingVertices(outerRing.points, mergedConfig)
  const vertexCount = vertices.length / 3
  const indices = createTriangleFanIndices(vertexCount)

  geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  geometry.userData = {
    iso2: country.iso2,
    iso3: country.iso3,
    centroid: country.centroid,
    bbox: country.bbox,
    extrusionHeight: mergedConfig.extrusionHeight,
  }

  return geometry
}
