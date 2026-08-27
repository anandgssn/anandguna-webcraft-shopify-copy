export interface LayoutItem {
  id: string;
  layout: "text" | "shape" | "image" | "video";
  depth: number;
  color?: string;
  shapeType?: string;
  outline?: boolean;
  element: HTMLElement;
  rect: DOMRect;
  worldX: number;
  worldY: number;
  worldZ: number;
  worldWidth: number;
  worldHeight: number;
}

export const LC = 800;
export const FOV_DEG = 50;
export const FOV_3D = 45;
const HALF_FOV_RAD = ((FOV_DEG * Math.PI) / 180) / 2;

export function computeFr(viewportHeight: number): number {
  return (2 * LC * Math.tan(HALF_FOV_RAD)) / viewportHeight;
}

export async function waitForReadiness(timeout = 2500): Promise<void> {
  const deadline = Date.now() + timeout;

  const fontReady = document.fonts.ready;

  const images = Array.from(
    document.querySelectorAll<HTMLImageElement>('[data-layout="image"] img, [data-layout="image"][src]')
  );
  const imageReady = Promise.all(
    images.map((img) => img.decode().catch(() => {}))
  );

  const videos = Array.from(
    document.querySelectorAll<HTMLVideoElement>('[data-layout="video"] video')
  );
  const videoReady = Promise.all(
    videos.map(
      (v) =>
        new Promise<void>((resolve) => {
          if (v.readyState >= 1) return resolve();
          v.addEventListener("loadedmetadata", () => resolve(), { once: true });
        })
    )
  );

  const allReady = Promise.all([fontReady, imageReady, videoReady]);
  const timer = new Promise<void>((resolve) => {
    const remaining = Math.max(0, deadline - Date.now());
    setTimeout(() => {
      console.warn("[LayoutEngine] readiness timeout — proceeding with current measurements");
      resolve();
    }, remaining);
  });

  await Promise.race([allReady, timer]);
}

export function measureLayout(): LayoutItem[] {
  const elements = document.querySelectorAll<HTMLElement>("[data-layout]");
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fr = computeFr(vh);

  const items: LayoutItem[] = [];

  elements.forEach((el) => {
    const layout = el.dataset.layout as LayoutItem["layout"];
    const id = el.dataset.id || "";
    const depth = parseFloat(el.dataset.depth || "0");
    if (!layout || !id) return;

    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + scrollY + rect.height / 2;

    items.push({
      id,
      layout,
      depth,
      color: el.dataset.color,
      shapeType: el.dataset.shapeType,
      outline: el.dataset.outline === "true",
      element: el,
      rect,
      worldX: (cx - vw / 2) * fr,
      worldY: 0,
      worldZ: (cy - vh / 2) * fr,
      worldWidth: rect.width * fr,
      worldHeight: rect.height * fr,
    });
  });

  return items;
}
