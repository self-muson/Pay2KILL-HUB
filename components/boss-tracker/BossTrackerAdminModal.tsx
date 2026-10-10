'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  KeyRound,
  Eye,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  UserCheck,
  Radio,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

interface BossTrackerAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BossTrackerAdminModal({ isOpen, onClose }: BossTrackerAdminModalProps) {
  const { pinsConfig, updateAllPinsOnServer, forceLogoutAllSessions, fetchPinsConfigFromServer } = useBossTrackerStore();

  const [viewerPin, setViewerPin] = useState(pinsConfig.viewerPin || '');
  const [scoutPin, setScoutPin] = useState(pinsConfig.scoutPin || '');
  const [adminPin, setAdminPin] = useState(pinsConfig.adminPin || '');
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const cfg = useBossTrackerStore.getState().pinsConfig;
      setViewerPin(cfg.viewerPin || '');
      setScoutPin(cfg.scoutPin || '');
      setAdminPin(cfg.adminPin || '');
      setIsLoadingPins(true);
      fetchPinsConfigFromServer()
        .then((latestCfg) => {
          if (latestCfg) {
            setViewerPin(latestCfg.viewerPin || '');
            setScoutPin(latestCfg.scoutPin || '');
            setAdminPin(latestCfg.adminPin || '');
          }
        })
        .finally(() => {
          setIsLoadingPins(false);
        });
    }
  }, [isOpen, fetchPinsConfigFromServer]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showForceLogoutConfirm, setShowForceLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSavePins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerPin.trim() || !scoutPin.trim() || !adminPin.trim()) return;

    const res = await updateAllPinsOnServer({
      bossViewerPin: viewerPin.trim(),
      bossScoutPin: scoutPin.trim(),
      bossAdminPin: adminPin.trim(),
    });

    if (res.success) {
      setSaveSuccessMsg('PIN-коды успешно обновлены на сервере!');
    } else {
      setSaveSuccessMsg(`Ошибка: ${res.error || 'Не удалось сохранить'}`);
    }
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleForceLogoutAll = () => {
    forceLogoutAllSessions();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-lg bg-[#0d1017] border-2 border-amber-500/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#1c1813] via-[#2d2214] to-[#1c1813] border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-500/80 flex items-center justify-center text-amber-300 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-amber-100 uppercase tracking-wider">
                ПАНЕЛЬ УПРАВЛЕНИЯ КЛАНОМ (КЛ / АДМИН)
              </h3>
              <p className="text-[10px] text-amber-300/80 font-mono">
                Управление PIN-кодами доступа и защита от сливов инфы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1.5 text-amber-200">
            <div className="flex items-center gap-2 font-bold font-serif text-amber-300 text-xs">
              <Lock className="w-4 h-4" />
              <span>ЗАКРЫТАЯ СИСТЕМА ФИЛЬТРАЦИИ ДОСТУПА</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-100/80 font-sans">
              Пин-коды скрыты от посторонних. Игроки получают PIN только лично от КЛа или Менеджера. 
              Если в клане произошла ротация или кик, смените PIN и нажмите кнопку сброса сессий.
            </p>
          </div>

          <form onSubmit={handleSavePins} className="space-y-4">
            {/* 1. Viewer Role PIN */}
            <div className="p-3.5 rounded-xl bg-[#121622] border border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-950 border border-blue-500/50 flex items-center justify-center text-blue-400">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-200 text-xs uppercase font-sans">1. НАБЛЮДАТЕЛИ (ОБЫЧНЫЕ БОЙЦЫ)</span>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Видят только список боссов, таймеры и споты. <b>Камеры и логины скрыты.</b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={viewerPin}
                    onChange={(e) => setViewerPin(e.target.value)}
                    placeholder="PIN для зрителей (например: 1111)"
                    className="w-full pl-8 pr-3 py-1.5 bg-[#080a0f] border border-slate-700 focus:border-blue-400 rounded-lg font-mono font-bold text-blue-300 text-sm tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setViewerPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 shrink-0 border border-slate-700"
                  title="Сгенерировать случайный PIN"
                >
                  Случайный
                </button>
              </div>
            </div>

            {/* 2. Scout / Sheriff Role PIN */}
            <div className="p-3.5 rounded-xl bg-[#1c1811] border border-amber-500/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-300">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300 text-xs uppercase font-sans">2. СКАУТЫ / ШЕРИФЫ / РЕЙД-ЛИДЕРЫ</span>
                    <p className="text-[10px] text-amber-200/70 font-sans">
                      Полный доступ: <b>камеры, логины/пароли, фиксация «Убит сейчас», правка боссов.</b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={scoutPin}
                    onChange={(e) => setScoutPin(e.target.value)}
                    placeholder="PIN для скаутов (например: 1555 или 1590)"
                    className="w-full pl-8 pr-3 py-1.5 bg-[#080a0f] border border-amber-600/70 focus:border-amber-400 rounded-lg font-mono font-bold text-amber-300 text-sm tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScoutPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-[10px] font-mono text-amber-200 shrink-0 border border-amber-600/60"
                  title="Сгенерировать случайный PIN"
                >
                  Случайный
                </button>
              </div>
            </div>

            {/* 3. Admin / Clan Leader PIN */}
            <div className="p-3.5 rounded-xl bg-[#1a0f12] border border-red-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-950 border border-red-500/80 flex items-center justify-center text-red-300">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-red-200 text-xs uppercase font-sans">3. АДМИНИСТРАТОР (КЛ / ГЛАВНЫЙ МЕНЕДЖЕР)</span>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Доступ ко всем функциям + управление PIN-кодами и сброс активных сессий.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-red-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="PIN администратора (например: 7777)"
                    className="w-full pl-8 pr-3 py-1.5 bg-[#080a0f] border border-red-700/60 focus:border-red-400 rounded-lg font-mono font-bold text-red-300 text-sm tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAdminPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-[10px] font-mono text-red-200 shrink-0 border border-red-700/60"
                  title="Сгенерировать случайный PIN"
                >
                  Случайный
                </button>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500 text-emerald-200 flex items-center gap-2 font-bold text-xs animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] text-slate-950 font-bold font-serif uppercase tracking-wider text-xs shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>СОХРАНИТЬ НОВЫЕ PIN-КОДЫ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showForceLogoutConfirm) {
                    handleForceLogoutAll();
                  } else {
                    setShowForceLogoutConfirm(true);
                  }
                }}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  showForceLogoutConfirm
                    ? 'bg-red-950 text-red-200 border-red-500 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-red-400 hover:border-red-500/50'
                }`}
                title="Сбросить все активные сессии, чтобы все ввели новые PIN-коды"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{showForceLogoutConfirm ? 'ПОДТВЕРДИТЬ СБРОС ВСЕХ?' : 'СБРОСИТЬ ВСЕ СЕССИИ'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
