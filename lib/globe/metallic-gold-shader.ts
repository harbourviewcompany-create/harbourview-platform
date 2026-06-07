import { Color, Vector3 } from 'three'

export type MetallicGoldShader = {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

export type MetallicGoldShaderOptions = {
  isFocused: boolean
  isSelected: boolean
}

export function getMetallicGoldProgramCacheKey(options: MetallicGoldShaderOptions) {
  return `harbourview-metallic-gold-${options.isSelected ? 'selected' : options.isFocused ? 'focused' : 'idle'}`
}

export function applyMetallicGoldShader(shader: MetallicGoldShader, options: MetallicGoldShaderOptions) {
  shader.uniforms.uAntiqueGold = { value: new Color(options.isSelected ? '#b58623' : '#8a6419') }
  // Champagne gold ceiling lowered — was near-white (#fff0b8/#f7dc8a) which caused
  // highlights to clip to pale cream under the key light. Now a richer warm gold
  // that stays metallic even at full specular contribution.
  shader.uniforms.uChampagneGold = { value: new Color(options.isSelected ? '#e0b830' : '#d4a628') }
  shader.uniforms.uBronzeGold = { value: new Color(options.isSelected ? '#5b3510' : '#3b260e') }
  shader.uniforms.uRimGold = { value: new Color(options.isSelected || options.isFocused ? '#e8c84a' : '#c8a030') }
  shader.uniforms.uKeyDirection = { value: new Vector3(0.78, 0.42, 0.46) }
  shader.uniforms.uFillDirection = { value: new Vector3(-0.38, 0.64, -0.66) }
  shader.uniforms.uMetallicFocus = { value: options.isSelected ? 1.0 : options.isFocused ? 0.58 : 0.0 }

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldNormal;
     varying vec3 vHvMetalWorldPosition;`,
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     vHvMetalWorldNormal = normalize(mat3(modelMatrix) * normal);
     vHvMetalWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldNormal;
     varying vec3 vHvMetalWorldPosition;
     uniform vec3 uAntiqueGold;
     uniform vec3 uChampagneGold;
     uniform vec3 uBronzeGold;
     uniform vec3 uRimGold;
     uniform vec3 uKeyDirection;
     uniform vec3 uFillDirection;
     uniform float uMetallicFocus;

     float hvHash(vec3 p) {
       p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
       p += dot(p, p.yzx + 19.19);
       return fract((p.x + p.y) * p.z);
     }

     float hvValueNoise(vec3 p) {
       vec3 i = floor(p);
       vec3 f = fract(p);
       f = f * f * (3.0 - 2.0 * f);
       float n000 = hvHash(i + vec3(0.0, 0.0, 0.0));
       float n100 = hvHash(i + vec3(1.0, 0.0, 0.0));
       float n010 = hvHash(i + vec3(0.0, 1.0, 0.0));
       float n110 = hvHash(i + vec3(1.0, 1.0, 0.0));
       float n001 = hvHash(i + vec3(0.0, 0.0, 1.0));
       float n101 = hvHash(i + vec3(1.0, 0.0, 1.0));
       float n011 = hvHash(i + vec3(0.0, 1.0, 1.0));
       float n111 = hvHash(i + vec3(1.0, 1.0, 1.0));
       float nx00 = mix(n000, n100, f.x);
       float nx10 = mix(n010, n110, f.x);
       float nx01 = mix(n001, n101, f.x);
       float nx11 = mix(n011, n111, f.x);
       float nxy0 = mix(nx00, nx10, f.y);
       float nxy1 = mix(nx01, nx11, f.y);
       return mix(nxy0, nxy1, f.z);
     }`,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     vec3 hvNormal = normalize(vHvMetalWorldNormal);
     vec3 hvViewDir = normalize(cameraPosition - vHvMetalWorldPosition);
     vec3 hvKey = normalize(uKeyDirection);
     vec3 hvFill = normalize(uFillDirection);
     float hvKeyLight = smoothstep(-0.18, 0.82, dot(hvNormal, hvKey));
     float hvFillLight = smoothstep(-0.35, 0.65, dot(hvNormal, hvFill));
     float hvFalloff = smoothstep(0.74, -0.16, dot(hvNormal, hvKey));
     float hvSpec = pow(max(dot(reflect(-hvKey, hvNormal), hvViewDir), 0.0), mix(38.0, 72.0, uMetallicFocus));
     float hvRim = pow(1.0 - clamp(dot(hvNormal, hvViewDir), 0.0, 1.0), 2.35);
     float hvBrush = sin((vHvMetalWorldPosition.x * 28.0) + (vHvMetalWorldPosition.y * 15.0) - (vHvMetalWorldPosition.z * 9.0)) * 0.5 + 0.5;
     float hvFineBrush = sin((vHvMetalWorldPosition.x + vHvMetalWorldPosition.z) * 116.0) * 0.5 + 0.5;
     float hvNoise = hvValueNoise(vHvMetalWorldPosition * 22.0);
     float hvTexture = (hvBrush * 0.075) + (hvFineBrush * 0.028) + ((hvNoise - 0.5) * 0.085);
     vec3 hvLayeredGold = mix(uBronzeGold, uAntiqueGold, 0.58 + hvFillLight * 0.16 + hvTexture);
     // Champagne contribution capped: was 0.34/0.42 — now 0.22/0.24 so highlights
     // stay deep gold rather than washing to pale cream under the key light.
     hvLayeredGold = mix(hvLayeredGold, uChampagneGold, hvKeyLight * 0.22 + hvSpec * 0.24 + uMetallicFocus * 0.10);
     hvLayeredGold = mix(hvLayeredGold, uBronzeGold, hvFalloff * 0.34);
     hvLayeredGold += uRimGold * hvRim * (0.22 + uMetallicFocus * 0.22);
     hvLayeredGold += uChampagneGold * hvSpec * (0.22 + uMetallicFocus * 0.18);
     // Hard clamp: prevents any path from blowing the surface out to cream/white.
     // RGB ceiling of ~0.92/0.80/0.36 maps to a rich warm gold under ACES at 0.78 exposure.
     hvLayeredGold = clamp(hvLayeredGold, vec3(0.0), vec3(0.92, 0.80, 0.36));
     diffuseColor.rgb = mix(diffuseColor.rgb, hvLayeredGold, 0.88);`,
  )
}
