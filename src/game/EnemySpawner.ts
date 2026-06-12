import * as THREE from 'three';
import { EnemyShip } from './EnemyShip';
import { WordGenerator } from '../lessons/WordGenerator';
import type { LevelConfig } from '../lessons/lessons';

export class EnemySpawner {
  enemies: EnemyShip[] = [];
  spawned = 0;

  private timer = 0.8; // chờ ngắn trước tàu đầu tiên
  private config: LevelConfig;
  private gen: WordGenerator;

  constructor(config: LevelConfig) {
    this.config = config;
    this.gen = new WordGenerator(config.keys);
  }

  update(dt: number, scene: THREE.Scene) {
    this.timer -= dt;
    if (this.timer <= 0 && this.enemies.length < this.config.maxAlive) {
      this.spawn(scene);
      this.timer = this.config.spawnInterval * (0.8 + Math.random() * 0.4);
    }
  }

  private spawn(scene: THREE.Scene) {
    const forbidden = new Set(this.enemies.map((e) => e.word[0]));
    const word = this.gen.getWord(forbidden);
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 32,
      Math.random() * 5,
      -85 - Math.random() * 12,
    );
    const speed = this.config.speed * (0.85 + Math.random() * 0.3);
    const enemy = new EnemyShip(word, speed, pos);
    enemy.addTo(scene);
    this.enemies.push(enemy);
    this.spawned++;
  }

  remove(enemy: EnemyShip, scene: THREE.Scene) {
    enemy.dispose(scene);
    this.enemies = this.enemies.filter((e) => e !== enemy);
  }

  clear(scene: THREE.Scene) {
    for (const e of this.enemies) e.dispose(scene);
    this.enemies = [];
  }
}
