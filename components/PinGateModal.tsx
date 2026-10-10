'use client';

import React, { useState } from 'react';
import { Shield, Lock, Key, AlertCircle } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

interface PinGateModalProps {
  onSuccess: (role: 'member' | 'scout' | 'admin', isAdmin: boolean, isScout: boolean) => void;
  lang?: Language;
}

export function PinGateModal({ onSuccess, lang = 'ru' }: PinGateModalProps) {
  const t = translations[lang] || translations.ru;
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 8) {
      setPinInput((prev) => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPinInput('');
    setError('');
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { verifyPin } = useBossTrackerStore.getState();
      const res = await verifyPin(pinInput.trim());

      if (res.success) {
        const unifiedRole = (res.role === 'admin' ? 'admin' : res.role === 'scout' ? 'scout' : 'member') as 'member' | 'scout' | 'admin';
        onSuccess(unifiedRole, res.role === 'admin', res.role === 'scout' || res.role === 'admin');
      } else {
        setError(res.message || t.pinError || 'Неверный PIN-код. Обратитесь к КЛу за актуальным кодом.');
      }
    } catch {
      setError('Connection error / Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-sm p-5 card-fantasy rounded-2xl border-2 border-[#c2a363]/80 shadow-[0_0_50px_rgba(194,163,99,0.3)] relative overflow-hidden flex flex-col">
        {/* Background Decorative Element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#c2a363]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#1a1f2c] border border-[#c2a363] mb-2 text-[#e2c784] shadow-lg">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#f3f4f6] tracking-wide gold-gradient-text">
            {t.allianceGateTitle}
          </h2>
          <p className="text-xs text-amber-300/80 font-mono mt-0.5">
            Pay2KILL Alliance // Закрытая система
          </p>
          <div className="mt-2 text-[11px] text-slate-300 bg-amber-950/40 border border-amber-500/30 rounded-lg py-1.5 px-3 text-left space-y-1">
            <p className="font-bold text-amber-200">Роли по коду доступа:</p>
            <p className="text-slate-300 leading-tight">
              • <b>Клан мембер</b> — поиск пати, таблица боссов, трибуна, занятие спота<br/>
              • <b>Скаут / РЛ</b> — палилки, TOD, оповещения, Ready Check<br/>
              • <b>КЛ</b> — полный доступ и управление PIN-кодами
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setError('');
                }}
                placeholder="• • • •"
                className="w-full px-4 py-2.5 bg-[#080a0f] border border-[#8c7241]/60 focus:border-[#c2a363] rounded-xl text-center text-2xl font-mono text-amber-300 tracking-[0.4em] focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-inner"
                autoFocus
              />
              <Key className="absolute right-3 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 text-[11px] bg-red-950/60 border border-red-500/50 text-red-300 rounded-lg animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-1.5 font-mono text-base font-bold select-none pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-2.5 rounded-xl bg-[#121622] hover:bg-[#1b2234] active:scale-95 border border-slate-700/80 text-amber-100 shadow-sm transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-[#1a1412] hover:bg-[#251b18] active:scale-95 border border-amber-900/60 text-slate-400 text-xs font-sans transition-all"
            >
              Сброс
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 rounded-xl bg-[#121622] hover:bg-[#1b2234] active:scale-95 border border-slate-700/80 text-amber-100 shadow-sm transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-[#1a1412] hover:bg-[#251b18] active:scale-95 border border-amber-900/60 text-slate-300 flex items-center justify-center transition-all text-xs font-sans"
            >
              Стереть
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !pinInput}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#aa8222] via-[#c2a363] to-[#8c7241] text-slate-950 font-bold font-serif rounded-xl hover:brightness-110 active:scale-[0.99] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? t.verifying : t.enterPinBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
