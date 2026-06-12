import * as THREE from 'three';
import { BossShip } from './BossShip';
import { EnemyShip } from './EnemyShip';
import { WordGenerator } from '../lessons/WordGenerator';
import type { Targetable } from './Targetable';

const MAX_MINIONS  = 5;
const SPAWN_DUR    = 0.55; // seconds for the scale-in animation

/** Smooth overshoot: 0→~1.12→1 */
function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export class BossStage {
  readonly boss: BossShip;
  readonly minions: EnemyShip[] = [];

  private lastSpawnAtWord: number;
  private readonly minionEvery: number;   // spawn 1 minion every N boss-words
  private readonly minionBaseSpeed: number;
  private readonly spawnAnim = new Map<EnemyShip, number>(); // minion → elapsed
  private readonly gen: WordGenerator;

  constructor(
    bossIndex: number,
    keys: string[],
    levelKills: number,
    private readonly scene: THREE.Scene,
  ) {
    const hp = levelKills;
    // Boss 1→7 words/minion, Boss 6→3 words/minion
    this.minionEvery     = Math.max(3, 8 - bossIndex);
    // First minion appears after ≈ half an interval
    this.lastSpawnAtWord = -Math.ceil(this.minionEvery / 2);
    this.minionBaseSpeed = 5.0 + bossIndex * 0.5; // 5.5→8.0 across 6 bosses
    this.gen  = new WordGenerator(keys);
    this.boss = new BossShip(bossIndex, keys, scene, hp);
  }

  /** All live targets: boss first, then minions closest → farthest. */
  getTargetables(): Targetable[] {
    const out: Targetable[] = [];
    if (this.boss.alive) out.push(this.boss);
    for (const m of this.minions) if (m.alive) out.push(m);
    return out;
  }

  get bossDefeated(): boolean { return !this.boss.alive; }

  update(dt: number, playerPos: THREE.Vector3, elapsed: number) {
    if (!this.boss.alive) return;

    this.boss.update(dt, elapsed);

    // Spawn minion every N boss-word completions
    if (
      this.boss.wordsTyped - this.lastSpawnAtWord >= this.minionEvery &&
      this.minions.length < MAX_MINIONS
    ) {
      this.spawnMinion();
      this.lastSpawnAtWord = this.boss.wordsTyped;
    }

    // Animate newly spawned minions: scale 0 → 1 with overshoot
    for (const [m, t] of [...this.spawnAnim.entries()]) {
      const newT = t + dt;
      const s = Math.max(0, easeOutBack(Math.min(newT / SPAWN_DUR, 1)));
      m.group.scale.setScalar(s);
      if (newT >= SPAWN_DUR) {
        m.group.scale.setScalar(1);
        this.spawnAnim.delete(m);
      } else {
        this.spawnAnim.set(m, newT);
      }
    }

    for (const m of this.minions) m.update(dt, playerPos, elapsed);
  }

  removeMinion(enemy: EnemyShip) {
    enemy.dispose(this.scene);
    this.spawnAnim.delete(enemy);
    const idx = this.minions.indexOf(enemy);
    if (idx !== -1) this.minions.splice(idx, 1);
  }

  clear() {
    this.boss.dispose(this.scene);
    this.spawnAnim.clear();
    for (const m of [...this.minions]) m.dispose(this.scene);
    this.minions.length = 0;
  }

  private spawnMinion() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const pos  = new THREE.Vector3(
      side * (22 + Math.random() * 8),
      Math.random() * 4,
      this.boss.position.z + 10 + Math.random() * 14,
    );
    const forbidden = new Set([
      this.boss.word[0],
      ...this.minions.map(m => m.word[0]),
    ]);
    const word   = this.gen.getWord(forbidden);
    const speed  = this.minionBaseSpeed + Math.random() * 1.5;
    const minion = new EnemyShip(word, speed, pos);
    minion.addTo(this.scene);
    minion.group.scale.setScalar(0); // will be animated in
    this.spawnAnim.set(minion, 0);
    this.minions.push(minion);
  }
}
