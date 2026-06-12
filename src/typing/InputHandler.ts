import { EnemyShip } from '../game/EnemyShip';

export interface InputEvents {
  /** Gõ đúng một ký tự của mục tiêu đang khóa */
  onHit: (enemy: EnemyShip) => void;
  /** Gõ hết từ — tàu bị tiêu diệt */
  onComplete: (enemy: EnemyShip) => void;
  /** Gõ sai */
  onMiss: () => void;
  /** Bất kỳ phím a-z đầu tiên — dùng để khởi tạo AudioContext */
  onAnyKey?: () => void;
}

export class InputHandler {
  enabled = false;
  locked: EnemyShip | null = null;

  constructor(
    private getEnemies: () => EnemyShip[],
    private events: InputEvents,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
  }

  /**
   * Gọi mỗi frame: tự động khóa vào tàu địch gần nhất.
   * Nếu đang có target hợp lệ thì không đổi.
   */
  autoLockNearest() {
    if (this.locked?.alive) return;
    const enemies = this.getEnemies().filter((e) => e.alive);
    if (enemies.length === 0) {
      this.locked = null;
      return;
    }
    // tàu có z lớn nhất = gần player nhất
    const nearest = enemies.reduce((a, b) =>
      a.position.z > b.position.z ? a : b,
    );
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

  private handleKeyOnTarget(target: EnemyShip, c: string) {
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
