export interface LevelConfig {
  id: number;
  name: string;
  /** Phím mới được giới thiệu ở level này (rỗng = level ôn tập / tốc độ) */
  newKeys: string[];
  /** Toàn bộ phím được phép dùng (tích lũy) */
  keys: string[];
  kills: number;
  speed: number;
  spawnInterval: number;
  maxAlive: number;
}

interface Stage {
  name: string;
  /** Phím thêm mới; [] = ôn tập, dùng lại tập phím hiện tại */
  add: string[];
  kills: number;
  speed: number;
  interval: number;
  maxAlive: number;
}

// ─── Phase 1: Home Row ────────────────────────────────────────────────────────
// Dạy từng cặp phím của hàng giữa, sau đó ôn tổng hợp
const PHASE1: Stage[] = [
  { name: 'Home Row: F J',    add: ['f','j'],    kills: 12, speed: 3.0, interval: 3.2, maxAlive: 2 },
  { name: 'Home Row: D K',    add: ['d','k'],    kills: 15, speed: 3.2, interval: 3.0, maxAlive: 2 },
  { name: 'Home Row: S L',    add: ['s','l'],    kills: 15, speed: 3.4, interval: 2.8, maxAlive: 3 },
  { name: 'Home Row: A',      add: ['a'],        kills: 15, speed: 3.4, interval: 2.8, maxAlive: 3 },
  { name: 'Home Row: G H',    add: ['g','h'],    kills: 18, speed: 3.6, interval: 2.5, maxAlive: 3 },
  { name: 'Ôn tập Home Row',  add: [],           kills: 25, speed: 3.4, interval: 2.3, maxAlive: 3 },
];

// ─── Phase 2: Top Row ────────────────────────────────────────────────────────
// Mở hàng trên theo thứ tự tần suất trong tiếng Anh, kèm ôn luyện giữa chừng
const PHASE2: Stage[] = [
  { name: 'Top Row: E I',         add: ['e','i'],    kills: 18, speed: 3.8, interval: 2.3, maxAlive: 3 },
  { name: 'Top Row: R U',         add: ['r','u'],    kills: 20, speed: 4.0, interval: 2.1, maxAlive: 3 },
  { name: 'Ôn tập E I R U',      add: [],           kills: 25, speed: 3.8, interval: 2.0, maxAlive: 3 },
  { name: 'Top Row: T Y',         add: ['t','y'],    kills: 20, speed: 4.2, interval: 2.0, maxAlive: 4 },
  { name: 'Top Row: W O',         add: ['w','o'],    kills: 22, speed: 4.4, interval: 1.9, maxAlive: 4 },
  { name: 'Top Row: Q P',         add: ['q','p'],    kills: 22, speed: 4.4, interval: 1.9, maxAlive: 4 },
  { name: 'Ôn tập Top Row',       add: [],           kills: 30, speed: 4.2, interval: 1.8, maxAlive: 4 },
];

// ─── Phase 3: Bottom Row ─────────────────────────────────────────────────────
const PHASE3: Stage[] = [
  { name: 'Bottom Row: V M',      add: ['v','m'],    kills: 22, speed: 4.6, interval: 1.8, maxAlive: 4 },
  { name: 'Bottom Row: C N',      add: ['c','n'],    kills: 22, speed: 4.6, interval: 1.8, maxAlive: 4 },
  { name: 'Bottom Row: B',        add: ['b'],        kills: 22, speed: 4.8, interval: 1.7, maxAlive: 4 },
  { name: 'Bottom Row: X Z',      add: ['x','z'],    kills: 25, speed: 4.8, interval: 1.7, maxAlive: 4 },
  { name: 'Ôn tập Bottom Row',    add: [],           kills: 30, speed: 4.6, interval: 1.6, maxAlive: 4 },
  { name: 'Toàn bộ bàn phím',     add: [],           kills: 30, speed: 4.8, interval: 1.5, maxAlive: 5 },
];

// ─── Phase 4: Speed Training ─────────────────────────────────────────────────
// Toàn bộ 26 chữ, tốc độ tăng dần, mật độ địch tăng
const PHASE4: Stage[] = [
  { name: 'Tốc độ I',    add: [], kills: 30, speed: 5.5, interval: 1.4, maxAlive: 5 },
  { name: 'Tốc độ II',   add: [], kills: 35, speed: 6.0, interval: 1.3, maxAlive: 5 },
  { name: 'Tốc độ III',  add: [], kills: 35, speed: 6.5, interval: 1.2, maxAlive: 6 },
  { name: 'Tốc độ IV',   add: [], kills: 40, speed: 7.0, interval: 1.1, maxAlive: 6 },
  { name: 'Expert',      add: [], kills: 40, speed: 7.5, interval: 1.0, maxAlive: 7 },
  { name: 'Master',      add: [], kills: 50, speed: 8.0, interval: 0.9, maxAlive: 8 },
];

function buildLevels(): LevelConfig[] {
  const all: Stage[] = [...PHASE1, ...PHASE2, ...PHASE3, ...PHASE4];
  const levels: LevelConfig[] = [];
  const keys: string[] = [];

  for (let i = 0; i < all.length; i++) {
    const s = all[i];
    keys.push(...s.add);
    levels.push({
      id: i + 1,
      name: s.name,
      newKeys: [...s.add],
      keys: [...keys],
      kills: s.kills,
      speed: s.speed,
      spawnInterval: s.interval,
      maxAlive: s.maxAlive,
    });
  }
  return levels;
}

export const LEVELS: LevelConfig[] = buildLevels();
