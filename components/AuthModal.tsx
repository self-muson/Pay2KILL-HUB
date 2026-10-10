'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  KeyRound,
  Shield,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'pin'>('login');

  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regClanName, setRegClanName] = useState('Pay2KILL');
  const [regDiscordTag, setRegDiscordTag] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  // Fast PIN form
  const [pinCode, setPinCode] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuthStore();
  const { verifyPin } = useBossTrackerStore();

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await login(loginUsername, loginPassword);
      if (res.success) {
        if (onSuccess) onSuccess(`Добро пожаловать, ${loginUsername}!`);
        onClose();
      } else {
        setErrorMsg(res.error || 'Ошибка входа');
      }
    } catch (err) {
      setErrorMsg('Ошибка связи с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await register({
        username: regUsername,
        password: regPassword,
        displayName: regDisplayName || regUsername,
        clanName: regClanName,
        discordTag: regDiscordTag,
        inviteCode: regInviteCode,
      });

      if (res.success) {
        if (onSuccess) onSuccess(`Аккаунт ${regUsername} успешно создан!`);
        onClose();
      } else {
        setErrorMsg(res.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setErrorMsg('Ошибка связи с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await verifyPin(pinCode);
      if (res.success) {
        if (onSuccess) onSuccess(res.message || 'Вход по PIN выполнен');
        onClose();
      } else {
        setErrorMsg(res.message || 'Неверный PIN-код');
      }
    } catch (err) {
      setErrorMsg('Ошибка связи с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0a0d14] border border-[#c2a363]/40 rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400/50 flex items-center justify-center text-amber-200 shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-serif text-amber-100 uppercase tracking-wide">
                Pay2KILL АВТОРИЗАЦИЯ
              </h2>
              <p className="text-[10px] text-slate-400">
                Вход в альянс-хаб, личный профиль и роли
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#080b11] text-xs font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'bg-[#121826] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1018]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Вход</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'bg-[#121826] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1018]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Регистрация</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('pin'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'pin'
                ? 'bg-[#121826] text-amber-300 border-b-2 border-amber-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0c1018]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Быстрый PIN</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Логин пользователя
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Например: muson"
                    className="w-full pl-9 pr-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Проверка...' : 'Войти в систему'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Логин для входа <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Уникальный логин (min 3 буквы)"
                  className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Пароль <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Пароль для аккаунта"
                  className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ник основного персонажа / Отображаемое имя
                </label>
                <input
                  type="text"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="Например: Spectre_SR"
                  className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Клан
                  </label>
                  <input
                    type="text"
                    value={regClanName}
                    onChange={(e) => setRegClanName(e.target.value)}
                    placeholder="Pay2KILL"
                    className="w-full px-2.5 py-1.5 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Discord / Telegram
                  </label>
                  <input
                    type="text"
                    value={regDiscordTag}
                    onChange={(e) => setRegDiscordTag(e.target.value)}
                    placeholder="@discord_nick"
                    className="w-full px-2.5 py-1.5 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Код приглашения клана (опционально)
                </label>
                <input
                  type="text"
                  value={regInviteCode}
                  onChange={(e) => setRegInviteCode(e.target.value)}
                  placeholder="PIN код (1555 для Скаута, 1234 для КЛа)"
                  className="w-full px-3 py-1.5 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
                <span className="text-[9px] text-slate-500">
                  Позволяет сразу получить роль Скаута или КЛа, либо КЛ выдаст роль в админ-панели
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Регистрация...' : 'Зарегистрироваться'}</span>
                <UserPlus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: PIN GUEST LOGIN */}
          {tab === 'pin' && (
            <form onSubmit={handlePinSubmit} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                💡 Быстрый гостевой доступ по альянс-коду без ввода пароля.
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Альянс PIN-код
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Например: 1111 / 1555 / 1234"
                    className="w-full pl-9 pr-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Проверка...' : 'Войти по PIN-коду'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
