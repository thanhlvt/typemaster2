import * as THREE from 'three';
import { WORDS } from '../lessons/wordlist';
import type { Targetable } from './Targetable';

const CANVAS_W = 1200;
const CANVAS_H = 640;

// Boss travels 86 world-units (z = -90 → BOSS_REACH_Z = -4 in Game.ts).
// Speed is computed so that a 35 WPM typist has ~2× the expected fight time
// before the boss arrives — enough room for minion interruptions.
const TRAVEL_DIST = 86;
const CPS_35WPM = 35 * 5 / 60; // 2.917 chars/sec at 35 WPM
const FIGHT_OVERHEAD = 2.0;         // boss arrives after 2× expected pure-typing time

export class BossShip implements Targetable {
  readonly group: THREE.Group;
  word: string;
  typedCount = 0;
  wordsTyped = 0;   // incremented each time a full word is completed (hp tick)
  locked = true;
  alive = true;
  hp: number;
  readonly maxHp: number;

  private speed: number;
  private body!: THREE.Mesh;
  private rings: THREE.Mesh[] = [];
  private bodyMat!: THREE.MeshStandardMaterial;
  private label!: THREE.Sprite;
  private labelTexture!: THREE.CanvasTexture;
  private canvas!: HTMLCanvasElement;
  private wordPool: string[];
  private prevWordFirst = '';

  constructor(bossIndex: number, keys: string[], scene: THREE.Scene, hp: number) {
    this.hp = hp;
    this.maxHp = hp;

    // Average word length increases with boss index (limited keys early → full alphabet late)
    const avgWordLen = bossIndex <= 2 ? 3.5 : bossIndex <= 4 ? 4.5 : 5.5;
    this.speed = (TRAVEL_DIST * CPS_35WPM) / (hp * avgWordLen * FIGHT_OVERHEAD);
    // Clamp: never faster than 1.5 u/s (too threatening), never slower than 0.25 u/s (must feel like it moves)
    this.speed = Math.max(0.25, Math.min(1.5, this.speed));

    const keySet = new Set(keys);
    const minLen = bossIndex <= 2 ? 3 : bossIndex <= 4 ? 4 : 5;
    this.wordPool = [...new Set(WORDS)].filter(
      w => w.length >= minLen && [...w].every(c => keySet.has(c)),
    );
    if (this.wordPool.length < 6) this.wordPool = this.makeDrillWords(keys, minLen);
    this.word = this.pickWord();

    this.group = new THREE.Group();
    this.group.position.set(0, 2, -90);

    this.buildBody();
    this.buildLabel();
    scene.add(this.group);
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  private buildBody() {
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8822dd,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x441188,
      emissiveIntensity: 1.2,
    });
    this.body = new THREE.Mesh(new THREE.IcosahedronGeometry(7.5, 1), this.bodyMat);
    this.body.scale.set(1, 0.75, 1.4);
    this.group.add(this.body);

    const ringDefs = [
      { r: 12.0, tube: 0.40, color: 0xffd54a },
      { r: 9.5, tube: 0.28, color: 0xcc44ff },
      { r: 7.2, tube: 0.22, color: 0xff8833 },
    ];
    const rotInit: [number, number, number][] = [
      [Math.PI / 2, 0, 0],
      [Math.PI / 4, 0, Math.PI / 5],
      [-Math.PI / 4, 0, Math.PI / 3],
    ];
    for (let i = 0; i < 3; i++) {
      const d = ringDefs[i];
      const mat = new THREE.MeshStandardMaterial({
        color: d.color, emissive: d.color, emissiveIntensity: 0.7,
        metalness: 0.8, roughness: 0.1,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.tube, 8, 40), mat);
      ring.rotation.set(...rotInit[i]);
      this.rings.push(ring);
      this.group.add(ring);
    }

    const light1 = new THREE.PointLight(0x8822dd, 150, 50);
    const light2 = new THREE.PointLight(0xffd54a, 80, 35);
    light2.position.set(0, 8, -5);
    this.group.add(light1, light2);
  }

  private buildLabel() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.labelTexture = new THREE.CanvasTexture(this.canvas);
    this.label = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.labelTexture, depthTest: false }),
    );
    // 2× the previous scale (was 11)
    this.label.scale.set((CANVAS_W / CANVAS_H) * 22, 22, 1);
    this.label.position.y = 22;
    this.drawLabel();
    this.group.add(this.label);
  }

  private drawLabel() {
    const ctx = this.canvas.getContext('2d')!;
    const W = CANVAS_W, H = CANVAS_H;
    ctx.clearRect(0, 0, W, H);

    // HP bar
    const bx = 80, by = 18, bw = W - 160, bh = 70;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();

    const pct = this.hp / this.maxHp;
    const fillW = (bw - 4) * pct;
    const hpColor = pct > 0.6 ? '#5dff9d' : pct > 0.3 ? '#ffd54a' : '#ff5d6e';
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, fillW, bh - 4, 10);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px Consolas, monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`HP  ${this.hp} / ${this.maxHp}`, W / 2, by + bh / 2);

    // Word area
    ctx.font = 'bold 252px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const total = ctx.measureText(this.word).width;
    let wx = (W - total) / 2;
    const wy = H * 0.74;
    const pad = 50;

    ctx.shadowColor = this.locked ? '#aa22ff' : 'transparent';
    ctx.shadowBlur = this.locked ? 100 : 0;
    ctx.fillStyle = this.locked ? 'rgba(6, 10, 24, 0.98)' : 'rgba(6, 10, 24, 0.50)';
    ctx.beginPath();
    ctx.roundRect(wx - pad, wy - 158, total + pad * 2, 316, 28);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = this.locked
      ? 'rgba(170, 34, 255, 0.75)'
      : 'rgba(100, 30, 160, 0.30)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(wx - pad, wy - 158, total + pad * 2, 316, 28);
    ctx.stroke();

    if (!this.locked) {
      // Minion is targeted — blur and dim the word so player focuses on minion
      ctx.filter = 'blur(20px)';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(140, 150, 200, 0.40)';
      ctx.fillText(this.word, wx, wy);
      ctx.filter = 'none';
    } else {
      for (let i = 0; i < this.word.length; i++) {
        const c = this.word[i];
        if (i < this.typedCount) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#38445e';
        } else if (i === this.typedCount) {
          ctx.shadowColor = '#ffd54a';
          ctx.shadowBlur = 100;
          ctx.fillStyle = '#ffd54a';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#e8eaf6';
        }
        ctx.fillText(c, wx, wy);
        ctx.shadowBlur = 0;
        wx += ctx.measureText(c).width;
      }
    }

    this.labelTexture.needsUpdate = true;
  }

  // ─── Targetable interface ─────────────────────────────────────────────────

  get position(): THREE.Vector3 { return this.group.position; }

  get nextChar(): string | null {
    return this.typedCount < this.word.length ? this.word[this.typedCount] : null;
  }

  setLocked(): void {
    if (this.locked) return;
    this.locked = true;
    this.drawLabel();
  }

  setUnlocked(): void {
    if (!this.locked) return;
    this.locked = false;
    this.drawLabel();
  }

  /** Returns true when all HP is depleted (boss destroyed). */
  advance(): boolean {
    this.typedCount++;
    if (this.typedCount >= this.word.length) {
      this.hp--;
      this.wordsTyped++;
      if (this.hp <= 0) {
        this.alive = false;
        this.drawLabel();
        return true;
      }
      this.prevWordFirst = this.word[0];
      this.word = this.pickWord();
      this.typedCount = 0;
    }
    this.drawLabel();
    return false;
  }

  // ─── Per-frame update ─────────────────────────────────────────────────────

  update(dt: number, time: number) {
    this.group.position.z += this.speed * dt;
    this.group.position.x = Math.sin(time * 0.6) * 16;
    this.group.position.y = 2 + Math.sin(time * 0.4) * 2.5;

    this.body.rotation.y += dt * 0.3;
    this.rings[0].rotation.y += dt * 0.55;
    this.rings[1].rotation.z += dt * 0.45;
    this.rings[2].rotation.x += dt * -0.4;

    const pulse = 1 + Math.sin(time * 3) * 0.03;
    this.body.scale.set(pulse, 0.75 * pulse, 1.4 * pulse);
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  dispose(scene: THREE.Scene) {
    this.alive = false;
    scene.remove(this.group);
    this.body.geometry.dispose();
    this.bodyMat.dispose();
    for (const r of this.rings) {
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    }
    this.label.material.dispose();
    this.labelTexture.dispose();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private pickWord(): string {
    const pool = this.wordPool.filter(w => w[0] !== this.prevWordFirst);
    const src = pool.length >= 3 ? pool : this.wordPool;
    return src[Math.floor(Math.random() * src.length)];
  }

  private makeDrillWords(keys: string[], minLen: number): string[] {
    const arr: string[] = [];
    for (let i = 0; i < 30; i++) {
      const len = minLen + (i % 3);
      arr.push(
        Array.from({ length: len }, () => keys[Math.floor(Math.random() * keys.length)]).join(''),
      );
    }
    return arr;
  }
}
