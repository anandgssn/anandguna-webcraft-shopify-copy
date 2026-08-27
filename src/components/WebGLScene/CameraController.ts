import * as THREE from "three";

const LC = 800;
const AD = 500;
const ED = 800;
const WD = Math.PI / 3;
const UX = 0.15;
const LOOK_SPEED = 6;
const PB = 0.28;
const DB = 0.04;
const LB = 0.2;
const SCROLL_STIFFNESS = 400;
const SCROLL_DAMPING = 28;
const DT = 1 / 60;
const MAX_SCROLL_Z = 12000;

export class CameraController {
  private mouseX = 0;
  private mouseY = 0;
  private smoothMouseX = 0;
  private smoothMouseY = 0;
  private lookPanX = 0;
  private lookPitch = 0;
  private scrollZTarget = 0;
  private scrollZ = 0;
  private scrollZVel = 0;

  setInitialScrollZ(z: number) {
    this.scrollZ = z;
    this.scrollZTarget = z;
  }
  private scale = 1;
  private lookScale = 1;
  private cameraLocked = false;

  onMouseMove(clientX: number, clientY: number, width: number, height: number) {
    this.mouseX = (clientX / width) * 2 - 1;
    this.mouseY = (clientY / height) * 2 - 1;
  }

  onWheel(deltaY: number) {
    // No longer accumulating deltaY. Scroll is handled by window.scrollY in update()
  }

  update(camera: THREE.PerspectiveCamera, spreadT: number) {
    this.smoothMouseX += (this.mouseX - this.smoothMouseX) * UX;
    this.smoothMouseY += (this.mouseY - this.smoothMouseY) * UX;

    const targetPanX = this.smoothMouseX * ED * this.scale * spreadT * this.lookScale;
    const targetPitch = this.smoothMouseY * WD * spreadT * this.lookScale;

    if (this.cameraLocked) {
      this.lookPanX = 0;
      this.lookPitch = 0;
    } else {
      this.lookPanX += (targetPanX - this.lookPanX) / LOOK_SPEED;
      this.lookPitch += (targetPitch - this.lookPitch) / LOOK_SPEED;
    }

    if (spreadT < 0.01) {
      const b = 1 - spreadT;
      const decay = 1 - Math.min(PB, DB + b * LB);
      this.lookPanX *= decay;
      this.lookPitch *= decay;
      this.smoothMouseX *= decay;
      this.smoothMouseY *= decay;
    }

    // Map scroll position to camera Z
    const Fr = (2 * 800 * Math.tan((50 * Math.PI / 180) / 2)) / 900;
    const scrollY = window.scrollY || 0;
    this.scrollZTarget = scrollY * Fr;

    this.scrollZVel += (SCROLL_STIFFNESS * (this.scrollZTarget - this.scrollZ) - SCROLL_DAMPING * this.scrollZVel) * DT;
    this.scrollZ += this.scrollZVel * DT;
    this.scrollZ = Math.max(-500, Math.min(MAX_SCROLL_Z, this.scrollZ));

    const cameraHeight = LC * this.scale;
    const orbitRadius = AD * this.scale;

    const lookAtX = this.lookPanX;
    const lookAtY = cameraHeight - orbitRadius * Math.cos(this.lookPitch);
    const lookAtZ = orbitRadius * Math.sin(Math.abs(this.lookPitch)) * Math.sign(this.lookPitch) + this.scrollZ;

    camera.position.set(0, cameraHeight, this.scrollZ);
    camera.up.set(0, 0, -1);
    camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }

  getScrollZ(): number {
    return this.scrollZ;
  }
}
