import * as THREE from "three";
import { FontLoader, type Font } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import type { LayoutItem } from "./LayoutEngine";

let cachedFont: Font | null = null;
let fontLoadFailed = false;
const textureLoader = new THREE.TextureLoader();
const fontLoader = new FontLoader();

async function loadFont(): Promise<Font | null> {
  if (cachedFont) return cachedFont;
  if (fontLoadFailed) return null;

  try {
    cachedFont = await fontLoader.loadAsync(
      "/fonts/AntiqueLegacy-Medium.typeface.json"
    );
    return cachedFont;
  } catch {
    fontLoadFailed = true;
    console.warn(
      "[MaterialFactory] 3D typeface unavailable; using canvas text fallback."
    );
    return null;
  }
}

function createTextMesh(
  item: LayoutItem,
  font: Font
): THREE.Object3D {
  const el = item.element;
  const text = el.dataset.text || el.textContent?.trim() || "";
  if (!text) return new THREE.Group();

  const computed = window.getComputedStyle(el);
  const isTagline = item.id.includes("tagline") || item.id.includes("body");
  if (isTagline) {
    return createCanvasTextFallback(item, text, computed);
  }

  const isCountdownNumber = item.id === "countdown-number";
  const worldFontSize = isCountdownNumber
    ? item.worldHeight * 1.15
    : item.worldHeight * 0.85;
  const extrudeDepth = isCountdownNumber
    ? worldFontSize * 0.8
    : worldFontSize * 0.4;

  try {
    const shapes = font.generateShapes(text, worldFontSize);
    const DIVISIONS = 128;
    const outlinePoints: THREE.Vector3[] = [];

    for (const shape of shapes) {
      const pts = shape.getPoints(DIVISIONS);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        outlinePoints.push(new THREE.Vector3(a.x, a.y, 0));
        outlinePoints.push(new THREE.Vector3(b.x, b.y, 0));
      }
      if (shape.holes) {
        for (const hole of shape.holes) {
          const hPts = hole.getPoints(DIVISIONS);
          for (let i = 0; i < hPts.length; i++) {
            const a = hPts[i];
            const b = hPts[(i + 1) % hPts.length];
            outlinePoints.push(new THREE.Vector3(a.x, a.y, 0));
            outlinePoints.push(new THREE.Vector3(b.x, b.y, 0));
          }
        }
      }
    }

    const allLinePoints: number[] = [];
    for (const p of outlinePoints) {
      allLinePoints.push(p.x, p.y, 0);
    }
    for (const p of outlinePoints) {
      allLinePoints.push(p.x, p.y, extrudeDepth);
    }
    for (const shape of shapes) {
      const pts = shape.getPoints(DIVISIONS);
      let minY = Infinity;
      for (const p of pts) { if (p.y < minY) minY = p.y; }
      const threshold = minY + worldFontSize * 0.05;
      for (const p of pts) {
        if (p.y <= threshold) {
          allLinePoints.push(p.x, p.y, 0);
          allLinePoints.push(p.x, p.y, extrudeDepth);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(allLinePoints, 3));
    lineGeo.computeBoundingBox();
    const center = lineGeo.boundingBox!.getCenter(new THREE.Vector3());
    lineGeo.translate(-center.x, -center.y, -center.z);

    const extGeo = new TextGeometry(text, {
      font,
      size: worldFontSize,
      depth: extrudeDepth,
      curveSegments: 16,
      bevelEnabled: false,
    });
    extGeo.computeBoundingBox();
    extGeo.center();

    const group = new THREE.Group();

    const solidMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.85,
      fog: false,
      depthWrite: true,
    });
    group.add(new THREE.Mesh(extGeo, solidMat));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1.0,
      fog: false,
      depthTest: true,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    group.rotation.x = -Math.PI / 2;
    return group;
  } catch {
    return createCanvasTextFallback(item, text, computed);
  }
}

function createCanvasTextFallback(
  item: LayoutItem,
  text: string,
  computed: CSSStyleDeclaration
): THREE.Mesh {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio, 2);
  const w = Math.ceil(item.rect.width * dpr);
  const h = Math.ceil(item.rect.height * dpr);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, item.rect.width / 2, item.rect.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const geo = new THREE.PlaneGeometry(item.worldWidth, item.worldHeight);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

function createShapeMesh(item: LayoutItem): THREE.Object3D {
  const w = item.worldWidth;
  const h = item.worldHeight;
  const color = item.color
    ? new THREE.Color(`#${item.color}`)
    : new THREE.Color("#ffffff");

  if (item.shapeType === "pill") {
    const r = Math.min(h / 2, w / 2);
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    if (item.outline) {
      const edges = new THREE.EdgesGeometry(geo);
      const mesh = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, fog: false })
      );
      geo.dispose();
      return mesh;
    }
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      fog: false,
    });

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat));

    const el = item.element;
    const label = el.textContent?.trim();
    if (label && label.length > 0) {
      const canvas = document.createElement("canvas");
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.ceil(item.rect.width * dpr);
      canvas.height = Math.ceil(item.rect.height * dpr);
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#ffffff";
      ctx.font = `500 ${Math.round(item.rect.height * 0.35)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(label, item.rect.width / 2, item.rect.height / 2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      const labelGeo = new THREE.PlaneGeometry(w * 0.9, h * 0.9);
      labelGeo.rotateX(-Math.PI / 2);
      const labelMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const labelMesh = new THREE.Mesh(labelGeo, labelMat);
      labelMesh.position.y = 0.1;
      group.add(labelMesh);
    }
    return group;
  }

  if (item.shapeType === "circle") {
    const radius = Math.min(w, h) / 2;
    if (item.outline) {
      if (item.id === "cd-ring") {
        const group = new THREE.Group();
        const RING_SEGMENTS = 256;
        const TICK_COUNT = 221;
        const TICK_MID = Math.floor(TICK_COUNT / 2);
        const innerR = radius * 0.9655;
        const outerR = radius * 0.976;

        // --- Ring outline (progressive arc) ---
        const ringPos: number[] = [];
        const ringAngle: number[] = [];
        for (let i = 0; i < RING_SEGMENTS; i++) {
          const a1 = (i / RING_SEGMENTS) * Math.PI * 2;
          const a2 = ((i + 1) / RING_SEGMENTS) * Math.PI * 2;
          const norm = i / RING_SEGMENTS;
          ringPos.push(
            radius * Math.sin(a1), 0, -radius * Math.cos(a1),
            radius * Math.sin(a2), 0, -radius * Math.cos(a2)
          );
          ringAngle.push(norm, norm);
        }
        const ringGeo = new THREE.BufferGeometry();
        ringGeo.setAttribute("position", new THREE.Float32BufferAttribute(ringPos, 3));
        ringGeo.setAttribute("a_t", new THREE.Float32BufferAttribute(ringAngle, 1));

        const arcVert = /* glsl */ `
          attribute float a_t;
          varying float v_t;
          void main() {
            v_t = a_t;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;
        const arcFrag = /* glsl */ `
          uniform float u_drawT;
          uniform vec3 u_color;
          varying float v_t;
          void main() {
            if (v_t > u_drawT) discard;
            gl_FragColor = vec4(u_color, 0.85);
          }
        `;

        const ringMat = new THREE.ShaderMaterial({
          uniforms: {
            u_drawT: { value: 1.0 },
            u_color: { value: new THREE.Color(color) },
          },
          vertexShader: arcVert,
          fragmentShader: arcFrag,
          transparent: true,
          depthWrite: false,
        });
        group.add(new THREE.LineSegments(ringGeo, ringMat));

        // --- Tick marks (progressive sweep from midpoint outward) ---
        const tickPos: number[] = [];
        const tickT: number[] = [];
        for (let i = 0; i < TICK_COUNT; i++) {
          const angle = (i / TICK_COUNT) * Math.PI * 2;
          const sweepNorm = ((i - TICK_MID + TICK_COUNT) % TICK_COUNT) / (TICK_COUNT - 1);
          const cos = Math.sin(angle);
          const sin = -Math.cos(angle);
          tickPos.push(
            outerR * cos, 0, outerR * sin,
            innerR * cos, 0, innerR * sin
          );
          tickT.push(sweepNorm, sweepNorm);
        }
        const tickGeo = new THREE.BufferGeometry();
        tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPos, 3));
        tickGeo.setAttribute("a_t", new THREE.Float32BufferAttribute(tickT, 1));

        const tickMat = new THREE.ShaderMaterial({
          uniforms: {
            u_drawT: { value: 1.0 },
            u_color: { value: new THREE.Color(0xe5e5e5) },
          },
          vertexShader: arcVert,
          fragmentShader: arcFrag,
          transparent: true,
          depthWrite: false,
        });
        group.add(new THREE.LineSegments(tickGeo, tickMat));

        group.userData.ringMat = ringMat;
        group.userData.tickMat = tickMat;
        group.rotateX(-Math.PI / 2);
        return group;
      }
      const geo = new THREE.RingGeometry(radius * 0.97, radius, 64);
      geo.rotateX(-Math.PI / 2);
      return new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          fog: false,
        })
      );
    }
    const geo = new THREE.CircleGeometry(radius, 64);
    geo.rotateX(-Math.PI / 2);
    return new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      })
    );
  }

  const geo = new THREE.PlaneGeometry(w, h);
  geo.rotateX(-Math.PI / 2);
  const edges = new THREE.EdgesGeometry(geo);
  const mesh = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4, fog: false })
  );
  geo.dispose();
  return mesh;
}

function createImageMesh(item: LayoutItem): THREE.Mesh {
  const el = item.element;
  const img =
    el instanceof HTMLImageElement
      ? el
      : el.querySelector("img");
  const svgImg = el instanceof SVGImageElement ? el : el.querySelector("image");
  const src = img?.currentSrc || img?.src ||
              svgImg?.getAttribute("href") || svgImg?.getAttribute("xlink:href") ||
              (el as HTMLImageElement).src;

  const geo = new THREE.PlaneGeometry(item.worldWidth, item.worldHeight);
  geo.rotateX(-Math.PI / 2);

  if (src) {
    const texture = textureLoader.load(src);
    texture.minFilter = THREE.LinearFilter;
    return new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0, // Changed from 0.7 to 1.0
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending, // Changed from AdditiveBlending
        depthWrite: false,
        fog: false,
      })
    );
  }

  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      fog: false,
    })
  );
}

function createVideoMesh(item: LayoutItem): THREE.Mesh {
  const el = item.element;
  const video = el.querySelector("video") as HTMLVideoElement | null;
  const geo = new THREE.PlaneGeometry(item.worldWidth, item.worldHeight);
  geo.rotateX(-Math.PI / 2);

  if (video && video.readyState >= 1) {
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    return new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0, // Changed from 0.7 to 1.0
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending, // Changed from AdditiveBlending
        depthWrite: false,
        fog: false,
      })
    );
  }

  const poster =
    video?.poster ||
    el.querySelector("img")?.currentSrc ||
    "";
  if (poster) {
    const texture = textureLoader.load(poster);
    texture.minFilter = THREE.LinearFilter;
    return new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0, // Changed from 0.7 to 1.0
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending, // Changed from AdditiveBlending
        depthWrite: false,
        fog: false,
      })
    );
  }

  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      fog: false,
    })
  );
}

export async function createObject3D(
  item: LayoutItem
): Promise<THREE.Object3D> {
  switch (item.layout) {
    case "text": {
      const font = await loadFont();
      if (font) return createTextMesh(item, font);

      const text = item.element.dataset.text || item.element.textContent?.trim() || "";
      if (!text) return new THREE.Group();
      return createCanvasTextFallback(item, text, window.getComputedStyle(item.element));
    }
    case "shape":
      return createShapeMesh(item);
    case "image":
      return createImageMesh(item);
    case "video":
      return createVideoMesh(item);
    default:
      return new THREE.Group();
  }
}
