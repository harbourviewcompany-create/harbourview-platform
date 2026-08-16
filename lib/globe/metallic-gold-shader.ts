import { Color } from 'three'

export type MetallicGoldShader = {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

export type MetallicGoldShaderOptions = {
  isFocused: boolean
  isSelected: boolean
  /**
   * 1 = full brushed gold over diffuseColour.
   * 0 = plain plate colour (tier / lerped). Continuous values dissolve the grain.
   */
  goldMix?: number
}

export function getMetallicGoldProgramCacheKey(options: MetallicGoldShaderOptions) {
  // goldMix is a uniform — do not bake it into the program key or every
  // reveal step recompiles all plates.
  return `harbourview-metallic-gold-${options.isSelected ? 'selected' : options.isFocused ? 'focused' : 'idle'}`
}

export function applyMetallicGoldShader(shader: MetallicGoldShader, options: MetallicGoldShaderOptions) {
  const goldMix = options.goldMix ?? 1

  shader.uniforms.uAntiqueGold = { value: new Color(options.isSelected ? '#b58623' : '#8a6419') }
  shader.uniforms.uChampagneGold = { value: new Color(options.isSelected ? '#e0b830' : '#d4a628') }
  shader.uniforms.uBronzeGold = { value: new Color(options.isSelected ? '#5b3510' : '#3b260e') }
  // uMetallicFocus drives albedo tone shift toward champagne on hover/select — no
  // lighting math so it can't create blobs. Actual specular comes from Three.js PBR.
  shader.uniforms.uMetallicFocus = { value: options.isSelected ? 1.0 : options.isFocused ? 0.58 : 0.0 }
  // Continuous dissolve of brushed gold into the plate's current diffuseColour
  // (already lerped gold→tier in JS). Avoids a hard onBeforeCompile cut mid-reveal.
  shader.uniforms.uGoldMix = { value: goldMix }

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldPosition;`,
  )
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     vHvMetalWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`,
  )
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
     varying vec3 vHvMetalWorldPosition;
     uniform vec3 uAntiqueGold;
     uniform vec3 uChampagneGold;
     uniform vec3 uBronzeGold;
     uniform float uMetallicFocus;
     uniform float uGoldMix;

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
  // Only modifies diffuseColor — no spec/rim/key computed here.
  // For metallic materials diffuseColor becomes the specular reflectance tint (F0),
  // so any view-dependent lighting baked in here creates amplified blobs. Instead
  // we use a world-position brushed texture for anisotropic albedo variation and
  // let Three.js PBR own all specular, reflections, and rim effects.
  // uGoldMix fades the brush so tier colours emerge without a program switch.
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
     float hvBrush = sin((vHvMetalWorldPosition.x * 28.0) + (vHvMetalWorldPosition.y * 15.0) - (vHvMetalWorldPosition.z * 9.0)) * 0.5 + 0.5;
     float hvFineBrush = sin((vHvMetalWorldPosition.x + vHvMetalWorldPosition.z) * 116.0) * 0.5 + 0.5;
     float hvNoise = hvValueNoise(vHvMetalWorldPosition * 22.0);
     float hvTexture = (hvBrush * 0.075) + (hvFineBrush * 0.028) + ((hvNoise - 0.5) * 0.085);
     vec3 hvLayeredGold = mix(uBronzeGold, uAntiqueGold, 0.62 + hvTexture);
     hvLayeredGold = mix(hvLayeredGold, uChampagneGold, uMetallicFocus * 0.12);
     hvLayeredGold = clamp(hvLayeredGold, vec3(0.0), vec3(0.92, 0.76, 0.34));
     float hvGoldStrength = clamp(uGoldMix, 0.0, 1.0) * 0.88;
     diffuseColor.rgb = mix(diffuseColor.rgb, hvLayeredGold, hvGoldStrength);`,
  )
}
