import { WORDS } from './wordlist';

const LEFT_HAND = new Set('qwertasdfgzxcvb');

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sinh từ cho một level: ưu tiên từ tiếng Anh thật chỉ chứa các phím đã học;
 * khi vốn từ chưa đủ (level đầu giáo trình) thì sinh chuỗi drill 2–4 ký tự
 * xen kẽ hai tay để luyện vị trí ngón.
 */
export class WordGenerator {
  private pool: string[];
  private keys: string[];
  private leftKeys: string[];
  private rightKeys: string[];

  constructor(keys: string[]) {
    this.keys = keys;
    const keySet = new Set(keys);
    this.pool = [...new Set(WORDS)].filter((w) =>
      [...w].every((c) => keySet.has(c)),
    );
    this.leftKeys = keys.filter((k) => LEFT_HAND.has(k));
    this.rightKeys = keys.filter((k) => !LEFT_HAND.has(k));
  }

  /**
   * Lấy một từ có chữ cái đầu không trùng với các tàu đang bay
   * (để việc khóa mục tiêu theo phím đầu tiên luôn rõ ràng).
   */
  getWord(forbiddenFirst: Set<string>): string {
    const useReal = this.pool.length >= 15 && Math.random() < 0.8;
    for (let i = 0; i < 40; i++) {
      const w = useReal ? pick(this.pool) : this.drill();
      if (!forbiddenFirst.has(w[0])) return w;
    }
    return this.drill();
  }

  /** Chuỗi luyện ngón 2–4 ký tự, xen kẽ trái/phải khi có thể */
  private drill(): string {
    const len = 2 + Math.floor(Math.random() * 3);
    const canAlternate = this.leftKeys.length > 0 && this.rightKeys.length > 0;
    let useLeft = Math.random() < 0.5;
    let out = '';
    let prev = '';
    for (let i = 0; i < len; i++) {
      const source = canAlternate
        ? useLeft
          ? this.leftKeys
          : this.rightKeys
        : this.keys;
      let c = pick(source);
      if (c === prev && source.length > 1) c = pick(source);
      out += c;
      prev = c;
      useLeft = !useLeft;
    }
    return out;
  }
}
