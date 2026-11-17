/* ------------------------------------------------------------------ */
/* Synthesized audio engine (Web Audio API).                           */
/* No external audio files — everything is original + generated.       */
/* Music starts only after a user gesture (browser policy).            */
/* ------------------------------------------------------------------ */
export type Mood = "hero" | "chaos" | "calm" | "boss";

interface Pattern {
  bpm: number;
  bass: (number | 0)[];
  lead: (number | 0)[];
  hat: number[]; // 1 = hit
}

const PATTERNS: Record<Mood, Pattern> = {
  hero: {
    bpm: 132,
    bass: [110, 0, 110, 110, 0, 110, 0, 131, 87, 0, 87, 87, 0, 98, 0, 110],
    lead: [440, 523, 0, 587, 659, 0, 587, 523, 349, 440, 0, 494, 587, 0, 659, 0],
    hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1],
  },
  chaos: {
    bpm: 148,
    bass: [98, 98, 0, 98, 93, 93, 0, 98, 110, 0, 110, 104, 110, 0, 116, 0],
    lead: [784, 0, 740, 784, 710, 0, 740, 0, 880, 830, 0, 880, 0, 932, 0, 880],
    hat: [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  },
  calm: {
    bpm: 96,
    bass: [98, 0, 0, 0, 110, 0, 0, 0, 87, 0, 0, 0, 116, 0, 104, 0],
    lead: [392, 0, 494, 0, 523, 0, 494, 440, 349, 0, 440, 0, 494, 0, 587, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  },
  boss: {
    bpm: 124,
    bass: [82, 0, 82, 82, 0, 82, 87, 0, 82, 0, 82, 82, 0, 82, 82, 98],
    lead: [659, 659, 0, 587, 659, 0, 622, 587, 659, 659, 0, 587, 0, 622, 659, 740],
    hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicG: GainNode | null = null;
  private sfxG: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  playing: Mood | null = null;
  vols = { master: 0.9, music: 0.7, sfx: 0.9, muted: false };

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicG = this.ctx.createGain();
      this.sfxG = this.ctx.createGain();
      this.musicG.connect(this.master);
      this.sfxG.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.apply();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVols(v: { master?: number; music?: number; sfx?: number; muted?: boolean }) {
    this.vols = { ...this.vols, ...v };
    this.apply();
  }
  private apply() {
    if (!this.ctx || !this.master || !this.musicG || !this.sfxG) return;
    const m = this.vols.muted ? 0 : this.vols.master;
    this.master.gain.value = m;
    this.musicG.gain.value = this.vols.music * 0.5;
    this.sfxG.gain.value = this.vols.sfx;
  }

  /* ---------------- music ---------------- */
  startMusic(mood: Mood) {
    this.unlock();
    if (!this.ctx) return;
    if (this.playing === mood) return;
    this.stopMusic();
    this.playing = mood;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.tick(), 90);
  }
  stopMusic() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.playing = null;
  }
  private tick() {
    if (!this.ctx || !this.playing) return;
    const p = PATTERNS[this.playing];
    const stepDur = 60 / p.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const s = this.step % 16;
      const t = this.nextTime;
      if (p.bass[s]) this.tone(p.bass[s], stepDur * 1.8, "triangle", 0.5, t, this.musicG!);
      if (p.lead[s]) this.tone(p.lead[s], stepDur * 0.9, "square", 0.14, t, this.musicG!);
      if (p.hat[s]) this.noise(0.03, 0.1, 6000, t, this.musicG!);
      if (s === 4 || s === 12) this.noise(0.09, 0.18, 1800, t, this.musicG!);
      this.nextTime += stepDur;
      this.step++;
    }
  }
  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    when: number,
    dest: AudioNode,
    slideTo?: number
  ) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), when + dur);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
  private noise(dur: number, vol: number, freq: number, when: number, dest: AudioNode) {
    if (!this.ctx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(when);
  }

  /* ---------------- sfx ---------------- */
  private ok(): [AudioContext, GainNode] | null {
    this.unlock();
    return this.ctx && this.sfxG ? [this.ctx, this.sfxG] : null;
  }
  private sTone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
    const o = this.ok();
    if (!o) return;
    const [ctx, g] = o;
    this.tone(freq, dur, type, vol, ctx.currentTime + delay, g, slideTo);
  }
  private sNoise(dur: number, vol: number, freq: number, delay = 0) {
    const o = this.ok();
    if (!o) return;
    const [ctx, g] = o;
    this.noise(dur, vol, freq, ctx.currentTime + delay, g);
  }

  click() { this.sTone(680, 0.05, "square", 0.22); }
  tap() { this.sTone(1200, 0.03, "sine", 0.12); }
  good() { this.sTone(523, 0.09, "sine", 0.4); this.sTone(784, 0.16, "sine", 0.4, 0.08); }
  bad() { this.sTone(220, 0.28, "sawtooth", 0.32, 0, 110); this.sNoise(0.15, 0.2, 400); }
  coin() { this.sTone(988, 0.06, "square", 0.2); this.sTone(1319, 0.14, "square", 0.2, 0.06); }
  jump() { this.sTone(320, 0.16, "sine", 0.4, 0, 720); }
  slideSfx() { this.sNoise(0.18, 0.3, 900); }
  hit() { this.sTone(120, 0.25, "sawtooth", 0.5, 0, 60); this.sNoise(0.25, 0.45, 500); }
  whoosh() { this.sNoise(0.3, 0.3, 1400); }
  laugh() {
    this.sTone(420, 0.09, "sine", 0.35);
    this.sTone(500, 0.09, "sine", 0.35, 0.1);
    this.sTone(360, 0.12, "sine", 0.35, 0.2);
  }
  applause() {
    for (let i = 0; i < 14; i++) this.sNoise(0.05, 0.12, 2500, i * 0.055 + Math.random() * 0.03);
  }
  levelup() {
    [523, 659, 784, 1047].forEach((f, i) => this.sTone(f, 0.12, "triangle", 0.4, i * 0.09));
  }
  egg() {
    [880, 1175, 1568, 2093].forEach((f, i) => this.sTone(f, 0.1, "sine", 0.3, i * 0.07));
    this.sNoise(0.2, 0.1, 7000, 0.28);
  }
  power() { this.sTone(440, 0.1, "square", 0.3); this.sTone(880, 0.18, "square", 0.3, 0.08); }
  countdown() { this.sTone(940, 0.08, "square", 0.3); }
  go() { this.sTone(1240, 0.3, "square", 0.35); this.sTone(1650, 0.3, "sine", 0.25, 0.02); }
}

export const audio = new AudioEngine();
