import { LEVELS } from '../lessons/lessons';
import { Progress } from '../storage/Progress';
import { Stats } from '../typing/Stats';

export interface MenuCallbacks {
  onSelectLevel: (levelId: number) => void;
}

export class Screens {
  private current: HTMLElement | null = null;

  constructor(private container: HTMLElement) {}

  hide() {
    this.current?.remove();
    this.current = null;
  }

  private show(el: HTMLElement) {
    this.hide();
    this.current = el;
    this.container.appendChild(el);
  }

  showMenu(cb: MenuCallbacks) {
    const data = Progress.load();
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.innerHTML = `
      <h1>TYPEMASTER 2</h1>
      <p class="subtitle">Luyện gõ 10 ngón — bắn hạ tàu địch bằng bàn phím của bạn</p>
      <div id="level-grid"></div>
      <p class="hint">Gõ chữ cái đầu của từ để khóa mục tiêu · gõ hết từ để tiêu diệt · đừng để tàu địch chạm vào bạn</p>`;

    const grid = screen.querySelector('#level-grid')!;
    for (const level of LEVELS) {
      const unlocked = level.id <= data.unlocked;
      const best = data.best[level.id];
      const btn = document.createElement('button');
      btn.className = 'level-card';
      btn.disabled = !unlocked;
      btn.innerHTML = `
        <div class="lv-num">${unlocked ? level.id : '🔒'}</div>
        <div class="lv-keys">${
          level.newKeys.length ? level.newKeys.join(' ') : '⚡ speed'
        }</div>
        <div class="lv-best">${best ? `${best.wpm} wpm · ${best.accuracy}%` : '—'}</div>`;
      btn.title = level.name;
      if (unlocked) {
        btn.addEventListener('click', () => cb.onSelectLevel(level.id));
      }
      grid.appendChild(btn);
    }
    this.show(screen);
  }

  showLevelComplete(
    stats: Stats,
    hasNext: boolean,
    cb: { onNext: () => void; onReplay: () => void; onMenu: () => void },
  ) {
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.innerHTML = `
      <h2 style="color: var(--good)">HOÀN THÀNH!</h2>
      ${this.statsRow(stats)}
      <div class="btn-row">
        ${hasNext ? '<button data-act="next">Level tiếp theo ▶</button>' : ''}
        <button data-act="replay" class="${hasNext ? 'secondary' : ''}">Chơi lại</button>
        <button data-act="menu" class="secondary">Menu</button>
      </div>`;
    this.bindButtons(screen, {
      next: cb.onNext,
      replay: cb.onReplay,
      menu: cb.onMenu,
    });
    this.show(screen);
  }

  showGameOver(
    stats: Stats,
    cb: { onRetry: () => void; onMenu: () => void },
  ) {
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.innerHTML = `
      <h2 style="color: var(--bad)">GAME OVER</h2>
      ${this.statsRow(stats)}
      <div class="btn-row">
        <button data-act="retry">Thử lại</button>
        <button data-act="menu" class="secondary">Menu</button>
      </div>`;
    this.bindButtons(screen, { retry: cb.onRetry, menu: cb.onMenu });
    this.show(screen);
  }

  private statsRow(stats: Stats): string {
    return `
      <div class="stats-row">
        <div class="stat"><div class="label">Điểm</div><div class="value">${stats.score}</div></div>
        <div class="stat"><div class="label">WPM</div><div class="value">${stats.wpm}</div></div>
        <div class="stat"><div class="label">Chính xác</div><div class="value">${stats.accuracy}%</div></div>
        <div class="stat"><div class="label">Combo tốt nhất</div><div class="value">${stats.bestCombo}</div></div>
      </div>`;
  }

  private bindButtons(
    screen: HTMLElement,
    actions: Record<string, () => void>,
  ) {
    for (const btn of screen.querySelectorAll<HTMLButtonElement>('button[data-act]')) {
      const act = btn.dataset.act!;
      btn.addEventListener('click', () => actions[act]?.());
    }
  }
}
