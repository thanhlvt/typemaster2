/**
 * Hiệu ứng âm thanh tổng hợp bằng Web Audio API — không cần file asset.
 * AudioContext chỉ được tạo sau tương tác đầu tiên (chính sách autoplay).
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private bgAudio: HTMLAudioElement | null = null;

  /** Gọi từ sự kiện người dùng (keydown/click) để mở khóa audio */
  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    const len = Math.floor(this.ctx.sampleRate * 0.4);
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    duration: number,
    volume: number,
    delay = 0,
  ) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  laser() {
    this.tone('square', 920, 180, 0.09, 0.12);
  }

  error() {
    this.tone('sawtooth', 130, 70, 0.18, 0.18);
  }

  ding() {
    this.tone('sine', 660, 1320, 0.18, 0.18);
  }

  explosion() {
    if (!this.ctx || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.35);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t);
  }

  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone('triangle', f, f, 0.22, 0.16, i * 0.1));
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((f, i) => this.tone('triangle', f, f, 0.3, 0.16, i * 0.15));
  }

  startMusic() {
    if (!this.bgAudio) {
      this.bgAudio = new Audio('/bg.mp3');
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.2;
    }
    this.bgAudio.play().catch(() => {});
  }

  stopMusic() {
    if (!this.bgAudio) return;
    this.bgAudio.pause();
    this.bgAudio.currentTime = 0;
  }
}
