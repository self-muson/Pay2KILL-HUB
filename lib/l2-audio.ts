'use client';

class L2RaidAudio {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('l2_sound_enabled');
        if (saved !== null) {
          this.soundEnabled = saved === '1';
        }
      } catch {
        // ignore
      }
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): boolean {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('l2_sound_enabled', enabled ? '1' : '0');
      } catch {
        // ignore
      }
    }
    if (enabled) {
      this.playEquipClick();
    }
    return this.soundEnabled;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Metallic inventory / equip click (Lineage 2 style)
   */
  public playEquipClick(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  /**
   * Powerful Medieval Clan War Horn (Рейдовый Горн сбора КК)
   */
  public playWarHorn(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;

      // Deep resonant fundamental + harmonics of a brass horn
      const freqs = [220, 440, 660, 880];
      const gains = [0.18, 0.12, 0.07, 0.03];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';

        // War horn swell and decay: low rise, hold, slow majestic fade
        osc.frequency.setValueAtTime(freq * 0.96, now);
        osc.frequency.linearRampToValueAtTime(freq, now + 0.25);
        osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 1.2);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(gains[idx], now + 0.2);
        gain.gain.setValueAtTime(gains[idx] * 0.9, now + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.9);
      });

      // Second fanfare blast (fifth note up) after 0.5s for authentic epic rally feel
      setTimeout(() => {
        if (!this.soundEnabled || !this.ctx || this.ctx.state !== 'running') return;
        const now2 = this.ctx.currentTime;
        const blastFreqs = [330, 660, 990];
        blastFreqs.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq * 0.98, now2);
          osc.frequency.linearRampToValueAtTime(freq, now2 + 0.15);

          gain.gain.setValueAtTime(0.001, now2);
          gain.gain.linearRampToValueAtTime(0.14, now2 + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now2 + 1.5);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(now2);
          osc.stop(now2 + 1.6);
        });
      }, 550);
    } catch {
      // ignore
    }
  }

  /**
   * Heavy Deep Cathedral Bell / Raid Gong (Колокол респауна босса)
   */
  public playRaidGong(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      // Strike frequencies for deep bell
      const bellFreqs = [174.61, 349.23, 523.25, 698.46];

      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const initialVol = 0.2 / (idx + 1);
        gain.gain.setValueAtTime(initialVol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Fast emergency war clatter (PVP War Signal)
   */
  public playPvpAlert(): void {
    if (!this.soundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const start = now + i * 0.16;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, start);
        osc.frequency.setValueAtTime(1100, start + 0.05);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.13);
      }
    } catch {
      // ignore
    }
  }
}

export const l2Audio = new L2RaidAudio();
