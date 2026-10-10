'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Square,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  Sliders,
  Check,
  Music,
  Lock,
  RadioTower,
  Upload,
  Trash2,
  FileAudio,
} from 'lucide-react';
import { audioManager, DEFAULT_SOUND_CONFIG, SoundConfig } from '@/lib/audio-manager';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function SoundSettingsModal({ isOpen, onClose, onShowToast }: SoundSettingsModalProps) {
  const { role, verifyPin } = useBossTrackerStore();

  const [cfg, setCfg] = useState<SoundConfig>(() => audioManager.getConfig());
  const [masterVolume, setMasterVolume] = useState<number>(() => audioManager.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(() => audioManager.getIsMuted());

  // Radio test state
  const [isPlayingRadioTest, setIsPlayingRadioTest] = useState(false);
  const [testingSoundType, setTestingSoundType] = useState<string | null>(null);

  // File input refs for uploading custom audio
  const spawnFileInputRef = useRef<HTMLInputElement>(null);
  const readyCheckFileInputRef = useRef<HTMLInputElement>(null);
  const windowOpenFileInputRef = useRef<HTMLInputElement>(null);
  const clickFileInputRef = useRef<HTMLInputElement>(null);

  // Non-admin PIN unlock attempt
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const isLeaderOrAdmin = role === 'admin';

  useEffect(() => {
    if (isOpen) {
      setCfg(audioManager.getConfig());
      setMasterVolume(audioManager.getVolume());
      setIsMuted(audioManager.getIsMuted());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateConfig = (updates: Partial<SoundConfig>) => {
    const updated = { ...cfg, ...updates };
    setCfg(updated);
    audioManager.setConfig(updates);
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioManager.setVolume(vol);
  };

  const handleToggleMute = () => {
    const nextMute = audioManager.toggleMute();
    setIsMuted(nextMute);
  };

  const handleResetDefaults = () => {
    setCfg(DEFAULT_SOUND_CONFIG);
    audioManager.setConfig(DEFAULT_SOUND_CONFIG);
    setMasterVolume(0.8);
    audioManager.setVolume(0.8);
    if (isMuted) {
      audioManager.toggleMute();
      setIsMuted(false);
    }
    if (onShowToast) {
      onShowToast('Звуковые настройки сброшены к значениям по умолчанию');
    }
  };

  // Generic file upload processor for audio
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'spawn' | 'readyCheck' | 'windowOpen' | 'click'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit ~10MB
    if (file.size > 10 * 1024 * 1024) {
      if (onShowToast) onShowToast('⚠️ Файл слишком большой! Максимальный размер: 10 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const fileName = file.name;

      if (type === 'spawn') {
        handleUpdateConfig({
          spawnSoundSource: dataUrl,
          spawnSoundFileName: fileName,
          spawnSoundEnabled: true,
        });
        if (onShowToast) onShowToast(`🎵 Загружен свой звук респауна: ${fileName}`);
      } else if (type === 'readyCheck') {
        handleUpdateConfig({
          readyCheckSoundSource: dataUrl,
          readyCheckSoundFileName: fileName,
          readyCheckSoundEnabled: true,
        });
        if (onShowToast) onShowToast(`📻 Загружен свой звук рации: ${fileName}`);
      } else if (type === 'windowOpen') {
        handleUpdateConfig({
          windowOpenSoundSource: dataUrl,
          windowOpenSoundFileName: fileName,
          windowOpenSoundEnabled: true,
        });
        if (onShowToast) onShowToast(`🔔 Загружен свой звук окна респауна: ${fileName}`);
      } else if (type === 'click') {
        handleUpdateConfig({
          uiClickSoundSource: dataUrl,
          uiClickSoundFileName: fileName,
          uiClickSoundEnabled: true,
        });
        if (onShowToast) onShowToast(`✨ Загружен свой звук клика интерфейса: ${fileName}`);
      }
    };
    reader.readAsDataURL(file);

    // reset input value so re-uploading same file triggers change
    e.target.value = '';
  };

  const handleTestSpawnSound = () => {
    setTestingSoundType('spawn');
    audioManager.playSpawnAlertSound(cfg.spawnSoundSource, cfg.spawnSoundVolume);
    setTimeout(() => setTestingSoundType(null), 1500);
  };

  const handleTestReadyCheck = () => {
    if (isPlayingRadioTest) {
      audioManager.stopReadyCheckRadio();
      setIsPlayingRadioTest(false);
    } else {
      audioManager.startReadyCheckRadio(cfg.readyCheckSoundSource, cfg.readyCheckSoundVolume);
      setIsPlayingRadioTest(true);
      setTimeout(() => {
        audioManager.stopReadyCheckRadio();
        setIsPlayingRadioTest(false);
      }, 5000);
    }
  };

  const handleTestWindowOpen = () => {
    setTestingSoundType('window');
    audioManager.playWindowOpenSound(cfg.windowOpenSoundSource, cfg.windowOpenSoundVolume);
    setTimeout(() => setTestingSoundType(null), 1200);
  };

  const handleTestClick = () => {
    setTestingSoundType('click');
    audioManager.playClickSound(cfg.uiClickSoundSource, cfg.uiClickSoundVolume);
    setTimeout(() => setTestingSoundType(null), 400);
  };

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput.trim()) return;
    const res = await verifyPin(adminPinInput.trim());
    if (res.success && res.role === 'admin') {
      setPinError(null);
      if (onShowToast) onShowToast('Доступ предоставлен: КЛ (Админ)');
    } else {
      setPinError('Неверный PIN КЛа (по умолчанию 7777)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in font-sans">
      <div className="bg-[#0b0e16] border-2 border-amber-500/70 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#171b26] via-[#22293a] to-[#171b26] border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-slate-100 flex items-center gap-2">
                <span>Настройка звуков сайта</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950 border border-red-500 text-red-300">
                  КЛ / Админ
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Загрузка собственных аудиофайлов и управление оповещениями
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isPlayingRadioTest) audioManager.stopReadyCheckRadio();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 text-xs font-mono scrollbar-thin">
          {/* If NOT Admin: Show Lock & Unlock Prompt */}
          {!isLeaderOrAdmin ? (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/50 space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-red-900/50 border border-red-400 flex items-center justify-center text-red-300">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-200">
                  Доступ ограничен: только для КЛа и Админа
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Настройка звуковых эффектов и загрузка аудиофайлов доступны лидеру клана (КЛу) и администраторам трекера. Введите PIN КЛа для доступа.
                </p>
              </div>

              <form onSubmit={handleUnlockWithPin} className="max-w-xs mx-auto space-y-2 pt-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="PIN КЛа (напр. 7777)"
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setPinError(null);
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#070a10] border border-slate-700 text-amber-300 font-mono text-center text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Войти
                  </button>
                </div>
                {pinError && <p className="text-[11px] text-red-400">{pinError}</p>}
              </form>
            </div>
          ) : (
            <>
              {/* 1. MASTER VOLUME & MUTE */}
              <div className="p-3 rounded-xl bg-[#101420] border border-slate-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      isMuted
                        ? 'bg-red-950/80 border-red-500 text-red-400'
                        : 'bg-[#090d16] border-slate-700 text-amber-400'
                    }`}
                    title={isMuted ? 'Включить звук' : 'Заглушить звук (Mute)'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="font-bold text-slate-200">Главная громкость сайта</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Мастер-регулятор звука для всех оповещений
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : masterVolume}
                    onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                    className="w-24 sm:w-32 accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-300 w-10 text-right">
                    {isMuted ? '0%' : `${Math.round(masterVolume * 100)}%`}
                  </span>
                </div>
              </div>

              {/* 2. SPAWN ALERT SOUND SETTINGS + CUSTOM AUDIO UPLOADER */}
              <div className="p-3.5 rounded-xl bg-[#0e121c] border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 text-xs">
                        1. Оповещение о респауне босса (кнопка «Оповестить»)
                      </span>
                      <span className="text-[10px] text-amber-400/90 block font-sans">
                        Звук при нажатии кнопки «Оповестить» о респе любого босса
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-400 font-sans hidden xs:inline">
                      {cfg.spawnSoundEnabled ? 'Включено' : 'Выключено'}
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.spawnSoundEnabled}
                      onChange={(e) => handleUpdateConfig({ spawnSoundEnabled: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Upload & Preset controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Preset source selection */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Выбрать предустановленный звук:
                      </label>
                      <select
                        value={
                          cfg.spawnSoundSource.startsWith('data:')
                            ? 'custom'
                            : cfg.spawnSoundSource
                        }
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            spawnFileInputRef.current?.click();
                          } else {
                            const name =
                              e.target.value === '/sounds/kava-da.wav'
                                ? 'kava-da.wav (Kava "Да!")'
                                : e.target.value === '/sounds/rb-spawn.wav'
                                ? 'rb-spawn.wav (Классический колокол)'
                                : 'Синтезатор аккорда';
                            handleUpdateConfig({
                              spawnSoundSource: e.target.value,
                              spawnSoundFileName: name,
                            });
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070a10] border border-slate-700 text-slate-200 text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="/sounds/kava-da.wav">
                          🔊 Kava "Да!" (Оригинальный звук пользователя)
                        </option>
                        <option value="/sounds/rb-spawn.wav">
                          🔔 RB Spawn Chime (Классический колокол)
                        </option>
                        <option value="synth">
                          ⚡ Синтезированный аккорд (Web Audio API)
                        </option>
                        {cfg.spawnSoundSource.startsWith('data:') && (
                          <option value="custom">
                            📁 Загруженный файл: {cfg.spawnSoundFileName || 'Мой аудиофайл'}
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Custom File Upload Button */}
                    <div className="flex flex-col justify-end">
                      <input
                        ref={spawnFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={(e) => handleFileUpload(e, 'spawn')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => spawnFileInputRef.current?.click()}
                        className="w-full px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 hover:border-amber-400 text-amber-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Загрузить свой аудиофайл (.wav, .mp3, .ogg)</span>
                      </button>
                    </div>
                  </div>

                  {/* Active file status badge */}
                  {cfg.spawnSoundSource.startsWith('data:') && (
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/50 flex items-center justify-between text-[11px] text-amber-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileAudio className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-bold truncate">
                          Активный файл: {cfg.spawnSoundFileName || 'Пользовательский звук'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateConfig({
                            spawnSoundSource: '/sounds/kava-da.wav',
                            spawnSoundFileName: 'kava-da.wav (Kava "Да!")',
                          })
                        }
                        className="text-red-400 hover:text-red-200 p-1 flex items-center gap-1 text-[10px] underline ml-2 shrink-0 cursor-pointer"
                        title="Сбросить к стандартному звуку"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Сбросить</span>
                      </button>
                    </div>
                  )}

                  {/* Volume & Test */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Громкость:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={cfg.spawnSoundVolume}
                        onChange={(e) =>
                          handleUpdateConfig({ spawnSoundVolume: parseFloat(e.target.value) })
                        }
                        className="flex-1 max-w-[160px] accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-amber-300 font-bold text-[11px] w-8 text-right">
                        {Math.round(cfg.spawnSoundVolume * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestSpawnSound}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow shrink-0 cursor-pointer ${
                        testingSoundType === 'spawn'
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : 'bg-amber-500/90 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Тест звука</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. READY CHECK / RADIO SOUND SETTINGS + CUSTOM AUDIO UPLOADER */}
              <div className="p-3.5 rounded-xl bg-[#0e121c] border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm">
                      <RadioTower className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 text-xs">
                        2. Рация реди-чека («415-я база ответьте...»)
                      </span>
                      <span className="text-[10px] text-cyan-400/90 block font-sans">
                        Звуковой сигнал проверки готовности наблюдателя на споте
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-400 font-sans hidden xs:inline">
                      {cfg.readyCheckSoundEnabled ? 'Включено' : 'Выключено'}
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.readyCheckSoundEnabled}
                      onChange={(e) =>
                        handleUpdateConfig({ readyCheckSoundEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Upload & Preset controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Preset source selection */}
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Выбрать звук рации:
                      </label>
                      <select
                        value={
                          cfg.readyCheckSoundSource.startsWith('data:')
                            ? 'custom'
                            : cfg.readyCheckSoundSource
                        }
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            readyCheckFileInputRef.current?.click();
                          } else {
                            const name =
                              e.target.value === '/sounds/415-i-ia-baza-otvette.wav'
                                ? '415-i-ia-baza-otvette.wav (Рация 415)'
                                : 'radio-415.wav (Короткий позывной)';
                            handleUpdateConfig({
                              readyCheckSoundSource: e.target.value,
                              readyCheckSoundFileName: name,
                            });
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070a10] border border-slate-700 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        <option value="/sounds/415-i-ia-baza-otvette.wav">
                          📻 "415-я я база ответьте!" (Аудиозапись)
                        </option>
                        <option value="/sounds/radio-415.wav">
                          📢 Рация 415 (Короткий позывной)
                        </option>
                        {cfg.readyCheckSoundSource.startsWith('data:') && (
                          <option value="custom">
                            📁 Загруженный файл: {cfg.readyCheckSoundFileName || 'Мой аудиофайл'}
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Custom File Upload Button */}
                    <div className="flex flex-col justify-end">
                      <input
                        ref={readyCheckFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={(e) => handleFileUpload(e, 'readyCheck')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => readyCheckFileInputRef.current?.click()}
                        className="w-full px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 hover:border-cyan-400 text-cyan-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Загрузить свой аудиофайл (.wav, .mp3, .ogg)</span>
                      </button>
                    </div>
                  </div>

                  {/* Active file status badge */}
                  {cfg.readyCheckSoundSource.startsWith('data:') && (
                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/50 flex items-center justify-between text-[11px] text-cyan-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-bold truncate">
                          Активный файл: {cfg.readyCheckSoundFileName || 'Пользовательский звук'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateConfig({
                            readyCheckSoundSource: '/sounds/415-i-ia-baza-otvette.wav',
                            readyCheckSoundFileName: '415-i-ia-baza-otvette.wav (Рация 415)',
                          })
                        }
                        className="text-red-400 hover:text-red-200 p-1 flex items-center gap-1 text-[10px] underline ml-2 shrink-0 cursor-pointer"
                        title="Сбросить к стандартному звуку"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Сбросить</span>
                      </button>
                    </div>
                  )}

                  {/* Volume & Test */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Громкость:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={cfg.readyCheckSoundVolume}
                        onChange={(e) =>
                          handleUpdateConfig({ readyCheckSoundVolume: parseFloat(e.target.value) })
                        }
                        className="flex-1 max-w-[160px] accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-cyan-300 font-bold text-[11px] w-8 text-right">
                        {Math.round(cfg.readyCheckSoundVolume * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestReadyCheck}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow shrink-0 cursor-pointer ${
                        isPlayingRadioTest
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-cyan-500/90 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {isPlayingRadioTest ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Стоп (Рация)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Тест (Рация)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. WINDOW OPEN CHIME SOUND SETTINGS + CUSTOM AUDIO UPLOADER */}
              <div className="p-3.5 rounded-xl bg-[#0e121c] border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 text-xs">
                        3. Открытие расчетного окна респауна
                      </span>
                      <span className="text-[10px] text-emerald-400/90 block font-sans">
                        Звук при наступлении окна респауна (статус «Окно открыто»)
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-400 font-sans hidden xs:inline">
                      {cfg.windowOpenSoundEnabled ? 'Включено' : 'Выключено'}
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.windowOpenSoundEnabled}
                      onChange={(e) =>
                        handleUpdateConfig({ windowOpenSoundEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Upload & Preset controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Выбрать звук окна:
                      </label>
                      <select
                        value={
                          cfg.windowOpenSoundSource.startsWith('data:')
                            ? 'custom'
                            : cfg.windowOpenSoundSource
                        }
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            windowOpenFileInputRef.current?.click();
                          } else {
                            handleUpdateConfig({
                              windowOpenSoundSource: e.target.value,
                              windowOpenSoundFileName: 'Стандартный колокольчик (Синтезатор)',
                            });
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070a10] border border-slate-700 text-slate-200 text-xs focus:border-emerald-400 focus:outline-none cursor-pointer"
                      >
                        <option value="synth">
                          🔔 Синтезированный колокольчик (По умолчанию)
                        </option>
                        {cfg.windowOpenSoundSource.startsWith('data:') && (
                          <option value="custom">
                            📁 Загруженный файл: {cfg.windowOpenSoundFileName || 'Мой аудиофайл'}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <input
                        ref={windowOpenFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={(e) => handleFileUpload(e, 'windowOpen')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => windowOpenFileInputRef.current?.click()}
                        className="w-full px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/70 hover:border-emerald-400 text-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Загрузить свой аудиофайл (.wav, .mp3, .ogg)</span>
                      </button>
                    </div>
                  </div>

                  {cfg.windowOpenSoundSource.startsWith('data:') && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/50 flex items-center justify-between text-[11px] text-emerald-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileAudio className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold truncate">
                          Активный файл: {cfg.windowOpenSoundFileName || 'Пользовательский звук'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateConfig({
                            windowOpenSoundSource: 'synth',
                            windowOpenSoundFileName: 'Стандартный колокольчик (Синтезатор)',
                          })
                        }
                        className="text-red-400 hover:text-red-200 p-1 flex items-center gap-1 text-[10px] underline ml-2 shrink-0 cursor-pointer"
                        title="Сбросить к стандартному звуку"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Сбросить</span>
                      </button>
                    </div>
                  )}

                  {/* Volume & Test */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Громкость:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={cfg.windowOpenSoundVolume}
                        onChange={(e) =>
                          handleUpdateConfig({ windowOpenSoundVolume: parseFloat(e.target.value) })
                        }
                        className="flex-1 max-w-[160px] accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-emerald-300 font-bold text-[11px] w-8 text-right">
                        {Math.round(cfg.windowOpenSoundVolume * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestWindowOpen}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow shrink-0 cursor-pointer ${
                        testingSoundType === 'window'
                          ? 'bg-emerald-400 text-slate-950 animate-pulse'
                          : 'bg-emerald-500/90 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Тест звука</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. UI CLICK SOUND SETTINGS + CUSTOM AUDIO UPLOADER */}
              <div className="p-3.5 rounded-xl bg-[#0e121c] border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-500/60 flex items-center justify-center text-purple-400 shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 text-xs">
                        4. Звуки кнопок и переключателей интерфейса
                      </span>
                      <span className="text-[10px] text-purple-400/90 block font-sans">
                        Тактильный клик при переключении фильтров, вкладок и кнопок
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-[10px] text-slate-400 font-sans hidden xs:inline">
                      {cfg.uiClickSoundEnabled ? 'Включено' : 'Выключено'}
                    </span>
                    <input
                      type="checkbox"
                      checked={cfg.uiClickSoundEnabled}
                      onChange={(e) =>
                        handleUpdateConfig({ uiClickSoundEnabled: e.target.checked })
                      }
                      className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Upload & Preset controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">
                        Выбрать звук клика:
                      </label>
                      <select
                        value={
                          cfg.uiClickSoundSource?.startsWith('data:')
                            ? 'custom'
                            : cfg.uiClickSoundSource || 'synth'
                        }
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            clickFileInputRef.current?.click();
                          } else {
                            handleUpdateConfig({
                              uiClickSoundSource: e.target.value,
                              uiClickSoundFileName: 'Стандартный тактильный клик (Синтезатор)',
                            });
                          }
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-[#070a10] border border-slate-700 text-slate-200 text-xs focus:border-purple-400 focus:outline-none cursor-pointer"
                      >
                        <option value="synth">
                          ✨ Синтезированный клик (По умолчанию)
                        </option>
                        {cfg.uiClickSoundSource?.startsWith('data:') && (
                          <option value="custom">
                            📁 Загруженный файл: {cfg.uiClickSoundFileName || 'Мой аудиофайл'}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <input
                        ref={clickFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={(e) => handleFileUpload(e, 'click')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => clickFileInputRef.current?.click()}
                        className="w-full px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/70 hover:border-purple-400 text-purple-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>Загрузить свой аудиофайл (.wav, .mp3, .ogg)</span>
                      </button>
                    </div>
                  </div>

                  {cfg.uiClickSoundSource?.startsWith('data:') && (
                    <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/50 flex items-center justify-between text-[11px] text-purple-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <FileAudio className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="font-bold truncate">
                          Активный файл: {cfg.uiClickSoundFileName || 'Пользовательский звук'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateConfig({
                            uiClickSoundSource: 'synth',
                            uiClickSoundFileName: 'Стандартный тактильный клик (Синтезатор)',
                          })
                        }
                        className="text-red-400 hover:text-red-200 p-1 flex items-center gap-1 text-[10px] underline ml-2 shrink-0 cursor-pointer"
                        title="Сбросить к стандартному звуку"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Сбросить</span>
                      </button>
                    </div>
                  )}

                  {/* Volume & Test */}
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Громкость:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={cfg.uiClickSoundVolume || 0.5}
                        onChange={(e) =>
                          handleUpdateConfig({ uiClickSoundVolume: parseFloat(e.target.value) })
                        }
                        className="flex-1 max-w-[160px] accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-purple-300 font-bold text-[11px] w-8 text-right">
                        {Math.round((cfg.uiClickSoundVolume || 0.5) * 100)}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestClick}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow shrink-0 cursor-pointer ${
                        testingSoundType === 'click'
                          ? 'bg-purple-400 text-slate-950 animate-pulse'
                          : 'bg-purple-500/90 hover:bg-purple-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Тест звука</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#090d16] border-t border-slate-800 flex items-center justify-between gap-2">
          {isLeaderOrAdmin ? (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить всё по умолчанию</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => {
              if (isPlayingRadioTest) audioManager.stopReadyCheckRadio();
              onClose();
              if (onShowToast) onShowToast('Все настройки звука и загруженные файлы сохранены');
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Сохранить настройки</span>
          </button>
        </div>
      </div>
    </div>
  );
}
