'use client';

// Sound Manager for Boss Tracker: Spawn alerts, Radio Ready Check, Window open chimes and CL sound configuration

export interface SoundConfig {
  spawnSoundEnabled: boolean;
  spawnSoundSource: string; // url, data:audio/..., or 'synth'
  spawnSoundFileName?: string;
  spawnSoundVolume: number; // 0 to 1

  readyCheckSoundEnabled: boolean;
  readyCheckSoundSource: string; // url, data:audio/...
  readyCheckSoundFileName?: string;
  readyCheckSoundVolume: number; // 0 to 1

  windowOpenSoundEnabled: boolean;
  windowOpenSoundSource: string; // url, data:audio/..., or 'synth'
  windowOpenSoundFileName?: string;
  windowOpenSoundVolume: number; // 0 to 1

  uiClickSoundEnabled: boolean;
  uiClickSoundSource: string; // url, data:audio/..., or 'synth'
  uiClickSoundFileName?: string;
  uiClickSoundVolume: number; // 0 to 1
}

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  spawnSoundEnabled: true,
  spawnSoundSource: '/sounds/kava-da.wav',
  spawnSoundFileName: 'kava-da.wav (Kava "Да!")',
  spawnSoundVolume: 1.0,

  readyCheckSoundEnabled: true,
  readyCheckSoundSource: '/sounds/415-i-ia-baza-otvette.wav',
  readyCheckSoundFileName: '415-i-ia-baza-otvette.wav (Рация 415)',
  readyCheckSoundVolume: 1.0,

  windowOpenSoundEnabled: true,
  windowOpenSoundSource: 'synth',
  windowOpenSoundFileName: 'Стандартный колокольчик (Синтезатор)',
  windowOpenSoundVolume: 0.8,

  uiClickSoundEnabled: true,
  uiClickSoundSource: 'synth',
  uiClickSoundFileName: 'Стандартный тактильный клик (Синтезатор)',
  uiClickSoundVolume: 0.5,
};

const SOUND_CONFIG_KEY = 'p2k_sound_config_v1';

class AudioManager {
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private config: SoundConfig = DEFAULT_SOUND_CONFIG;
  private activeRadioAudio: HTMLAudioElement | null = null;
  private activeRadioAudios: HTMLAudioElement[] = [];
  private activeAlertAudios: HTMLAudioElement[] = [];
  private isRadioActive: boolean = false;
  private radioInterval: any = null;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVol = localStorage.getItem('p2k_sound_volume');
        if (savedVol !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
        }
        const savedMute = localStorage.getItem('p2k_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
        const savedCfg = localStorage.getItem(SOUND_CONFIG_KEY);
        if (savedCfg) {
          this.config = { ...DEFAULT_SOUND_CONFIG, ...JSON.parse(savedCfg) };
        }
      } catch (e) {
        // ignore
      }
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getConfig(): SoundConfig {
    return { ...this.config };
  }

  public setConfig(newConfig: Partial<SoundConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SOUND_CONFIG_KEY, JSON.stringify(this.config));
      } catch (e) {
        // ignore
      }
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.activeRadioAudio) {
      this.activeRadioAudio.volume = this.isMuted ? 0 : this.volume * this.config.readyCheckSoundVolume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2k_sound_volume', String(this.volume));
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.activeRadioAudio) {
      this.activeRadioAudio.volume = this.isMuted ? 0 : this.volume * this.config.readyCheckSoundVolume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2k_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Synthesizer fallback for instant punchy RB spawn sound
  public playSynthSpawnSound(volScale: number = 1.0) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.9 * volScale, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      gainNode.connect(ctx.destination);

      // Chime oscillators
      const freqs = [587.33, 880.0, 1174.66, 1760.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 1.4);
      });

      // Sub-bass punch
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(150, now);
      subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      subOsc.connect(gainNode);
      subOsc.start(now);
      subOsc.stop(now + 0.35);
    } catch (e) {
      // ignore
    }
  }

  // Window open chime alert
  public playWindowOpenSound(customSrc?: string, customVol?: number) {
    if (this.isMuted && !customSrc) return;
    if (!this.config.windowOpenSoundEnabled && !customSrc) return;

    const source = customSrc || this.config.windowOpenSoundSource || 'synth';
    const effectiveVol = this.volume * (customVol !== undefined ? customVol : this.config.windowOpenSoundVolume);

    if (source && source !== 'synth') {
      try {
        const audio = new Audio(source);
        audio.volume = Math.max(0, Math.min(1, effectiveVol));
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playSynthWindowOpenSound(effectiveVol);
          });
        }
        return;
      } catch (e) {
        // fallback
      }
    }

    this.playSynthWindowOpenSound(effectiveVol);
  }

  private playSynthWindowOpenSound(vol: number) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.isMuted ? 0 : vol * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      gain.connect(ctx.destination);

      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        osc.connect(gain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.8);
      });
    } catch (e) {
      // ignore
    }
  }

  // UI click sound
  public playClickSound(customSrc?: string, customVol?: number) {
    if (this.isMuted && !customSrc) return;
    if (!this.config.uiClickSoundEnabled && !customSrc) return;

    const source = customSrc || this.config.uiClickSoundSource || 'synth';
    const effectiveVol = this.volume * (customVol !== undefined ? customVol : this.config.uiClickSoundVolume);

    if (source && source !== 'synth') {
      try {
        const audio = new Audio(source);
        audio.volume = Math.max(0, Math.min(1, effectiveVol));
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playSynthClickSound(effectiveVol);
          });
        }
        return;
      } catch (e) {
        // fallback
      }
    }

    this.playSynthClickSound(effectiveVol);
  }

  private playSynthClickSound(vol: number) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // Boss Spawn Alert Audio (unlimited clicks, zero delay, user configured sound)
  public playSpawnAlertSound(customSrc?: string, customVol?: number) {
    if (this.isMuted && !customSrc) return;
    if (!this.config.spawnSoundEnabled && !customSrc) return;

    const source = customSrc || this.config.spawnSoundSource || '/sounds/kava-da.wav';
    const effectiveVol = this.volume * (customVol !== undefined ? customVol : this.config.spawnSoundVolume);

    if (source === 'synth') {
      this.playSynthSpawnSound(customVol !== undefined ? customVol : this.config.spawnSoundVolume);
      return;
    }

    try {
      const audio = new Audio(source);
      audio.volume = Math.max(0, Math.min(1, effectiveVol));
      audio.currentTime = 0;
      this.activeAlertAudios.push(audio);
      audio.onended = () => {
        this.activeAlertAudios = this.activeAlertAudios.filter((a) => a !== audio);
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const fallback = new Audio('/sounds/rb-spawn.wav');
          fallback.volume = Math.max(0, Math.min(1, effectiveVol));
          this.activeAlertAudios.push(fallback);
          fallback.onended = () => {
            this.activeAlertAudios = this.activeAlertAudios.filter((a) => a !== fallback);
          };
          fallback.play().catch(() => {
            this.playSynthSpawnSound();
          });
        });
      }
    } catch (e) {
      this.playSynthSpawnSound();
    }
  }

  private stopAndUnloadAudio(audio: HTMLAudioElement) {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute('src');
      audio.load();
    } catch (e) {
      // ignore
    }
  }

  // Ready Check Radio Audio: plays ONLY the user's selected/uploaded sound file in loop
  public startReadyCheckRadio(customSrc?: string, customVol?: number) {
    if (this.isMuted && !customSrc) return;
    if (!this.config.readyCheckSoundEnabled && !customSrc) return;
    this.stopReadyCheckRadio();

    this.isRadioActive = true;
    const source = customSrc || this.config.readyCheckSoundSource || '/sounds/415-i-ia-baza-otvette.wav';
    const effectiveVol = this.volume * (customVol !== undefined ? customVol : this.config.readyCheckSoundVolume);

    try {
      const audio = new Audio(source);
      audio.volume = Math.max(0, Math.min(1, effectiveVol));
      audio.loop = true;
      audio.currentTime = 0;
      this.activeRadioAudio = audio;
      this.activeRadioAudios.push(audio);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // If user clicked "Я тут" before or during play promise resolution
            if (!this.isRadioActive) {
              this.stopAndUnloadAudio(audio);
            }
          })
          .catch((err) => {
            // If user stopped radio while play was pending (pause interrupted play)
            if (!this.isRadioActive) {
              this.stopAndUnloadAudio(audio);
              return;
            }

            // Only attempt fallback if radio should STILL be active and it's not a user pause interruption
            const isAbort = err && (err.name === 'AbortError' || String(err).includes('interrupted'));
            if (this.isRadioActive && !isAbort && source !== '/sounds/415-i-ia-baza-otvette.wav') {
              try {
                const fallback = new Audio('/sounds/415-i-ia-baza-otvette.wav');
                fallback.volume = Math.max(0, Math.min(1, effectiveVol));
                fallback.loop = true;
                this.activeRadioAudios.push(fallback);
                this.activeRadioAudio = fallback;
                const fbPromise = fallback.play();
                if (fbPromise !== undefined) {
                  fbPromise
                    .then(() => {
                      if (!this.isRadioActive) {
                        this.stopAndUnloadAudio(fallback);
                      }
                    })
                    .catch(() => {
                      this.stopAndUnloadAudio(fallback);
                    });
                }
              } catch (e) {
                // ignore
              }
            }
          });
      }
    } catch (e) {
      // ignore
    }
  }

  public stopReadyCheckRadio() {
    this.isRadioActive = false;

    if (this.activeRadioAudios.length > 0) {
      const copy = [...this.activeRadioAudios];
      this.activeRadioAudios = [];
      copy.forEach((audio) => {
        this.stopAndUnloadAudio(audio);
      });
    }

    if (this.activeRadioAudio) {
      this.stopAndUnloadAudio(this.activeRadioAudio);
      this.activeRadioAudio = null;
    }

    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }

  public stopAllAlertSounds() {
    this.stopReadyCheckRadio();

    if (this.activeAlertAudios.length > 0) {
      const copy = [...this.activeAlertAudios];
      this.activeAlertAudios = [];
      copy.forEach((audio) => {
        this.stopAndUnloadAudio(audio);
      });
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const audioManager = new AudioManager();
