export interface LevelConfig {
  id: number;
  name: string;
  /** Phím mới được giới thiệu ở level này */
  newKeys: string[];
  /** Toàn bộ phím được phép dùng (tích lũy) */
  keys: string[];
  /** Số tàu cần hạ để qua màn */
  kills: number;
  /** Tốc độ cơ bản của tàu địch (đơn vị thế giới / giây) */
  speed: number;
  /** Khoảng cách giữa hai lần spawn (giây) */
  spawnInterval: number;
  /** Số tàu địch tối đa cùng lúc */
  maxAlive: number;
}

interface Stage {
  name: string;
  add: string[];
}

// Giáo trình 10 ngón: mở khóa dần từng cặp phím từ home row ra ngoài
const STAGES: Stage[] = [
  { name: 'Home Row: F J', add: ['f', 'j'] },
  { name: 'Home Row: D K', add: ['d', 'k'] },
  { name: 'Home Row: S L', add: ['s', 'l'] },
  { name: 'Home Row: A', add: ['a'] },
  { name: 'Home Row: G H', add: ['g', 'h'] },
  { name: 'Top Row: E I', add: ['e', 'i'] },
  { name: 'Top Row: R U', add: ['r', 'u'] },
  { name: 'Top Row: T Y', add: ['t', 'y'] },
  { name: 'Top Row: W O', add: ['w', 'o'] },
  { name: 'Top Row: Q P', add: ['q', 'p'] },
  { name: 'Bottom Row: V M', add: ['v', 'm'] },
  { name: 'Bottom Row: C N', add: ['c', 'n'] },
  { name: 'Bottom Row: B', add: ['b'] },
  { name: 'Bottom Row: X Z', add: ['x', 'z'] },
];

const SPEED_STAGES: Stage[] = [
  { name: 'Tốc độ I', add: [] },
  { name: 'Tốc độ II', add: [] },
  { name: 'Tốc độ III', add: [] },
  { name: 'Tốc độ IV', add: [] },
];

function buildLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];
  const keys: string[] = [];

  STAGES.forEach((stage, i) => {
    keys.push(...stage.add);
    const t = i / (STAGES.length - 1); // 0 → 1 theo tiến độ giáo trình
    levels.push({
      id: i + 1,
      name: stage.name,
      newKeys: [...stage.add],
      keys: [...keys],
      kills: 15 + Math.round(t * 10),
      speed: 3.4 + t * 2.2,
      spawnInterval: 2.4 - t * 0.9,
      maxAlive: 3 + Math.round(t * 2),
    });
  });

  SPEED_STAGES.forEach((stage, i) => {
    levels.push({
      id: STAGES.length + i + 1,
      name: stage.name,
      newKeys: [],
      keys: [...keys],
      kills: 25,
      speed: 5.8 + i * 1.1,
      spawnInterval: 1.5 - i * 0.15,
      maxAlive: 5 + i,
    });
  });

  return levels;
}

export const LEVELS: LevelConfig[] = buildLevels();
