export interface BestStats {
  wpm: number;
  accuracy: number;
  score: number;
}

export interface ProgressData {
  unlocked: number; // level id cao nhất đã mở khóa
  best: Record<number, BestStats>;
}

const KEY = 'typemaster2-progress';

export const Progress = {
  load(): ProgressData {
    try {
      const raw = localStorage.getItem(KEY);
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
    localStorage.setItem(KEY, JSON.stringify(data));
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
};
