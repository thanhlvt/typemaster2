import * as THREE from 'three';

const LIFE = 0.09;
const UP = new THREE.Vector3(0, 1, 0);

interface ActiveLaser {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  life: number;
}

export class LaserPool {
  private lasers: ActiveLaser[] = [];
  private geometry = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);

  constructor(private scene: THREE.Scene) {}

  fire(from: THREE.Vector3, to: THREE.Vector3) {
    const dir = to.clone().sub(from);
    const length = dir.length();
    const material = new THREE.MeshBasicMaterial({
      color: 0x4dffe0,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.scale.set(1, length, 1);
    mesh.position.copy(from).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    this.scene.add(mesh);
    this.lasers.push({ mesh, material, life: LIFE });
  }

  update(dt: number) {
    for (const l of this.lasers) {
      l.life -= dt;
      l.material.opacity = Math.max(l.life / LIFE, 0);
    }
    const dead = this.lasers.filter((l) => l.life <= 0);
    for (const l of dead) {
      this.scene.remove(l.mesh);
      l.material.dispose();
    }
    this.lasers = this.lasers.filter((l) => l.life > 0);
  }
}
