const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const HOME_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l']);

/** Phân ngón theo giáo trình 10 ngón chuẩn */
const FINGER: Record<string, string> = {
  q: 'lpinky', a: 'lpinky', z: 'lpinky',
  w: 'lring', s: 'lring', x: 'lring',
  e: 'lmiddle', d: 'lmiddle', c: 'lmiddle',
  r: 'lindex', f: 'lindex', v: 'lindex',
  t: 'lindex', g: 'lindex', b: 'lindex',
  y: 'rindex', h: 'rindex', n: 'rindex',
  u: 'rindex', j: 'rindex', m: 'rindex',
  i: 'rmiddle', k: 'rmiddle',
  o: 'rring', l: 'rring',
  p: 'rpinky',
};

export class KeyboardHint {
  private root: HTMLElement;
  private keyEls = new Map<string, HTMLElement>();

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.id = 'keyboard';
    for (const [i, row] of ROWS.entries()) {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      rowEl.style.marginLeft = `${i * 14}px`;
      for (const c of row) {
        const key = document.createElement('div');
        key.className = `key f-${FINGER[c]}`;
        if (HOME_KEYS.has(c) && (c === 'f' || c === 'j')) {
          key.classList.add('home-marker');
        }
        key.textContent = c;
        this.keyEls.set(c, key);
        rowEl.appendChild(key);
      }
      this.root.appendChild(rowEl);
    }
    container.appendChild(this.root);
  }

  /** Làm mờ các phím chưa học trong level hiện tại */
  setEnabledKeys(keys: string[]) {
    const enabled = new Set(keys);
    for (const [c, el] of this.keyEls) {
      el.classList.toggle('disabled', !enabled.has(c));
    }
  }

  /**
   * @param nextChar ký tự kế tiếp của mục tiêu đang khóa (highlight mạnh)
   * @param candidates chữ cái đầu của các tàu trên màn hình (highlight nhẹ khi chưa khóa)
   */
  update(nextChar: string | null, candidates: string[]) {
    for (const el of this.keyEls.values()) {
      el.classList.remove('next', 'candidate');
    }
    if (nextChar) {
      this.keyEls.get(nextChar)?.classList.add('next');
    } else {
      for (const c of candidates) {
        this.keyEls.get(c)?.classList.add('candidate');
      }
    }
  }

  show() {
    this.root.style.display = 'flex';
  }

  hide() {
    this.root.style.display = 'none';
  }
}
