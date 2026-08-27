import * as THREE from "three";

export function createSceneObjects(scene: THREE.Scene): {
  particles: THREE.Points;
  cubes: THREE.Group;
} {
  const cubes = new THREE.Group();
  scene.add(cubes);

  const particleCount = 80;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 1500;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 600 - 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      fog: true,
    })
  );
  scene.add(particles);

  return { particles, cubes };
}

export function updateParticles(particles: THREE.Points, time: number) {
  const positions = particles.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    positions.setY(i, y + Math.sin(time * 0.5 + i * 0.1) * 0.03);
  }
  positions.needsUpdate = true;
}
