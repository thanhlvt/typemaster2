import { SceneManager } from './SceneManager';
import { PlayerShip } from './PlayerShip';
import { EnemyShip } from './EnemyShip';
import { EnemySpawner } from './EnemySpawner';
import { LaserPool } from './Laser';
import { ExplosionPool } from './Explosion';
import { InputHandler } from '../typing/InputHandler';
import { Stats } from '../typing/Stats';
import { LEVELS, type LevelConfig } from '../lessons/lessons';
import { HUD } from '../ui/HUD';
import { KeyboardHint } from '../ui/KeyboardHint';
import { Screens } from '../ui/Screens';
import { Sound } from '../audio/Sound';
import { Progress } from '../storage/Progress';

const START_LIVES = 3;
const HIT_DISTANCE = 3.5;

type GameState = 'menu' | 'playing' | 'complete' | 'gameover';

export class Game {
  private state: GameState = 'menu';
  private sceneMgr: SceneManager;
  private player: PlayerShip;
  private lasers: LaserPool;
  private explosions: ExplosionPool;
  private input: InputHandler;
  private stats = new Stats();
  private hud: HUD;
  private keyboard: KeyboardHint;
  private screens: Screens;
  private sound = new Sound();

  private spawner: EnemySpawner | null = null;
  private level: LevelConfig | null = null;
  private lives = START_LIVES;
  private lastTime = 0;
  private elapsed = 0;

  constructor(container: HTMLElement) {
    this.sceneMgr = new SceneManager(container);
    this.player = new PlayerShip(this.sceneMgr.scene);
    this.lasers = new LaserPool(this.sceneMgr.scene);
    this.explosions = new ExplosionPool(this.sceneMgr.scene);
    this.hud = new HUD(container);
    this.keyboard = new KeyboardHint(container);
    this.screens = new Screens(container);

    this.input = new InputHandler(() => this.spawner?.enemies ?? [], {
      onHit: (e) => this.onHit(e),
      onComplete: (e) => this.onComplete(e),
      onMiss: () => this.onMiss(),
      onAnyKey: () => this.sound.init(),
    });

    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && this.state === 'playing') this.showMenu();
    });

    this.showMenu();
    requestAnimationFrame(this.loop);
  }

  // ===== State transitions =====

  showMenu() {
    this.state = 'menu';
    this.input.enabled = false;
    this.input.releaseLock();
    this.clearLevel();
    this.hud.hide();
    this.keyboard.hide();
    this.sound.stopMusic();
    this.screens.showMenu({ onSelectLevel: (id) => this.startLevel(id) });
  }

  startLevel(levelId: number) {
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return;
    this.clearLevel();
    this.level = level;
    this.spawner = new EnemySpawner(level);
    this.lives = START_LIVES;
    this.stats.start();
    this.state = 'playing';
    this.input.enabled = true;
    this.screens.hide();
    this.hud.setLevel(`Level ${level.id} — ${level.name}`);
    this.hud.show();
    this.keyboard.setEnabledKeys(level.keys);
    this.keyboard.show();
    this.sound.startMusic();
  }

  private clearLevel() {
    this.spawner?.clear(this.sceneMgr.scene);
    this.spawner = null;
    this.input.releaseLock();
  }

  private completeLevel() {
    if (!this.level) return;
    this.state = 'complete';
    this.input.enabled = false;
    this.sound.levelUp();
    const levelId = this.level.id;
    Progress.unlock(levelId + 1);
    Progress.recordBest(levelId, {
      wpm: this.stats.wpm,
      accuracy: this.stats.accuracy,
      score: this.stats.score,
    });
    this.clearLevel();
    const hasNext = levelId < LEVELS.length;
    this.screens.showLevelComplete(this.stats, hasNext, {
      onNext: () => this.startLevel(levelId + 1),
      onReplay: () => this.startLevel(levelId),
      onMenu: () => this.showMenu(),
    });
  }

  private gameOver() {
    const levelId = this.level?.id ?? 1;
    this.state = 'gameover';
    this.input.enabled = false;
    this.sound.stopMusic();
    this.sound.gameOver();
    this.clearLevel();
    this.screens.showGameOver(this.stats, {
      onRetry: () => this.startLevel(levelId),
      onMenu: () => this.showMenu(),
    });
  }

  // ===== Typing events =====

  private onHit(enemy: EnemyShip) {
    this.stats.onHit();
    this.lasers.fire(this.player.nosePosition, enemy.position.clone());
    this.sound.laser();
  }

  private onComplete(enemy: EnemyShip) {
    this.stats.onKill(enemy.word.length);
    this.explosions.spawn(enemy.position.clone());
    this.sound.explosion();
    this.sound.ding();
    this.spawner?.remove(enemy, this.sceneMgr.scene);
    if (this.level && this.stats.kills >= this.level.kills) {
      this.completeLevel();
    }
  }

  private onMiss() {
    this.stats.onMiss();
    this.sound.error();
  }

  private enemyReachedPlayer(enemy: EnemyShip) {
    this.explosions.spawn(this.player.position.clone(), 0xff4455);
    this.sound.explosion();
    if (this.input.locked === enemy) this.input.releaseLock();
    this.spawner?.remove(enemy, this.sceneMgr.scene);
    this.lives--;
    if (this.lives <= 0) this.gameOver();
  }

  // ===== Main loop =====

  private loop = (time: number) => {
    requestAnimationFrame(this.loop);
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.elapsed += dt;

    this.sceneMgr.update(dt);
    this.player.update(dt, this.elapsed);
    this.lasers.update(dt);
    this.explosions.update(dt);

    if (this.state === 'playing' && this.spawner && this.level) {
      this.spawner.update(dt, this.sceneMgr.scene);
      this.input.autoLockNearest();

      for (const enemy of [...this.spawner.enemies]) {
        enemy.update(dt, this.player.position, this.elapsed);
        if (enemy.position.distanceTo(this.player.position) < HIT_DISTANCE) {
          this.enemyReachedPlayer(enemy);
        }
      }

      this.hud.update(this.stats, this.lives, this.level.kills);
      this.keyboard.update(
        this.input.locked?.nextChar ?? null,
        this.spawner.enemies.map((e) => e.word[0]),
      );
    }

    this.sceneMgr.render();
  };
}
