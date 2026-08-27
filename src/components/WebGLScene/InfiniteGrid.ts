import * as THREE from "three";

export interface GridHandle {
  group: THREE.Group;
  update: (time: number, spreadT: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants — extracted from shopify.design production bundle        */
/* ------------------------------------------------------------------ */

const LAYER_COUNT = 10;
const CELL_SIZE = 149;
const NORMAL_DOT_SIZE = 8;
const CORNER_DOT_SIZE = 8;
const LAYER_SPACING = 150;
const GRID_PADDING = 6;
const GRID_STRIDE = 3; // bi constant — every 3rd cell gets a dot
const DOT_DENSITY = 0.25; // Reduced from 0.5 — fewer dots

/* ------------------------------------------------------------------ */
/*  Dot Layer Vertex Shader                                            */
/*  Renders the main grid dots. In 2D mode (spreadT=0) they are       */
/*  static. In 3D mode they animate along grid lanes.                  */
/* ------------------------------------------------------------------ */

const DOT_VERTEX = /* glsl */ `
  attribute float a_size;
  attribute float a_axis;
  attribute float a_sign;
  attribute float a_speed;
  attribute float a_phase;

  uniform float u_time;
  uniform float u_motion;
  uniform float u_sizeAttenuation;
  uniform float u_dotScale;
  uniform float u_startX;
  uniform float u_endX;
  uniform float u_startZ;
  uniform float u_endZ;
  uniform float u_riseY;
  uniform float u_xzDensity;
  uniform float u_zCenter;

  varying float v_fogDepth;

  void main() {
    vec3 p = position;

    // Animate dots along grid lanes when in 3D mode
    float t = fract(u_time * a_speed + a_phase);
    float travel = (a_sign < 0.0) ? (1.0 - t) : t;
    if (a_axis < 0.5) {
      p.x = mix(u_startX, u_endX, travel);
    } else {
      p.z = mix(u_startZ, u_endZ, travel);
    }
    p = mix(position, p, u_motion);

    // Apply density scaling
    p.x *= u_xzDensity;
    p.z = u_zCenter + (p.z - u_zCenter) * u_xzDensity;
    p.y += u_riseY;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float perspScale = 300.0 / -mvPosition.z;
    float scale = mix(1.0, perspScale, u_sizeAttenuation);
    gl_PointSize = a_size * 2.0 * scale * u_dotScale;
    v_fogDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/* ------------------------------------------------------------------ */
/*  Dot Layer Fragment Shader                                          */
/*  Renders each dot as a smooth circle with fog-based fade.           */
/* ------------------------------------------------------------------ */

const DOT_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3 u_color;
  uniform float u_layerAlpha;
  uniform float u_fogNear;
  uniform float u_fogFar;
  uniform vec3 u_fogColor;
  varying float v_fogDepth;

  void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float dist = length(coord);
    float alpha = 1.0 - smoothstep(0.8, 1.0, dist);
    if (alpha < 0.01) discard;

    float fogFactor = smoothstep(u_fogNear, u_fogFar, v_fogDepth);
    vec3 color = mix(u_color, u_fogColor, fogFactor);
    float finalAlpha = alpha * u_layerAlpha * (1.0 - fogFactor * 0.5);
    if (finalAlpha < 0.01) discard;

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  Glow Layer Vertex Shader                                           */
/*  Same positions as dots but larger point size for glow halo.        */
/* ------------------------------------------------------------------ */

const GLOW_VERTEX = /* glsl */ `
  attribute float a_size;
  uniform float u_sizeAttenuation;
  uniform float u_dotScale;
  varying vec3 v_worldPos;

  void main() {
    v_worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float perspScale = 300.0 / -mvPosition.z;
    float scale = mix(1.0, perspScale, u_sizeAttenuation);
    gl_PointSize = a_size * 4.0 * scale * u_dotScale;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/* ------------------------------------------------------------------ */
/*  Glow Layer Fragment Shader                                         */
/*  Electric sweep effect — waves of energy that pulse across the grid */
/* ------------------------------------------------------------------ */

const GLOW_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float u_time;
  uniform float u_spreadT;
  uniform float u_layerAlpha;
  uniform float u_exciteTint;
  varying vec3 v_worldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    float dist = length(coord);
    float fw = fwidth(dist);
    float core = 1.0 - smoothstep(0.35 - fw, 0.35 + fw, dist);
    float halo = exp(-dist * dist * 8.0) * 0.4;
    float glow = core + halo;
    if (glow < 0.01) discard;

    // Electric sweep waves
    float wx = v_worldPos.x * 0.003;
    float wz = v_worldPos.z * 0.003;
    float sweep1 = sin(wx * 3.0 + wz * 2.0 - u_time * 4.0 + hash(floor(v_worldPos.xz * 0.005)) * 6.283);
    float sweep2 = sin(wx * -2.0 + wz * 4.0 - u_time * 5.5 + hash(floor(v_worldPos.xz * 0.008 + 30.0)) * 6.283);
    float sweep3 = sin(wx * 1.0 - wz * 3.0 - u_time * 3.5 + hash(floor(v_worldPos.xz * 0.003 + 70.0)) * 6.283);
    float energy = max(step(0.85, sweep1), max(step(0.85, sweep2), step(0.85, sweep3)));

    float alpha = glow * energy * u_spreadT * u_layerAlpha * 5.0;
    if (alpha < 0.01) discard;

    vec3 warmGold = vec3(1.0, 0.88, 0.5);
    vec3 col = mix(vec3(1.0), warmGold, u_exciteTint);
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  Grid Line Vertex Shader                                            */
/* ------------------------------------------------------------------ */

const LINE_VERTEX = /* glsl */ `
  uniform float u_time;
  uniform float u_spreadT;
  varying vec3 v_worldPos;
  varying float v_depth;

  void main() {
    v_worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    v_depth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/* ------------------------------------------------------------------ */
/*  Grid Line Fragment Shader — cell-noise animation                   */
/* ------------------------------------------------------------------ */

const LINE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float u_time;
  uniform float u_spreadT;
  uniform float u_layerAlpha;
  uniform float u_fogNear;
  uniform float u_fogFar;
  uniform vec3 u_fogColor;
  varying vec3 v_worldPos;
  varying float v_depth;

  vec2 rand2(vec2 p) {
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
  }

  float cellNoise(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    float minDist = 1.0;
    for (int j = 0; j <= 1; j++) {
      for (int i = 0; i <= 1; i++) {
        vec2 b = vec2(float(i), float(j));
        vec2 r = rand2(p + b);
        vec2 cellPt = 0.5 + 0.5 * sin(u_time * 2.5 + 6.2831 * r);
        float d = length(b - f + cellPt);
        minDist = min(minDist, d);
      }
    }
    return minDist;
  }

  void main() {
    float fog = smoothstep(u_fogNear, u_fogFar, v_depth);
    float baseAlpha = mix(0.15, 1.0, u_spreadT) * u_layerAlpha * (1.0 - fog * 0.7);
    if (baseAlpha < 0.02) discard;

    vec2 noiseCoord = v_worldPos.xz * 0.006;
    float d = cellNoise(noiseCoord);
    float xzGlow = exp(-d * d * 25.0);
    float yPulse = 0.5 + 0.5 * sin(v_worldPos.y * 0.04 + u_time * 3.0);
    float yGlow = yPulse * yPulse;
    float animatedIntensity = max(xzGlow, yGlow * 0.6);
    float intensity = mix(1.0, animatedIntensity, u_spreadT);

    // Lines should blend with the background color
    vec3 baseColor = mix(vec3(0.78), vec3(1.0), u_spreadT);
    float alpha = intensity * baseAlpha;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(baseColor, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/*  Seeded RNG for deterministic dot placement                         */
/* ------------------------------------------------------------------ */

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ------------------------------------------------------------------ */
/*  Main Grid Creation Function                                        */
/* ------------------------------------------------------------------ */

export function createInfiniteGrid(scene: THREE.Scene): GridHandle {
  const group = new THREE.Group();
  const range = 3000;
  const gridUnit = CELL_SIZE / GRID_STRIDE;
  const dotMaterials: THREE.ShaderMaterial[] = [];
  const glowMaterials: THREE.ShaderMaterial[] = [];
  const lineMaterials: THREE.ShaderMaterial[] = [];

  const halfWidth = range;
  const halfDepth = range;
  const cols = Math.ceil((halfWidth * 2 + CELL_SIZE * GRID_PADDING * 2) / gridUnit) + 1;
  const rows = Math.ceil((halfDepth * 2 + CELL_SIZE * GRID_PADDING * 2) / gridUnit) + 1;
  const startX = -halfWidth - CELL_SIZE * GRID_PADDING;
  const startZ = -halfDepth - CELL_SIZE * GRID_PADDING;

  const centerLayer = Math.round((LAYER_COUNT - 1) / 2);

  /* ---- Build dot layers ---- */
  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    const rng = seededRandom(layer * 9973 + 7);
    const dots: { x: number; z: number; corner: boolean }[] = [];

    for (let row = 0; row < rows; row += GRID_STRIDE) {
      for (let col = 0; col < cols; col += GRID_STRIDE) {
        // DOT_DENSITY controls how many dots we keep
        if (rng() > DOT_DENSITY) continue;
        const x = startX + col * gridUnit;
        const z = startZ + row * gridUnit;
        const modX = ((x % CELL_SIZE) + CELL_SIZE) % CELL_SIZE;
        const modZ = ((z % CELL_SIZE) + CELL_SIZE) % CELL_SIZE;
        const isCornerX = modX < 0.01 || Math.abs(modX - CELL_SIZE) < 0.01;
        const isCornerZ = modZ < 0.01 || Math.abs(modZ - CELL_SIZE) < 0.01;
        dots.push({ x, z, corner: isCornerX && isCornerZ });
      }
    }

    const count = dots.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const axes = new Float32Array(count);
    const signs = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const dpr = Math.min(window.devicePixelRatio, 1.5);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = dots[i].x;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = dots[i].z;
      // Dots need to be visible — use full size, not 0.25 scale
      sizes[i] = (dots[i].corner ? CORNER_DOT_SIZE : NORMAL_DOT_SIZE) * dpr;
      axes[i] = rng() < 0.5 ? 0 : 1;
      signs[i] = rng() < 0.5 ? -1 : 1;
      speeds[i] = 0.28 + rng() * 0.5;
      phases[i] = rng();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("a_size", new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute("a_axis", new THREE.Float32BufferAttribute(axes, 1));
    geo.setAttribute("a_sign", new THREE.Float32BufferAttribute(signs, 1));
    geo.setAttribute("a_speed", new THREE.Float32BufferAttribute(speeds, 1));
    geo.setAttribute("a_phase", new THREE.Float32BufferAttribute(phases, 1));

    // Layer alpha: center layers are more opaque, edges fade
    const distFromCenter = Math.abs(layer - centerLayer) / centerLayer;
    const layerAlpha = 0.6 * (1 - distFromCenter * 0.6);

    /* ---- Dot material ---- */
    const dotMat = new THREE.ShaderMaterial({
      vertexShader: DOT_VERTEX,
      fragmentShader: DOT_FRAGMENT,
      uniforms: {
        u_time: { value: 0 },
        u_motion: { value: 0 },
        u_sizeAttenuation: { value: 0 },
        u_dotScale: { value: 1 },
        u_startX: { value: startX },
        u_endX: { value: -startX },
        u_startZ: { value: startZ },
        u_endZ: { value: -startZ },
        u_riseY: { value: 0 },
        u_xzDensity: { value: 1 },
        u_zCenter: { value: 0 },
        u_color: { value: new THREE.Color(0.78, 0.78, 0.78) }, // Light grey dots
        u_layerAlpha: { value: layerAlpha },
        u_fogNear: { value: 9999 },
        u_fogFar: { value: 10000 },
        u_fogColor: { value: new THREE.Color(1, 1, 1) },
      },
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    dotMaterials.push(dotMat);

    const dotPoints = new THREE.Points(geo, dotMat);
    dotPoints.position.y = (layer - centerLayer) * LAYER_SPACING;
    group.add(dotPoints);

    /* ---- Glow material (additive blending) ---- */
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      uniforms: {
        u_time: { value: 0 },
        u_spreadT: { value: 0 },
        u_layerAlpha: { value: layerAlpha * 0.8 },
        u_sizeAttenuation: { value: 0 },
        u_dotScale: { value: 1 },
        u_exciteTint: { value: 0.3 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    glowMaterials.push(glowMat);

    const glowPoints = new THREE.Points(geo, glowMat);
    glowPoints.position.y = (layer - centerLayer) * LAYER_SPACING;
    glowPoints.visible = false; // Only visible when spreadT > 0
    group.add(glowPoints);
  }

  /* ---- Grid lines at multiple Y levels ---- */
  const lineLayers = [0, -LAYER_SPACING, LAYER_SPACING];
  for (const yLevel of lineLayers) {
    const linePos: number[] = [];
    for (let i = -range; i <= range; i += CELL_SIZE) {
      linePos.push(-range, yLevel, i, range, yLevel, i);
      linePos.push(i, yLevel, -range, i, yLevel, range);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));

    const lineMat = new THREE.ShaderMaterial({
      vertexShader: LINE_VERTEX,
      fragmentShader: LINE_FRAGMENT,
      uniforms: {
        u_time: { value: 0 },
        u_spreadT: { value: 0 },
        u_layerAlpha: { value: yLevel === 0 ? 1.0 : 0.5 },
        u_fogNear: { value: 9999 },
        u_fogFar: { value: 10000 },
        u_fogColor: { value: new THREE.Color(1, 1, 1) },
      },
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    lineMaterials.push(lineMat);
    group.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  scene.add(group);

  /* ---- Glow points references for visibility toggling ---- */
  const glowPointsList: THREE.Points[] = [];
  group.children.forEach((child) => {
    if (child instanceof THREE.Points && (child.material as THREE.ShaderMaterial).blending === THREE.AdditiveBlending) {
      glowPointsList.push(child);
    }
  });

  return {
    group,
    update(time: number, spreadT = 0) {
      // Fog distances that match the scene fog
      const fogNear = THREE.MathUtils.lerp(9999, 200, spreadT);
      const fogFar = THREE.MathUtils.lerp(10000, 1800, spreadT);

      // Fog color: white → black
      const fogR = THREE.MathUtils.lerp(1.0, 0.0, spreadT);
      const fogG = fogR;
      const fogB = fogR;

      // Dot color: light grey in 2D → white in 3D
      const dotR = THREE.MathUtils.lerp(0.78, 0.55, spreadT);
      const dotG = dotR;
      const dotB = dotR;

      for (const mat of dotMaterials) {
        mat.uniforms.u_time.value = time * 0.15;
        mat.uniforms.u_motion.value = spreadT;
        mat.uniforms.u_sizeAttenuation.value = spreadT;
        mat.uniforms.u_dotScale.value = THREE.MathUtils.lerp(1, 0.8, spreadT);
        mat.uniforms.u_fogNear.value = fogNear;
        mat.uniforms.u_fogFar.value = fogFar;
        mat.uniforms.u_fogColor.value.setRGB(fogR, fogG, fogB);
        mat.uniforms.u_color.value.setRGB(dotR, dotG, dotB);
      }

      for (const mat of glowMaterials) {
        mat.uniforms.u_time.value = time;
        mat.uniforms.u_spreadT.value = spreadT;
        mat.uniforms.u_sizeAttenuation.value = spreadT;
        mat.uniforms.u_dotScale.value = THREE.MathUtils.lerp(1, 0.8, spreadT);
      }

      // Toggle glow visibility
      for (const gp of glowPointsList) {
        gp.visible = spreadT > 0.1;
      }

      for (const mat of lineMaterials) {
        mat.uniforms.u_time.value = time;
        mat.uniforms.u_spreadT.value = spreadT;
        mat.uniforms.u_fogNear.value = fogNear;
        mat.uniforms.u_fogFar.value = fogFar;
        mat.uniforms.u_fogColor.value.setRGB(fogR, fogG, fogB);
      }
    },
  };
}
