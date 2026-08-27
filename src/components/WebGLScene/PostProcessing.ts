import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const PASSTHROUGH_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FBM_SHADER = /* glsl */ `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 2; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
`;

const REVEAL_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform float u_revealT;
  uniform float u_time;
  uniform float u_aspect;
  uniform vec2 u_center;
  varying vec2 vUv;

  ${FBM_SHADER}

  void main() {
    vec4 color = texture2D(tDiffuse, vUv);

    if (u_revealT >= 1.0) {
      gl_FragColor = color;
      return;
    }

    if (u_revealT <= 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float maxDist = 0.5 * sqrt(u_aspect * u_aspect + 1.0);

    vec2 center = vUv - u_center;
    center.x *= u_aspect;
    float rawDist = length(center);
    float angle = center.y / (abs(center.x) + 0.0001);
    float warpNoise = fbm(vec2(angle * 2.0, rawDist * 3.0) + u_time * 2.5);
    float dist = rawDist + (warpNoise - 0.5) * 0.2;

    float wipeRadius = u_revealT * (maxDist + 0.2);
    float mask = smoothstep(wipeRadius, wipeRadius - 0.15, dist);

    gl_FragColor = vec4(mix(vec3(0.0), color.rgb, 1.0 - mask), 1.0);
  }
`;

const CHROM_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tDiffuse;
  uniform float u_spreadT;
  uniform float u_blurStrength;
  uniform float u_blurEdgeStart;
  uniform float u_vignetteDark;
  uniform float u_vignetteStart;
  uniform float u_chromStrength;
  uniform float u_barrelWarp;
  uniform float u_warpCenter;
  varying vec2 vUv;

  #define SAMPLES 12

  void main() {
    vec2 center = vec2(0.5);
    vec2 delta = vUv - center;
    float normDist = length(delta * 2.0);

    float spreadPulse = smoothstep(0.0, 0.35, u_spreadT) * (1.0 - smoothstep(0.45, 0.95, u_spreadT));
    float warpT = u_barrelWarp * spreadPulse;

    vec2 warpedUv = vUv;
    if (warpT > 0.0001) {
      float r2 = dot(delta, delta) * 4.0;
      warpedUv = center + delta * (1.0 - warpT * (r2 + u_warpCenter));
    }

    float blurMask = smoothstep(u_blurEdgeStart, 1.0, normDist);
    float blurAmount = blurMask * u_blurStrength * u_spreadT;

    float vigMask = smoothstep(u_vignetteStart, 1.0, normDist);
    float vigAlpha = vigMask * u_vignetteDark * u_spreadT;

    float chromT = u_chromStrength * spreadPulse * normDist;
    vec2 chromDir = delta * (chromT / (normDist * 0.5 + 0.0001));

    if (blurAmount < 0.0001 && chromT < 0.0001) {
      vec3 col = texture2D(tDiffuse, warpedUv).rgb;
      col *= (1.0 - vigAlpha);
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    if (blurAmount < 0.0001) {
      float r = texture2D(tDiffuse, warpedUv + chromDir).r;
      float g = texture2D(tDiffuse, warpedUv).g;
      float b = texture2D(tDiffuse, warpedUv - chromDir).b;
      vec3 col = vec3(r, g, b) * (1.0 - vigAlpha);
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    vec2 blurDir = delta * blurAmount;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < SAMPLES; i++) {
      float t = float(i) / float(SAMPLES - 1);
      vec2 sampleUv = warpedUv + blurDir * t;
      acc.r += texture2D(tDiffuse, sampleUv + chromDir).r;
      acc.g += texture2D(tDiffuse, sampleUv).g;
      acc.b += texture2D(tDiffuse, sampleUv - chromDir).b;
    }

    vec3 col = acc / float(SAMPLES);
    col *= (1.0 - vigAlpha);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface PostProcessingHandle {
  composer: EffectComposer;
  update: (spreadT: number, time: number) => void;
  render: () => void;
  resize: (width: number, height: number) => void;
  setRevealT: (t: number) => void;
  dispose: () => void;
}

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): PostProcessingHandle {
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;

  const renderTarget = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const composer = new EffectComposer(renderer, renderTarget);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const chromPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      u_spreadT: { value: 0 },
      u_blurStrength: { value: 0.15 },
      u_blurEdgeStart: { value: 0.7 },
      u_vignetteDark: { value: 0.6 },
      u_vignetteStart: { value: 0.7 },
      u_chromStrength: { value: 0.024 },
      u_barrelWarp: { value: 0.3 },
      u_warpCenter: { value: 0.15 },
    },
    vertexShader: PASSTHROUGH_VERTEX,
    fragmentShader: CHROM_FRAGMENT,
  });
  composer.addPass(chromPass);

  const revealPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      u_revealT: { value: 1.0 },
      u_time: { value: 0 },
      u_aspect: { value: w / h },
      u_center: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: PASSTHROUGH_VERTEX,
    fragmentShader: REVEAL_FRAGMENT,
  });
  composer.addPass(revealPass);

  return {
    composer,

    update(spreadT: number, time: number) {
      chromPass.uniforms.u_spreadT.value = spreadT;
      revealPass.uniforms.u_time.value = time;
    },

    setRevealT(t: number) {
      revealPass.uniforms.u_revealT.value = t;
    },

    render() {
      composer.render();
    },

    resize(width: number, height: number) {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      composer.setSize(width * dpr, height * dpr);
      revealPass.uniforms.u_aspect.value = width / height;
    },

    dispose() {
      renderTarget.dispose();
    },
  };
}
