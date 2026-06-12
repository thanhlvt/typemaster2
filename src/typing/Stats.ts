export class Stats {
  correct = 0;
  errors = 0;
  score = 0;
  combo = 0;
  bestCombo = 0;
  kills = 0;

  private startTime = 0;

  start() {
    this.correct = 0;
    this.errors = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.kills = 0;
    this.startTime = performance.now();
  }

  /** WPM chuẩn: (số ký tự đúng / 5) chia cho số phút đã trôi qua */
  get wpm(): number {
    const minutes = (performance.now() - this.startTime) / 60000;
    if (minutes < 0.03) return 0;
    return Math.round(this.correct / 5 / minutes);
  }

  /** Độ chính xác 0–100 */
  get accuracy(): number {
    const total = this.correct + this.errors;
    if (total === 0) return 100;
    return Math.round((this.correct / total) * 100);
  }

  onHit() {
    this.correct++;
  }

  onMiss() {
    this.errors++;
    this.combo = 0;
  }

  onKill(wordLength: number) {
    this.kills++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += wordLength * 10 + this.combo * 5;
  }
}
