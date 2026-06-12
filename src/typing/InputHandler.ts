import type { Targetable } from '../game/Targetable';

export interface InputEvents {
  onHit: (target: Targetable) => void;
  onComplete: (target: Targetable) => void;
  onMiss: () => void;
  onAnyKey?: () => void;
}

export class InputHandler {
  enabled = false;
  locked: Targetable | null = null;

  constructor(
    private getTargets: () => Targetable[],
    private events: InputEvents,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  /**
   * Called every frame. Always picks the nearest alive target so minions that
   * fly in front of the boss during a boss fight automatically become the focus.
   */
  autoLockNearest() {
    const alive = this.getTargets().filter(t => t.alive);
    if (alive.length === 0) {
      if (this.locked) { this.locked.setUnlocked(); this.locked = null; }
      return;
    }
    const nearest = alive.reduce((a, b) => a.position.z > b.position.z ? a : b);
    if (nearest === this.locked) return;
    this.locked?.setUnlocked();
    nearest.setLocked();
    this.locked = nearest;
  }

  private onKeyDown = (ev: KeyboardEvent) => {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const c = ev.key.toLowerCase();
    if (c.length !== 1 || c < 'a' || c > 'z') return;
    this.events.onAnyKey?.();
    if (!this.enabled) return;
    ev.preventDefault();

    if (!this.locked || !this.locked.alive) {
      this.events.onMiss();
      return;
    }
    this.handleKeyOnTarget(this.locked, c);
  };

  private handleKeyOnTarget(target: Targetable, c: string) {
    if (target.nextChar === c) {
      const complete = target.advance();
      this.events.onHit(target);
      if (complete) {
        this.locked = null;
        this.events.onComplete(target);
      }
    } else {
      this.events.onMiss();
    }
  }

  releaseLock() {
    this.locked?.setUnlocked();
    this.locked = null;
  }
}
