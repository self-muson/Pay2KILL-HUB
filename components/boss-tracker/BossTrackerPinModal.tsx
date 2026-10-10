'use client';

import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  CheckCircle,
  Shield,
  HelpCircle,
  Delete,
  ShieldAlert,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

export function BossTrackerPinModal() {
  const { verifyPin } = useBossTrackerStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError('Введите PIN-код для входа');
      return;
    }
    setIsSubmitting(true);
    const res = await verifyPin(pin.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || 'Неверный PIN-код доступа. Обратитесь к КЛу или Менеджеру.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#05070a]/95 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-sm bg-[#0d1017] border-2 border-[#c2a363]/80 rounded-2xl shadow-[0_0_60px_rgba(194,163,99,0.25)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#1c1813] via-[#2d2315] to-[#1c1813] border-b border-[#c2a363]/40 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-[#362714] border border-[#c2a363] flex items-center justify-center text-amber-300 shadow-lg ring-2 ring-amber-500/20">
            <Lock className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-serif text-amber-100 uppercase tracking-wider">
              ЗАКРЫТЫЙ ТРЕКЕР БОССОВ
            </h2>
            <p className="text-[11px] text-amber-300/80 font-mono mt-0.5">
              Система мониторинга респаунов // Pay2KILL
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="text-center space-y-1.5">
            <p className="text-xs text-slate-300 font-medium">
              Для доступа введите персональный PIN-код клана:
            </p>
            <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed text-left flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                У вас нет кода? Обратитесь к <b>Лидеру клана (КЛу)</b> или <b>Менеджеру</b> для получения доступа.
              </span>
            </div>
          </div>

          {/* PIN Input Field */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                maxLength={8}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="• • • •"
                className="w-full pl-10 pr-3 py-3 bg-[#06080d] border border-slate-700 focus:border-[#c2a363] focus:ring-1 focus:ring-amber-400/50 rounded-xl text-center text-lg tracking-[0.4em] font-mono font-black text-amber-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-slate-600 focus:outline-none shadow-inner"
              />
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/50 text-center text-[11px] text-red-300 font-sans font-medium animate-pulse">
                {error}
              </div>
            )}

            {/* Tactile Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-base font-bold select-none">
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
                title="Очистить"
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
                className="py-2.5 rounded-xl bg-[#1a1412] hover:bg-[#251b18] active:scale-95 border border-amber-900/60 text-slate-300 flex items-center justify-center transition-all"
                title="Стереть"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 active:scale-98 text-slate-950 font-serif font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>ВОЙТИ В СИСТЕМУ</span>
            </button>
          </form>

          {/* Security Disclaimer */}
          <div className="text-center text-[10px] text-slate-500 font-mono pt-1">
            Защищенный протокол клана // Не передавайте PIN посторонним
          </div>
        </div>
      </div>
    </div>
  );
}
