import { Stats } from '../typing/Stats';

export class HUD {
  private root: HTMLElement;
  private elScore: HTMLElement;
  private elWpm: HTMLElement;
  private elAcc: HTMLElement;
  private elCombo: HTMLElement;
  private elLives: HTMLElement;
  private elLevel: HTMLElement;
  private elProgress: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div class="hud-group">
        <div class="stat" id="hud-score"><div class="label">Điểm</div><div class="value">0</div></div>
        <div class="stat" id="hud-combo"><div class="label">Combo</div><div class="value">0</div></div>
      </div>
      <div id="hud-level">
        <div class="label"></div>
        <div class="value"></div>
        <div id="hud-progress-bar"><div id="hud-progress-fill"></div></div>
      </div>
      <div class="hud-group">
        <div class="stat" id="hud-wpm"><div class="label">WPM</div><div class="value">0</div></div>
        <div class="stat" id="hud-acc"><div class="label">Chính xác</div><div class="value">100%</div></div>
        <div class="stat" id="hud-lives"><div class="label">Mạng</div><div class="value">♥♥♥</div></div>
      </div>`;
    container.appendChild(this.root);

    this.elScore = this.root.querySelector('#hud-score .value')!;
    this.elWpm = this.root.querySelector('#hud-wpm .value')!;
    this.elAcc = this.root.querySelector('#hud-acc .value')!;
    this.elCombo = this.root.querySelector('#hud-combo .value')!;
    this.elLives = this.root.querySelector('#hud-lives .value')!;
    this.elLevel = this.root.querySelector('#hud-level .value')!;
    this.elProgress = this.root.querySelector('#hud-progress-fill')!;
  }

  setLevel(name: string) {
    this.elLevel.textContent = name;
  }

  update(stats: Stats, lives: number, killsNeeded: number) {
    this.elScore.textContent = String(stats.score);
    this.elWpm.textContent = String(stats.wpm);
    this.elAcc.textContent = `${stats.accuracy}%`;
    this.elCombo.textContent = String(stats.combo);
    this.elLives.textContent = '♥'.repeat(Math.max(lives, 0));
    this.elProgress.style.width = `${Math.min(
      (stats.kills / killsNeeded) * 100,
      100,
    )}%`;
  }

  show() {
    this.root.style.display = 'flex';
  }

  hide() {
    this.root.style.display = 'none';
  }
}
