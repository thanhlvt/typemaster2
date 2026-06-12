export interface BestStats {
  wpm: number;
  accuracy: number;
  score: number;
}

export interface ProgressData {
  unlocked: number; // level id cao nhất đã mở khóa
  best: Record<number, BestStats>;
}

export interface GameSession {
  levelId: number;
  lives: number;
}

const PROGRESS_KEY = 'typemaster2-progress';
const SESSION_KEY  = 'typemaster2-session';

export const Progress = {
  // ── Progress (level unlock + best stats) ──────────────────────────────

  load(): ProgressData {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ProgressData;
        if (typeof data.unlocked === 'number' && data.best) return data;
      }
    } catch {
      // dữ liệu hỏng → bắt đầu lại
    }
    return { unlocked: 1, best: {} };
  },

  save(data: ProgressData) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  },

  unlock(levelId: number) {
    const data = this.load();
    if (levelId > data.unlocked) {
      data.unlocked = levelId;
      this.save(data);
    }
  },

  recordBest(levelId: number, stats: BestStats) {
    const data = this.load();
    const prev = data.best[levelId];
    if (!prev || stats.score > prev.score) {
      data.best[levelId] = stats;
      this.save(data);
    }
  },

  // ── Session (trạng thái ván đang chơi) ────────────────────────────────

  saveSession(session: GameSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  loadSession(): GameSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw) as GameSession;
        if (typeof s.levelId === 'number' && typeof s.lives === 'number') return s;
      }
    } catch {}
    return null;
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },

  // ── Reset toàn bộ ──────────────────────────────────────────────────────

  reset() {
    localStorage.removeItem(PROGRESS_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};
