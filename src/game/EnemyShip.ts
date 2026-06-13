import * as THREE from 'three';
import type { Targetable } from './Targetable';

const LABEL_W = 1280;
const LABEL_H = 288;

const FONT_LOCKED = 'bold 152px Consolas, monospace';
const FONT_UNLOCKED = 'bold 92px Consolas, monospace';

// Sprite scale khi locked / unlocked
const SCALE_LOCKED = 9.6;
const SCALE_UNLOCKED = 4.4;

export class EnemyShip implements Targetable {
  readonly group: THREE.Group;
  readonly word: string;
  typedCount = 0;
  locked = false;
  alive = true;

  private speed: number;
  private body: THREE.Mesh;
  private ring: THREE.Mesh;
  private bodyMat: THREE.MeshStandardMaterial;
  private label: THREE.Sprite;
  private labelTexture: THREE.CanvasTexture;
  private canvas: HTMLCanvasElement;
  private swayPhase = Math.random() * Math.PI * 2;

  constructor(word: string, speed: number, position: THREE.Vector3) {
    this.word = word;
    this.speed = speed;
    this.group = new THREE.Group();
    this.group.position.copy(position);

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd84a5a,
      metalness: 0.5,
      roughness: 0.35,
      emissive: 0x441018,
    });
    this.body = new THREE.Mesh(new THREE.OctahedronGeometry(4.2, 0), this.bodyMat);
    this.body.scale.set(1, 0.7, 1.4);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.27, 8, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff8866,
        metalness: 0.6,
        roughness: 0.4,
        emissive: 0x331108,
      }),
    );
    this.ring.rotation.x = Math.PI / 2;

    this.canvas = document.createElement('canvas');
    this.canvas.width = LABEL_W;
    this.canvas.height = LABEL_H;
    this.labelTexture = new THREE.CanvasTexture(this.canvas);
    this.label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.labelTexture, depthTest: false }),
    );
    this.drawLabel();

    this.group.add(this.body, this.ring, this.label);
  }

  get position(): THREE.Vector3 {
    return this.group.position;
  }

  get nextChar(): string | null {
    return this.typedCount < this.word.length ? this.word[this.typedCount] : null;
  }

  setLocked() {
    this.locked = true;
    this.bodyMat.emissive.setHex(0xcc3a00);
    this.bodyMat.color.setHex(0xff5566);
    this.drawLabel();
  }

  setUnlocked() {
    this.locked = false;
    this.bodyMat.emissive.setHex(0x441018);
    this.bodyMat.color.setHex(0xd84a5a);
    this.drawLabel();
  }

  advance(): boolean {
    this.typedCount++;
    this.drawLabel();
    return this.typedCount >= this.word.length;
  }

  update(dt: number, target: THREE.Vector3, time: number, speedMult = 1) {
    const dir = target.clone().sub(this.group.position).normalize();
    this.group.position.addScaledVector(dir, this.speed * speedMult * dt);
    this.group.position.x += Math.sin(time * 1.5 + this.swayPhase) * 0.6 * dt;
    this.body.rotation.y += dt * 0.8;
    this.ring.rotation.z += dt * 1.2;
  }

  private drawLabel() {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, LABEL_W, LABEL_H);

    if (this.locked) {
      this.drawLocked(ctx);
    } else {
      this.drawUnlocked(ctx);
    }

    this.labelTexture.needsUpdate = true;
  }

  private drawLocked(ctx: CanvasRenderingContext2D) {
    ctx.filter = 'none';
    ctx.font = FONT_LOCKED;
    ctx.textBaseline = 'middle';

    const total = ctx.measureText(this.word).width;
    const x0 = (LABEL_W - total) / 2;
    const y = LABEL_H / 2;
    const pad = 40;

    // Hộp nền tối với viền glow vàng
    ctx.shadowColor = '#ffd54a';
    ctx.shadowBlur = 44;
    ctx.fillStyle = 'rgba(6, 10, 24, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x0 - pad, y - 100, total + pad * 2, 200, 28);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Viền vàng sáng
    ctx.strokeStyle = 'rgba(255, 213, 74, 0.75)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(x0 - pad, y - 100, total + pad * 2, 200, 28);
    ctx.stroke();

    // Từng ký tự
    let x = x0;
    for (let i = 0; i < this.word.length; i++) {
      const c = this.word[i];
      if (i < this.typedCount) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#38445e';
      } else if (i === this.typedCount) {
        // Ký tự cần gõ tiếp: vàng sáng, có glow
        ctx.shadowColor = '#ffd54a';
        ctx.shadowBlur = 48;
        ctx.fillStyle = '#ffd54a';
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#e8eaf6';
      }
      ctx.fillText(c, x, y);
      ctx.shadowBlur = 0;
      x += ctx.measureText(c).width;
    }

    this.label.scale.set((LABEL_W / LABEL_H) * SCALE_LOCKED, SCALE_LOCKED, 1);
    this.label.position.y = 9.0;
  }

  private drawUnlocked(ctx: CanvasRenderingContext2D) {
    ctx.font = FONT_UNLOCKED;
    ctx.textBaseline = 'middle';

    const total = ctx.measureText(this.word).width;
    const x0 = (LABEL_W - total) / 2;
    const y = LABEL_H / 2;
    const pad = 28;

    // Nền mờ, không border
    ctx.fillStyle = 'rgba(4, 8, 20, 0.42)';
    ctx.beginPath();
    ctx.roundRect(x0 - pad, y - 64, total + pad * 2, 128, 20);
    ctx.fill();

    // Chữ mờ + blur
    ctx.filter = 'blur(4.5px)';
    ctx.fillStyle = 'rgba(160, 170, 200, 0.55)';
    ctx.fillText(this.word, x0, y);
    ctx.filter = 'none';

    this.label.scale.set((LABEL_W / LABEL_H) * SCALE_UNLOCKED, SCALE_UNLOCKED, 1);
    this.label.position.y = 5.2;
  }

  addTo(scene: THREE.Scene) {
    scene.add(this.group);
  }

  dispose(scene: THREE.Scene) {
    this.alive = false;
    scene.remove(this.group);
    this.body.geometry.dispose();
    this.bodyMat.dispose();
    this.ring.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
    this.label.material.dispose();
    this.labelTexture.dispose();
  }
}
