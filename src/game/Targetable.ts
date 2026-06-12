import type * as THREE from 'three';

/** Duck-type interface shared by EnemyShip and BossShip so InputHandler can
 *  treat them uniformly without creating circular imports. */
export interface Targetable {
  readonly word: string;
  typedCount: number;
  locked: boolean;
  alive: boolean;
  readonly position: THREE.Vector3;
  readonly nextChar: string | null;
  setLocked(): void;
  setUnlocked(): void;
  /** Returns true when the target is fully destroyed (hp = 0 for boss, word done for enemy). */
  advance(): boolean;
}
