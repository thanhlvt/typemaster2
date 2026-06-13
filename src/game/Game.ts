import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { PlayerShip } from './PlayerShip';
import { EnemyShip } from './EnemyShip';
import { EnemySpawner } from './EnemySpawner';
import { BossStage } from './BossStage';
import { LaserPool } from './Laser';
import { ExplosionPool } from './Explosion';
import { InputHandler } from '../typing/InputHandler';
import type { Targetable } from './Targetable';
import { Stats } from '../typing/Stats';
import { LEVELS, type LevelConfig } from '../lessons/lessons';
import { HUD } from '../ui/HUD';
import { KeyboardHint } from '../ui/KeyboardHint';
import { Screens } from '../ui/Screens';
import { Sound } from '../audio/Sound';
import { Progress } from '../storage/Progress';

const START_LIVES  = 3;
const HIT_DISTANCE = 3.5;
/** Boss game-over threshold: when boss z-center passes this, it's too close. */
const BOSS_REACH_Z = -4;
/** Every N regular levels triggers a boss fight. */
const BOSS_EVERY   = 4;

type GameState = 'menu' | 'playing' | 'boss' | 'complete' | 'gameover';

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

  private spawner:  EnemySpawner | null = null;
  private bossStage: BossStage | null = null;
  private level: LevelConfig | null = null;
  private bossAfterLevelId = 0;
  private bossIndex        = 0;
  private lives = START_LIVES;
  private lastTime = 0;
  private elapsed  = 0;
  private missPenaltyTimer = 0;

  constructor(container: HTMLElement) {
    this.sceneMgr   = new SceneManager(container);
    this.player     = new PlayerShip(this.sceneMgr.scene);
    this.lasers     = new LaserPool(this.sceneMgr.scene);
    this.explosions = new ExplosionPool(this.sceneMgr.scene);
    this.hud        = new HUD(container);
    this.keyboard   = new KeyboardHint(container);
    this.screens    = new Screens(container);

    this.input = new InputHandler(
      () => this.state === 'boss'
        ? (this.bossStage?.getTargetables() ?? [])
        : (this.spawner?.enemies ?? []),
      {
        onHit:     (t) => this.onHit(t),
        onComplete:(t) => this.onComplete(t),
        onMiss:    ()  => this.onMiss(),
        onAnyKey:  ()  => this.sound.init(),
      },
    );

    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && (this.state === 'playing' || this.state === 'boss')) {
        this.showMenu();
      }
    });

    this.showMenu();
    requestAnimationFrame(this.loop);
  }

  // ===== State transitions =====

  showMenu() {
    this.state = 'menu';
    this.input.enabled = false;
    this.input.releaseLock();
    this.bossStage?.clear();
    this.bossStage = null;
    this.clearLevel();
    this.hud.hide();
    this.keyboard.hide();
    this.sound.stopMusic();
    this.screens.showMenu({
      onSelectLevel: (id) => this.startLevel(id),
      onSelectBoss:  (idx, afterId) => this.startBoss(idx, afterId),
      onContinue:    (session) => this.resumeSession(session),
      onReset: () => { Progress.reset(); this.showMenu(); },
    });
  }

  startLevel(levelId: number, lives = START_LIVES) {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return;
    this.bossStage?.clear();
    this.bossStage = null;
    this.clearLevel();
    this.level  = level;
    this.spawner = new EnemySpawner(level);
    this.lives   = lives;
    this.stats.start();
    this.state   = 'playing';
    this.input.enabled = true;
    this.screens.hide();
    this.hud.setLevel(`Level ${level.id} — ${level.name}`);
    this.hud.show();
    this.keyboard.setEnabledKeys(level.keys);
    this.keyboard.show();
    this.sound.startMusic();
    Progress.saveSession({ levelId, lives });
  }

  startBoss(bossIndex: number, afterLevelId: number) {
    const level = LEVELS.find(l => l.id === afterLevelId);
    if (!level) return;
    this.bossAfterLevelId = afterLevelId;
    this.bossIndex        = bossIndex;
    this.clearLevel();
    this.bossStage = new BossStage(bossIndex, level.keys, level.kills, this.sceneMgr.scene);
    this.stats.start();
    this.state = 'boss';
    this.input.enabled = true;
    this.input.releaseLock();
    this.screens.hide();
    this.hud.setLevel(`⚔ BOSS ${bossIndex}`);
    this.hud.show();
    this.keyboard.setEnabledKeys(level.keys);
    this.keyboard.show();
    this.sound.startMusic();
  }

  private resumeSession(session: { levelId: number; lives: number }) {
    this.startLevel(session.levelId, session.lives);
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
    const isBossCheckpoint = levelId % BOSS_EVERY === 0 && levelId < LEVELS.length;
    // Boss-checkpoint levels: hold next-level unlock until boss is defeated
    if (!isBossCheckpoint) Progress.unlock(levelId + 1);
    Progress.recordBest(levelId, {
      wpm:      this.stats.wpm,
      accuracy: this.stats.accuracy,
      score:    this.stats.score,
    });
    Progress.clearSession();
    this.clearLevel();
    const hasNext = levelId < LEVELS.length;

    if (isBossCheckpoint) {
      this.screens.showLevelComplete(this.stats, true, {
        onNext:   () => this.startBoss(levelId / BOSS_EVERY, levelId),
        onReplay: () => this.startLevel(levelId),
        onMenu:   () => this.showMenu(),
        bossNext: true,
      });
    } else {
      this.screens.showLevelComplete(this.stats, hasNext, {
        onNext:   () => this.startLevel(levelId + 1),
        onReplay: () => this.startLevel(levelId),
        onMenu:   () => this.showMenu(),
      });
    }
  }

  private handleBossDefeated() {
    if (this.state !== 'boss') return; // guard against double-call
    this.state = 'complete';
    this.input.enabled = false;
    this.input.releaseLock();
    this.sound.stopMusic();
    this.sound.levelUp();
    this.lives = Math.min(this.lives + 1, START_LIVES);
    Progress.unlock(this.bossAfterLevelId + 1); // gate: only now does next level open
    this.bossStage?.clear();
    this.bossStage = null;
    this.screens.showBossDefeated(this.bossIndex, this.lives, {
      onContinue: () => this.startLevel(this.bossAfterLevelId + 1),
      onMenu:     () => this.showMenu(),
    });
  }

  private gameOver() {
    const isBoss      = this.state === 'boss';
    const retryLevelId = isBoss ? this.bossAfterLevelId : (this.level?.id ?? 1);
    const savedBossIdx = this.bossIndex;
    this.state = 'gameover';
    this.input.enabled = false;
    this.sound.stopMusic();
    this.sound.gameOver();
    Progress.clearSession();
    this.bossStage?.clear();
    this.bossStage = null;
    this.clearLevel();
    this.screens.showGameOver(this.stats, {
      onRetry: () => {
        if (isBoss) this.startBoss(savedBossIdx, retryLevelId);
        else        this.startLevel(retryLevelId);
      },
      onMenu: () => this.showMenu(),
    });
  }

  // ===== Typing events =====

  private onHit(t: Targetable) {
    this.stats.onHit();
    this.lasers.fire(this.player.nosePosition, t.position.clone());
    this.sound.laser();
  }

  private onComplete(t: Targetable) {
    if (t instanceof EnemyShip) {
      this.stats.onKill(t.word.length);
      this.explosions.spawn(t.position.clone());
      this.sound.explosion();
      this.sound.ding();
      if (this.state === 'boss') {
        this.bossStage?.removeMinion(t);
      } else {
        this.spawner?.remove(t, this.sceneMgr.scene);
        if (this.level && this.stats.kills >= this.level.kills) {
          this.completeLevel();
        }
      }
    } else {
      // BossShip destroyed — fire a burst of explosions
      const origin = t.position.clone();
      this.explosions.spawn(origin, 0xcc44ff);
      [100, 220, 360, 500, 680].forEach((delay) => {
        setTimeout(() => {
          const off = new THREE.Vector3(
            (Math.random() - 0.5) * 14,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 14,
          );
          this.explosions.spawn(origin.clone().add(off), 0xcc44ff);
          this.sound.explosion();
        }, delay);
      });
    }
  }

  private onMiss() {
    this.stats.onMiss();
    this.sound.error();
    this.missPenaltyTimer = 1.5;
  }

  private enemyReachedPlayer(enemy: EnemyShip) {
    this.explosions.spawn(this.player.position.clone(), 0xff4455);
    this.sound.explosion();
    if (this.input.locked === enemy) this.input.releaseLock();
    this.spawner?.remove(enemy, this.sceneMgr.scene);
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver();
    } else if (this.level) {
      Progress.saveSession({ levelId: this.level.id, lives: this.lives });
    }
  }

  private minionReachedPlayer(minion: EnemyShip) {
    this.explosions.spawn(this.player.position.clone(), 0xff4455);
    this.sound.explosion();
    if (this.input.locked === minion) this.input.releaseLock();
    this.bossStage?.removeMinion(minion);
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

    if (this.missPenaltyTimer > 0) this.missPenaltyTimer -= dt;
    const speedMult = this.missPenaltyTimer > 0 ? 3.0 : 1.0;

    if (this.state === 'playing' && this.spawner && this.level) {
      this.spawner.update(dt, this.sceneMgr.scene);
      this.input.autoLockNearest();

      for (const enemy of [...this.spawner.enemies]) {
        enemy.update(dt, this.player.position, this.elapsed, speedMult);
        if (enemy.position.distanceTo(this.player.position) < HIT_DISTANCE) {
          this.enemyReachedPlayer(enemy);
        }
      }

      this.hud.update(this.stats, this.lives, this.level.kills);
      this.keyboard.update(
        this.input.locked?.nextChar ?? null,
        this.spawner.enemies.map(e => e.word[0]),
      );
    }

    if (this.state === 'boss' && this.bossStage) {
      this.bossStage.update(dt, this.player.position, this.elapsed, speedMult);
      this.input.autoLockNearest();

      // Check minions reaching player
      for (const minion of [...this.bossStage.minions]) {
        if (minion.position.distanceTo(this.player.position) < HIT_DISTANCE) {
          this.minionReachedPlayer(minion);
        }
      }

      // Boss too close → game over
      if (this.bossStage.boss.alive && this.bossStage.boss.position.z > BOSS_REACH_Z) {
        this.lives = 0;
        this.gameOver();
        return;
      }

      // Boss defeated
      if (this.bossStage.bossDefeated) {
        this.handleBossDefeated();
        return;
      }

      const boss = this.bossStage.boss;
      const bossPct = (boss.maxHp - boss.hp) / boss.maxHp;
      this.hud.update(this.stats, this.lives, 0, bossPct);
      this.keyboard.update(this.input.locked?.nextChar ?? null, []);
    }

    this.sceneMgr.render();
  };
}
