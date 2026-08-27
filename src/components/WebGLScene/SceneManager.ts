import * as THREE from "three";
import { CameraController } from "./CameraController";
import { createInfiniteGrid, type GridHandle } from "./InfiniteGrid";
import { createPostProcessing, type PostProcessingHandle } from "./PostProcessing";
import {
  measureLayout,
  computeFr,
  LC,
  FOV_DEG,
  FOV_3D,
  type LayoutItem,
} from "./LayoutEngine";
import { createObject3D } from "./MaterialFactory";

interface LayoutObject {
  item: LayoutItem;
  object: THREE.Object3D;
  depthY: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function makeOrthographic(
  camera: THREE.PerspectiveCamera,
  height: number,
  target: THREE.Matrix4
) {
  const fovRad = (camera.fov * Math.PI) / 180;
  const h = height * Math.tan(fovRad / 2);
  const w = h * camera.aspect;
  target.makeOrthographic(-w, w, h, -h, camera.near, camera.far);
}

function lerpMatrix(
  a: THREE.Matrix4,
  b: THREE.Matrix4,
  t: number,
  result: THREE.Matrix4
) {
  const ae = a.elements;
  const be = b.elements;
  const re = result.elements;
  for (let i = 0; i < 16; i++) {
    re[i] = ae[i] + (be[i] - ae[i]) * t;
  }
}

export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private frameId = 0;
  private container: HTMLElement;
  private cameraController: CameraController;
  private grid: GridHandle | null = null;
  private postProcessing: PostProcessingHandle | null = null;
  private clock = new THREE.Clock();
  private layoutObjects: LayoutObject[] = [];
  private lastCountdownText = "";
  private countdownRebuildPending = false;
  private onResizeBound: () => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onWheelBound: (e: WheelEvent) => void;

  private spreadT = 0;
  private spreadProgress = 0;
  private targetProgress = 0;
  private transitionStart = 0;
  private transitionFrom = 0;
  private sceneReady = false;
  private introMode = false;
  private introDuration = 2000;
  onIntroComplete: (() => void) | null = null;

  private audioEngine: import("../../audio/AmbientEngine").AmbientEngine | null = null;
  private lastScrollY = 0;
  private lastScrollTime = 0;
  private scrollVel = 0;

  private orthoMatrix = new THREE.Matrix4();
  private perspMatrix = new THREE.Matrix4();
  private blendedMatrix = new THREE.Matrix4();

  constructor(container: HTMLElement) {
    this.container = container;
    this.cameraController = new CameraController();

    // 1. Renderer Setup - No AA because PostProcessing handles it
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    // 2. Camera Setup — height 800 matches shopify.design's lc constant
    const baseFOV = this.calculateFOV(container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(
      baseFOV,
      container.clientWidth / container.clientHeight,
      0.5,
      8000
    );
    this.camera.position.set(0, 800, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

    // 3. Scene Setup - Start WHITE, not black
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.fog = new THREE.Fog(0xffffff, 9999, 10000);

    // 4. Grid & PostProcessing Setup
    this.grid = createInfiniteGrid(this.scene);
    this.postProcessing = createPostProcessing(this.renderer, this.scene, this.camera);

    this.onResizeBound = this.onResize.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    window.addEventListener("resize", this.onResizeBound);
    container.addEventListener("mousemove", this.onMouseMoveBound);
    container.addEventListener("wheel", this.onWheelBound, { passive: false });

    this.buildLayoutScene();
    this.animate();
  }

  setAudioEngine(engine: import("../../audio/AmbientEngine").AmbientEngine) {
    this.audioEngine = engine;
  }

  startSpread() {
    this.transitionFrom = this.spreadProgress;
    this.targetProgress = 1;
    this.transitionStart = performance.now();
  }

  stopSpread() {
    this.transitionFrom = this.spreadProgress;
    this.targetProgress = 0;
    this.transitionStart = performance.now();
  }

  startIntro() {
    this.introMode = true;
    this.spreadProgress = 0.6;
    this.spreadT = 0.6;
    this.transitionFrom = 0.6;
    this.targetProgress = 0;
    this.transitionStart = performance.now();
  }

  private calculateFOV(clientHeight: number): number {
    const Fr = 2 * Math.tan(50 * Math.PI / 180 / 2) / 900;
    const val = Fr * clientHeight;
    return 2 * Math.atan(val / (2 * 800)) * (180 / Math.PI);
  }

  private updateSpread() {
    if (this.transitionStart <= 0) return;

    const entering = this.targetProgress === 1;
    const duration = this.introMode ? this.introDuration : (entering ? 700 : 600);
    const easeFn = this.introMode ? easeOutExpo : easeInOutQuint;

    const elapsed = performance.now() - this.transitionStart;
    const rawT = Math.min(elapsed / duration, 1);

    if (this.introMode) {
      this.spreadProgress = 0.6;
      if (this.postProcessing) {
        this.postProcessing.setRevealT(easeFn(rawT));
      }
    } else {
      this.spreadProgress = this.transitionFrom + (this.targetProgress - this.transitionFrom) * easeFn(rawT);
    }

    this.spreadProgress = Math.max(0, Math.min(1, this.spreadProgress));
    this.spreadT = this.spreadProgress;

    if (rawT >= 1 && this.introMode) {
      this.introMode = false;
      this.transitionStart = 0;
      this.spreadProgress = 0;
      this.spreadT = 0;
      if (this.postProcessing) {
        this.postProcessing.setRevealT(1.0);
      }
      if (this.onIntroComplete) this.onIntroComplete();
    }
  }

  private async buildLayoutScene() {
    const items = measureLayout();
    const fr = computeFr(window.innerHeight);

    let heroZ = 0;
    for (const item of items) {
      if (item.id === "hero-line-1") heroZ = item.worldZ;
    }
    this.cameraController.setInitialScrollZ(heroZ);

    // Find the clock ring center so we can align other clock elements to it
    let ringX = 0, ringZ = 0, ringDepth = -200;
    for (const item of items) {
      if (item.id === "cd-ring") {
        ringX = item.worldX;
        ringZ = item.worldZ;
        ringDepth = item.depth;
        break;
      }
    }

    for (const item of items) {
      try {
        const obj = await createObject3D(item);
        let depthY = item.depth * fr;
        let posX = item.worldX;
        let posZ = item.worldZ;

        // Force clock elements to share the ring's center and depth
        if (item.id === "cd-hand" || item.id === "countdown-number") {
          posX = ringX;
          posZ = ringZ;
          depthY = ringDepth * fr;
        }

        obj.position.set(posX, 0, posZ);
        this.scene.add(obj);
        this.layoutObjects.push({ item, object: obj, depthY });
      } catch (e) {
        console.warn(`[SceneManager] Failed to create ${item.id}:`, e);
      }
    }

    this.sceneReady = true;
    if (this.introMode) {
      for (const lo of this.layoutObjects) {
        lo.object.position.y = lo.depthY * this.spreadT;
      }
    }
    if (this.targetProgress === 1 && this.transitionStart === 0) {
      this.startSpread();
    }
  }

  private onMouseMove(e: MouseEvent) {
    this.cameraController.onMouseMove(
      e.clientX,
      e.clientY,
      this.container.clientWidth,
      this.container.clientHeight
    );
  }

  private onWheel(e: WheelEvent) {
    if (this.spreadT > 0.1) {
      e.preventDefault();
      this.cameraController.onWheel(e.deltaY);
      this.container.dataset.cameraScrollTarget = String(this.cameraController.getWheelTarget());
    }
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    const time = this.clock.getElapsedTime();

    this.updateSpread();

    this.cameraController.update(this.camera, this.spreadT);

    for (const lo of this.layoutObjects) {
      lo.object.position.y = lo.depthY * this.spreadT;

      if (lo.item.id === "cd-ring") {
        const circle = lo.item.element.querySelector("circle");
        if (circle) {
          const dashoffset = parseFloat(circle.getAttribute("stroke-dashoffset") || "1");
          const drawT = Math.max(0, Math.min(1, 1 - dashoffset));
          const ringMat = lo.object.userData.ringMat as THREE.ShaderMaterial | undefined;
          const tickMat = lo.object.userData.tickMat as THREE.ShaderMaterial | undefined;
          if (ringMat) ringMat.uniforms.u_drawT.value = drawT;
          if (tickMat) tickMat.uniforms.u_drawT.value = drawT;
        }
      }

      if (lo.item.id === "cd-hand") {
        const handEl = lo.item.element as unknown as SVGImageElement;
        const svg = handEl.closest("svg");
        if (svg) {
          const transform = svg.style.transform || "";
          const match = transform.match(/rotate\(([\d.]+)deg\)/);
          if (match) {
            lo.object.rotation.y = -(parseFloat(match[1]) * Math.PI) / 180;
          }
        }
      }

      if (lo.item.id === "countdown-number" && !this.countdownRebuildPending) {
        const currentText = lo.item.element.dataset.text || "";
        if (currentText && currentText !== this.lastCountdownText) {
          this.lastCountdownText = currentText;
          this.countdownRebuildPending = true;
          const oldObj = lo.object;
          const savedPos = oldObj.position.clone();
          const savedY = lo.depthY;
          createObject3D({ ...lo.item }).then((newObj) => {
            this.scene.remove(oldObj);
            oldObj.traverse((child) => {
              if (child instanceof THREE.LineSegments || child instanceof THREE.Mesh) {
                child.geometry.dispose();
              }
            });
            newObj.position.copy(savedPos);
            newObj.position.y = savedY * this.spreadT;
            this.scene.add(newObj);
            lo.object = newObj;
            this.countdownRebuildPending = false;
          }).catch(() => {
            this.countdownRebuildPending = false;
          });
        }
      }
    }

    // Animate fog and background: white (spreadT=0) → pure black (spreadT=1)
    const startColor = new THREE.Color(0xffffff);
    const endColor = new THREE.Color(0x000000);
    const currentColor = new THREE.Color().lerpColors(startColor, endColor, this.spreadT);

    (this.scene.fog as THREE.Fog).color.copy(currentColor);

    if (this.introMode || this.spreadT < 0.01) {
      this.scene.background = null;
    } else {
      this.scene.background = currentColor;
    }

    // Fog distances: wider than production because our fog is scene-global, not camera-relative
    (this.scene.fog as THREE.Fog).near = lerp(9999, 200, this.spreadT);
    (this.scene.fog as THREE.Fog).far = lerp(10000, 1800, this.spreadT);

    // Dynamic FOV: lerp between base FOV and spread FOV (75)
    const baseFOV = this.calculateFOV(this.container.clientHeight);
    this.camera.fov = lerp(baseFOV, FOV_3D, this.spreadT);
    this.camera.updateProjectionMatrix();

    const epsilon = 0.001;
    if (this.spreadT > epsilon) {
      this.perspMatrix.copy(this.camera.projectionMatrix);
      makeOrthographic(this.camera, LC, this.orthoMatrix);
      const blendT = this.spreadT * this.spreadT * this.spreadT;
      lerpMatrix(this.orthoMatrix, this.perspMatrix, blendT, this.blendedMatrix);
      this.camera.projectionMatrix.copy(this.blendedMatrix);
      this.camera.projectionMatrixInverse.copy(this.blendedMatrix).invert();
    } else {
      makeOrthographic(this.camera, LC, this.orthoMatrix);
      this.camera.projectionMatrix.copy(this.orthoMatrix);
      this.camera.projectionMatrixInverse.copy(this.orthoMatrix).invert();
    }

    if (this.grid) {
      this.grid.update(time, this.spreadT);
    }

    // Feed audio engine with scroll kinetics and transition state
    if (this.audioEngine) {
      this.audioEngine.setTransitionAmount(this.spreadT, 0.03);

      const now = performance.now();
      const dt = Math.max(0.001, (now - this.lastScrollTime) / 1000);
      this.lastScrollTime = now;
      const curScrollY = window.scrollY || 0;
      const scrollDelta = curScrollY - this.lastScrollY;
      this.lastScrollY = curScrollY;
      const vel = scrollDelta / dt;
      const accel = (vel - this.scrollVel) / dt;
      this.scrollVel = vel;
      this.audioEngine.setScrollKinetics(vel, accel, 0.05);
    }

    // Skip rendering entirely in 2D mode — canvas stays transparent
    if (this.spreadT < 0.01) {
      this.renderer.setRenderTarget(null);
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear();
    } else if (this.postProcessing) {
      this.postProcessing.update(this.spreadT, time);
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.fov = this.calculateFOV(h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.postProcessing) {
      this.postProcessing.resize(w, h);
    }
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.onResizeBound);
    this.container.removeEventListener("mousemove", this.onMouseMoveBound);
    this.container.removeEventListener("wheel", this.onWheelBound);

    this.scene.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.LineSegments ||
        obj instanceof THREE.Points
      ) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => {
            if ("map" in m && m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          if ("map" in obj.material && obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    });

    this.layoutObjects = [];
    if (this.postProcessing) {
      this.postProcessing.dispose();
    }
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      try { this.renderer.domElement.parentNode.removeChild(this.renderer.domElement); } catch {}
    }
  }
}
