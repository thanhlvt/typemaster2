import { LEVELS } from '../lessons/lessons';
import { Progress, type GameSession } from '../storage/Progress';
import { Stats } from '../typing/Stats';

export interface MenuCallbacks {
  onSelectLevel: (levelId: number) => void;
  onSelectBoss?: (bossIndex: number, afterLevelId: number) => void;
  onContinue?: (session: GameSession) => void;
  onReset?: () => void;
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
    const data    = Progress.load();
    const session = Progress.loadSession();
    const screen  = document.createElement('div');
    screen.className = 'screen';

    const continueHtml = session && cb.onContinue
      ? `<button id="btn-continue" class="continue-btn">
           ▶ Tiếp tục Level ${session.levelId}
           <span class="continue-lives">${'♥'.repeat(session.lives)}</span>
         </button>`
      : '';

    screen.innerHTML = `
      <h1>TYPEMASTER 2</h1>
      <p class="subtitle">Luyện gõ 10 ngón — bắn hạ tàu địch bằng bàn phím của bạn</p>
      ${continueHtml}
      <div id="level-grid"></div>
      <p class="hint">Gõ chữ cái đầu của từ để khóa mục tiêu · gõ hết từ để tiêu diệt · đừng để tàu địch chạm vào bạn</p>
      <button id="btn-reset" class="reset-btn" title="Xoá tiến trình">🗑</button>`;

    if (session && cb.onContinue) {
      screen.querySelector('#btn-continue')!
        .addEventListener('click', () => cb.onContinue!(session));
    }

    screen.querySelector('#btn-reset')!.addEventListener('click', () => {
      if (confirm('Xoá toàn bộ tiến trình và bắt đầu lại từ đầu?')) {
        cb.onReset?.();
      }
    });

    const grid = screen.querySelector('#level-grid')!;
    for (const level of LEVELS) {
      const unlocked = level.id <= data.unlocked;
      const best     = data.best[level.id];
      const btn      = document.createElement('button');
      btn.className  = 'level-card';
      btn.disabled   = !unlocked;
      btn.innerHTML  = `
        <div class="lv-num">${unlocked ? level.id : '🔒'}</div>
        <div class="lv-keys">${
          level.newKeys.length ? level.newKeys.join(' ') : '⚡ speed'
        }</div>
        <div class="lv-best">${best ? `${best.wpm} wpm · ${best.accuracy}%` : '—'}</div>`;
      btn.title = level.name;
      if (unlocked) btn.addEventListener('click', () => cb.onSelectLevel(level.id));
      grid.appendChild(btn);

      // Boss card after every 4th level
      if (level.id % 4 === 0 && level.id < LEVELS.length) {
        const bossIndex   = level.id / 4;
        const bossUnlocked = data.unlocked >= level.id;
        const bossBtn = document.createElement('button');
        bossBtn.className = 'level-card boss-card';
        bossBtn.disabled  = !bossUnlocked;
        bossBtn.innerHTML = `
          <div class="lv-num boss-num">${bossUnlocked ? `⚔ B${bossIndex}` : '🔒'}</div>
          <div class="lv-keys">BOSS</div>
          <div class="lv-best">—</div>`;
        bossBtn.title = `Boss ${bossIndex} — sau Level ${level.id}`;
        if (bossUnlocked && cb.onSelectBoss) {
          bossBtn.addEventListener('click', () => cb.onSelectBoss!(bossIndex, level.id));
        }
        grid.appendChild(bossBtn);
      }
    }
    this.show(screen);
  }

  showLevelComplete(
    stats: Stats,
    hasNext: boolean,
    cb: { onNext: () => void; onReplay: () => void; onMenu: () => void; bossNext?: boolean },
  ) {
    const screen = document.createElement('div');
    screen.className = 'screen';
    const nextLabel = cb.bossNext ? '⚔ Đối mặt Boss' : 'Level tiếp theo ▶';
    screen.innerHTML = `
      <h2 style="color: var(--good)">HOÀN THÀNH!</h2>
      ${this.statsRow(stats)}
      <div class="btn-row">
        ${hasNext ? `<button data-act="next" class="${cb.bossNext ? 'boss-next-btn' : ''}">${nextLabel}</button>` : ''}
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

  showBossDefeated(
    bossIndex: number,
    livesAfter: number,
    cb: { onContinue: () => void; onMenu: () => void },
  ) {
    const screen = document.createElement('div');
    screen.className = 'screen boss-defeated-screen';
    screen.innerHTML = `
      <div class="boss-defeated-title">⚔ BOSS ${bossIndex} TIÊU DIỆT!</div>
      <div class="boss-reward">+1 ♥ HỒI PHỤC</div>
      <div class="boss-lives">${'♥'.repeat(livesAfter)}</div>
      <div class="btn-row">
        <button data-act="continue">Tiếp tục ▶</button>
        <button data-act="menu" class="secondary">Menu</button>
      </div>`;
    this.bindButtons(screen, { continue: cb.onContinue, menu: cb.onMenu });
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
