import * as THREE from 'three';

const PARTICLES = 50;
const MAX_LIFE = 0.7;

interface ActiveExplosion {
  points: THREE.Points;
  material: THREE.PointsMaterial;
  velocities: Float32Array;
  life: number;
}

export class ExplosionPool {
  private explosions: ActiveExplosion[] = [];

  constructor(private scene: THREE.Scene) {}

  spawn(at: THREE.Vector3, color = 0xff8844) {
    const positions = new Float32Array(PARTICLES * 3);
    const velocities = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      positions[i * 3] = at.x;
      positions[i * 3 + 1] = at.y;
      positions[i * 3 + 2] = at.z;
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      )
        .normalize()
        .multiplyScalar(4 + Math.random() * 9);
      velocities[i * 3] = dir.x;
      velocities[i * 3 + 1] = dir.y;
      velocities[i * 3 + 2] = dir.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color,
      size: 0.35,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, material);
    this.scene.add(points);
    this.explosions.push({ points, material, velocities, life: MAX_LIFE });
  }

  update(dt: number) {
    for (const ex of this.explosions) {
      ex.life -= dt;
      const pos = ex.points.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < PARTICLES; i++) {
        pos[i * 3] += ex.velocities[i * 3] * dt;
        pos[i * 3 + 1] += ex.velocities[i * 3 + 1] * dt;
        pos[i * 3 + 2] += ex.velocities[i * 3 + 2] * dt;
        ex.velocities[i * 3] *= 0.97;
        ex.velocities[i * 3 + 1] *= 0.97;
        ex.velocities[i * 3 + 2] *= 0.97;
      }
      ex.points.geometry.attributes.position.needsUpdate = true;
      ex.material.opacity = Math.max(ex.life / MAX_LIFE, 0);
    }
    const dead = this.explosions.filter((e) => e.life <= 0);
    for (const ex of dead) {
      this.scene.remove(ex.points);
      ex.points.geometry.dispose();
      ex.material.dispose();
    }
    this.explosions = this.explosions.filter((e) => e.life > 0);
  }
}
