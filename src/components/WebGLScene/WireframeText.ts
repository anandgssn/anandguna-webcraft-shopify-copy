import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export async function createWireframeText(scene: THREE.Scene): Promise<THREE.Group> {
  const group = new THREE.Group();
  const loader = new FontLoader();

  try {
    const font = await loader.loadAsync("/fonts/AntiqueLegacy-Medium.typeface.json");

    const lines: [string, number][] = [["Make the", 3], ["new normal", -3]];

    for (const [text, yOffset] of lines) {
      const textGeo = new TextGeometry(text, {
        font,
        size: 5,
        depth: 2,
        curveSegments: 3,
        bevelEnabled: false,
      });
      textGeo.computeBoundingBox();
      textGeo.center();

      const edges = new THREE.EdgesGeometry(textGeo, 15);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.35,
        })
      );
      line.position.y = yOffset;
      group.add(line);
      textGeo.dispose();
    }
  } catch {
    // Fallback: simple box placeholders if font not available
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });

    // "Make the" placeholder
    const box1 = new THREE.BoxGeometry(20, 4, 2);
    const edges1 = new THREE.EdgesGeometry(box1);
    const line1 = new THREE.LineSegments(edges1, mat);
    line1.position.y = 3;
    group.add(line1);
    box1.dispose();

    // "new normal" placeholder
    const box2 = new THREE.BoxGeometry(24, 4, 2);
    const edges2 = new THREE.EdgesGeometry(box2);
    const line2 = new THREE.LineSegments(edges2, mat.clone());
    line2.position.y = -3;
    group.add(line2);
    box2.dispose();
  }

  // Tagline as flat text-like element
  const taglineGeo = new THREE.PlaneGeometry(18, 0.8);
  const taglineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const tagline = new THREE.Mesh(taglineGeo, taglineMat);
  tagline.position.y = -7;
  tagline.position.z = 0.5;
  group.add(tagline);

  scene.add(group);
  return group;
}
