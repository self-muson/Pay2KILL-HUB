'use client';

import React from 'react';
import {
  Users,
  BookOpen,
  Volume2,
  VolumeX,
  Volume1,
  Plus,
  Lock,
  RefreshCw,
  Trash2,
  ScrollText,
  Flame,
  Globe,
  Crown,
  ShieldAlert,
  User,
  Skull,
  Video,
  FileText,
  Settings,
  Sliders,
  Clock,
  ShieldCheck,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Language, LANGUAGES, translations } from '@/lib/i18n';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { useAuthStore } from '@/lib/auth-store';
import { TIMEZONE_OPTIONS } from '@/lib/timezone-manager';
import { CAMERA_ACCOUNTS } from '@/lib/camera-accounts-data';

interface AllianceHeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  isAdmin: boolean;
  activeTab: 'lfg' | 'kb' | 'rules';
  setActiveTab: (tab: 'lfg' | 'kb' | 'rules') => void;
  currentApp?: 'lfg' | 'boss_tracker';
  onSwitchApp?: (app: 'lfg' | 'boss_tracker') => void;
  onOpenPlayerForm: () => void;
  onOpenGroupForm: () => void;
  onOpenClanManager: () => void;
  onOpenCharacterProfile?: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onLockPin: () => void;
  onResetDemo: () => void;
  onRefreshData?: () => void;
  activeQueueCount: number;
  activeGroupsCount: number;

  // Optional Boss Tracker Modal callbacks
  onOpenAccountsModal?: () => void;
  onOpenLogsModal?: () => void;
  onOpenSoundSettingsModal?: () => void;
  onOpenBossAdminModal?: () => void;
  onOpenNewBossModal?: () => void;
}

export function AllianceHeader({
  lang,
  setLang,
  isAdmin,
  activeTab,
  setActiveTab,
  currentApp = 'lfg',
  onSwitchApp,
  onOpenPlayerForm,
  onOpenGroupForm,
  onOpenClanManager,
  onOpenCharacterProfile,
  soundEnabled,
  setSoundEnabled,
  onLockPin,
  onResetDemo,
  onRefreshData,
  activeQueueCount,
  activeGroupsCount,

  onOpenAccountsModal,
  onOpenLogsModal,
  onOpenSoundSettingsModal,
  onOpenBossAdminModal,
  onOpenNewBossModal,
}: AllianceHeaderProps) {
  const t = translations[lang] || translations.ru;
  const { characters, activeCharacterId } = useL2SpotStore();
  const activeChar = characters.find((c) => c.id === activeCharacterId) || characters[0];

  // Load Boss Tracker states directly for zero-lag reactive display
  const {
    role,
    soundVolume,
    isMuted,
    setSoundVolume,
    toggleSoundMute,
    filterLevel,
    setFilterLevel,
    customAccounts,
    spawnAlertLogs,
  } = useBossTrackerStore();

  const {
    user,
    timezoneId,
    setTimezone,
    setIsAuthModalOpen,
    setIsAdminUsersModalOpen,
    logout,
  } = useAuthStore();

  const isBossAdmin = role === 'admin';
  const isScoutOrAdmin = role === 'scout' || role === 'admin';
  const allAccountsCount = CAMERA_ACCOUNTS.length + customAccounts.length;

  const handleNavClick = (tab: 'lfg' | 'kb' | 'rules') => {
    if (currentApp !== 'lfg' && onSwitchApp) {
      onSwitchApp('lfg');
    }
    setActiveTab(tab);
  };

  const renderNavButtons = () => {
    const isLfgAppActive = currentApp === 'lfg';
    return (
      <>
        <button
          onClick={() => handleNavClick('lfg')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            isLfgAppActive && activeTab === 'lfg'
              ? 'bg-gradient-to-r from-[#aa8222]/30 to-[#8c7241]/20 text-[#f3f4f6] border border-[#c2a363]/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="whitespace-nowrap">{t.navQueue}</span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0 inline-flex items-center">
            {activeQueueCount} / {activeGroupsCount}
          </span>
        </button>

        <button
          onClick={() => handleNavClick('kb')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            isLfgAppActive && activeTab === 'kb'
              ? 'bg-gradient-to-r from-[#aa8222]/30 to-[#8c7241]/20 text-[#f3f4f6] border border-[#c2a363]/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="whitespace-nowrap">{t.navKb}</span>
        </button>

        <button
          onClick={() => handleNavClick('rules')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
            isLfgAppActive && activeTab === 'rules'
              ? 'bg-gradient-to-r from-[#aa8222]/30 to-[#8c7241]/20 text-[#f3f4f6] border border-[#c2a363]/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="whitespace-nowrap">{t.navRules}</span>
        </button>
      </>
    );
  };

  const renderBossLevelFilters = () => {
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none font-mono">
        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1 shrink-0 hidden lg:inline">
          УРОВЕНЬ:
        </span>
        {[
          { id: 'ALL', label: 'Все боссы' },
          { id: '20-29', label: '20–29' },
          { id: '30-39', label: '30–39' },
          { id: '40-49', label: '40–49' },
          { id: '50-56', label: '50–56' },
        ].map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => setFilterLevel(lvl.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 border ${
              filterLevel === lvl.id
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.35)]'
                : 'bg-[#121622] text-slate-400 hover:text-slate-100 hover:bg-[#1a2133] border-slate-800'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-[#090b0e]/95 backdrop-blur-md border-b border-[#c2a363]/25 shadow-xl safe-area-top font-sans select-none">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        
        {/* DESKTOP & TABLET TWO-LAYER LAYOUT */}
        <div className="hidden md:flex md:flex-col py-1">
          {/* Layer 1: Brand & Top Utilities */}
          <div className="flex items-center justify-between w-full py-1.5">
            {/* Zone 1: Brand title & Badges */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#2a1d15] to-[#121620] border border-[#c2a363]/60 flex items-center justify-center text-[#e2c784] shadow-md shrink-0">
                {currentApp === 'boss_tracker' ? (
                  <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                ) : (
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="text-xs xs:text-sm sm:text-base lg:text-lg font-bold font-serif text-slate-100 tracking-wider gold-gradient-text whitespace-nowrap">
                    {currentApp === 'boss_tracker' ? 'ТАБЛИЦА БОССОВ' : t.hubTitle}
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/40 shrink-0">
                    Pay2KILL
                  </span>
                  {isAdmin && (
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/50 shadow flex items-center gap-0.5 sm:gap-1 shrink-0" title="Доступ к управлению базой и кланами">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 animate-pulse" />
                      <span className="hidden xs:inline">АДМИН</span>
                    </span>
                  )}
                  {currentApp === 'boss_tracker' && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      role === 'admin'
                        ? 'bg-red-950 border-red-700 text-red-300'
                        : role === 'scout'
                        ? 'bg-amber-950 border-amber-700 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                        : 'bg-blue-950 border-blue-900 text-blue-300'
                    }`}>
                      {role === 'admin' ? 'КЛ (АДМИН)' : role === 'scout' ? 'СКАУТ' : 'НАБЛЮДАТЕЛЬ'}
                    </span>
                  )}
                </div>
                <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[130px] xs:max-w-[190px] sm:max-w-[240px] md:max-w-xs font-mono">
                  {currentApp === 'boss_tracker' ? 'Мониторинг TOD, таймеров респауна и камер' : t.hubSubtitle}
                </p>
              </div>
            </div>

            {/* Top Row Utilities */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              {/* 1. Timezone Switcher Selector (Тумблер часовых поясов) */}
              <div
                className="relative flex items-center bg-[#10141e] border border-amber-500/40 rounded-lg px-2 py-1 min-h-[34px] shadow-sm hover:border-amber-400 transition-colors"
                title="Переключение часового пояса: время респауна и таймеры автоматически адаптируются"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                <select
                  value={timezoneId}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-transparent text-[11px] sm:text-xs text-amber-200 font-bold font-mono focus:outline-none cursor-pointer"
                  aria-label="Выбор часового пояса"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.id} value={tz.id} className="bg-[#0b0e14] text-amber-200 font-mono">
                      {tz.shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. User Account / Role Badge or Login Button */}
              {user ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenCharacterProfile}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all shadow-sm shrink-0 min-h-[34px] cursor-pointer ${
                      role === 'admin'
                        ? 'bg-red-950/80 border-red-500/80 text-amber-200 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                        : role === 'scout'
                        ? 'bg-yellow-950/80 border-yellow-400/80 text-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                        : 'bg-[#121622] border-slate-700 text-slate-200'
                    }`}
                    title="Личный профиль мембера и список персонажей"
                  >
                    {role === 'admin' ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : role === 'scout' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="font-bold truncate max-w-[85px] sm:max-w-[110px]">
                      {user.displayName || user.username}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-black/50 font-bold">
                      {role === 'admin' ? 'КЛ' : role === 'scout' ? 'СКАУТ' : 'МЕМБЕР'}
                    </span>
                  </button>

                  {/* Admin Roles Manager Trigger */}
                  {role === 'admin' && (
                    <button
                      onClick={() => setIsAdminUsersModalOpen(true)}
                      className="px-2 py-1.5 text-xs font-bold rounded-lg bg-red-950/90 text-amber-200 border border-red-500 hover:bg-red-900 transition-all flex items-center gap-1 shrink-0 min-h-[34px] cursor-pointer"
                      title="Управление ролями и кланом (раздать роли всем зарегистрированным)"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden xl:inline text-[11px]">Роли</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer min-h-[34px]"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Войти / Регистрация</span>
                    <span className="xs:hidden">Вход</span>
                  </button>

                  {onOpenCharacterProfile && (
                    <button
                      onClick={onOpenCharacterProfile}
                      className="px-2 py-1.5 rounded-lg bg-[#181d28] hover:bg-[#202736] border border-[#c2a363]/50 text-xs font-mono text-amber-200 flex items-center gap-1 transition-all min-h-[34px] cursor-pointer"
                      title="Персонажи"
                    >
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] hidden sm:inline">Персонажи ({characters.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Admin Clans Manager Button */}
              {isAdmin && (
                <button
                  onClick={onOpenClanManager}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg bg-purple-950/60 text-purple-200 border border-purple-500/40 hover:bg-purple-900/80 transition-all flex items-center gap-1 shrink-0 min-h-[34px] min-w-[34px] justify-center"
                  title="Управление кланами альянса"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden lg:inline">Кланы</span>
                </button>
              )}

              {/* Language Switcher Dropdown */}
              <div className="relative flex items-center bg-[#121620] border border-slate-800 rounded-lg px-1 sm:px-2 py-1 min-h-[34px]">
                <Globe className="w-3 h-3 text-amber-400 mr-1 hidden xs:inline-block shrink-0" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="bg-transparent text-[11px] sm:text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  aria-label="Language selection"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#121620] text-slate-200">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 sm:p-2 rounded-lg bg-[#121620] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                title="Audio"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                )}
              </button>

              {/* Safe Manual Refresh Button for all users */}
              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  className="p-1.5 sm:p-2 rounded-lg bg-[#121620] border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors shrink-0 min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                  title="Обновить списки очереди и групп"
                  aria-label="Обновить списки"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Reset Demo Data (Admin only) */}
              {isAdmin && (
                <button
                  onClick={onResetDemo}
                  className="p-1.5 sm:p-2 rounded-lg bg-red-950/40 border border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-900/60 transition-colors shrink-0 min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                  title="Сбросить к начальным данным"
                  aria-label="Reset demo"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Lock / Exit PIN Session */}
              <button
                onClick={onLockPin}
                className="p-1.5 sm:p-2 rounded-lg bg-[#121620] border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors shrink-0 min-h-[34px] min-w-[34px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                title="Заблокировать PIN сессию"
                aria-label="Lock PIN"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Layer 2: Switcher, Navigation, and Action buttons */}
          <div className="flex items-center justify-between w-full py-1.5 border-t border-slate-800/40 mt-0.5">
            {/* Left: App Switcher Tabs */}
            {onSwitchApp && (
              <div className="flex items-center p-0.5 sm:p-1 bg-[#10141e] border border-[#c2a363]/40 rounded-xl shadow-inner gap-1 shrink-0">
                <button
                  onClick={() => onSwitchApp('lfg')}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentApp === 'lfg'
                      ? 'bg-gradient-to-r from-[#94773c] to-[#c2a363] text-slate-950 shadow-md font-serif'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">LFG ХАБ</span>
                </button>
                <button
                  onClick={() => onSwitchApp('boss_tracker')}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentApp === 'boss_tracker'
                      ? 'bg-red-950 text-red-200 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)] font-serif'
                      : 'text-slate-400 hover:text-red-300'
                  }`}
                >
                  <Skull className="w-3.5 h-3.5 text-red-400" />
                  <span className="whitespace-nowrap">БОССЫ 20–56</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" title="Онлайн" />
                </button>
              </div>
            )}

            {/* Center: Navigation tabs (LFG) or Boss filters */}
            <div className="flex items-center shrink-0">
              {currentApp === 'boss_tracker' ? (
                renderBossLevelFilters()
              ) : (
                <nav className="flex items-center gap-1 bg-[#121620] p-0.5 rounded-lg border border-slate-800/60">
                  {renderNavButtons()}
                </nav>
              )}
            </div>

            {/* Right: Actions depending on the current App */}
            <div className="flex items-center gap-2">
              {currentApp === 'boss_tracker' ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Boss Tracker Audio Controls */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0d111b] border border-slate-800 text-xs font-mono">
                    <button
                      type="button"
                      onClick={toggleSoundMute}
                      className="text-slate-400 hover:text-amber-300 transition-colors p-0.5"
                      title={isMuted ? 'Включить звук' : 'Выключить звук (Mute)'}
                    >
                      {isMuted || soundVolume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                      ) : soundVolume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : soundVolume}
                      onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                      className="w-12 sm:w-16 accent-amber-400 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                    {onOpenSoundSettingsModal && (
                      <button
                        onClick={onOpenSoundSettingsModal}
                        className="p-1 rounded text-slate-400 hover:text-amber-300"
                        title="Настройка файлов звуков"
                      >
                        <Sliders className="w-3 h-3 text-amber-400" />
                      </button>
                    )}
                  </div>

                  {/* Camera Accounts */}
                  {isScoutOrAdmin && onOpenAccountsModal && (
                    <button
                      onClick={onOpenAccountsModal}
                      className="px-2 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow"
                      title="Управление общими аккаунтами камер и логинами"
                    >
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="hidden lg:inline">Аккаунты</span>
                      <span className="text-[10px] font-mono font-bold px-1 rounded bg-cyan-900 border border-cyan-400 text-cyan-100">
                        {allAccountsCount}
                      </span>
                    </button>
                  )}

                  {/* Logs */}
                  {onOpenLogsModal && (
                    <button
                      onClick={onOpenLogsModal}
                      className="px-2 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 shadow"
                      title="Журнал оповещений о респаунах боссов"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden lg:inline">Логи</span>
                      <span className="text-[10px] font-mono font-bold px-1 rounded bg-amber-900 border border-amber-400 text-amber-100">
                        {spawnAlertLogs.length}
                      </span>
                    </button>
                  )}

                  {/* Admin PIN config */}
                  {role === 'admin' && onOpenBossAdminModal && (
                    <button
                      onClick={onOpenBossAdminModal}
                      className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500 text-red-200 text-xs font-mono font-bold flex items-center gap-1 shadow"
                      title="Панель управления PIN-кодами клана"
                    >
                      <Settings className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden xl:inline">Панель PIN</span>
                    </button>
                  )}

                  {/* Add Boss */}
                  {isScoutOrAdmin && onOpenNewBossModal && (
                    <button
                      onClick={onOpenNewBossModal}
                      className="px-2 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/80 text-amber-200 text-xs font-mono font-bold flex items-center gap-1 shadow"
                      title="Добавить нового босса в таблицу"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden lg:inline">Добавить</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onOpenPlayerForm}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#aa8222] via-[#c2a363] to-[#8c7241] text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[34px]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.btnSearchParty}</span>
                  </button>

                  <button
                    onClick={onOpenGroupForm}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1a1f2c] text-amber-200 border border-[#c2a363]/30 hover:border-[#c2a363] hover:bg-[#23293a] transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[34px]"
                    title="PL 9-man Party"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{t.btnCreateParty}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE TWO-LAYER COMPACT LAYOUT */}
        <div className="flex md:hidden flex-col py-1.5 gap-1.5 w-full">
          {/* Row 1: Brand & Utilities */}
          <div className="flex items-center justify-between w-full">
            {/* Left: Mini Brand Title */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded bg-[#2a1d15] border border-[#c2a363]/60 flex items-center justify-center text-[#e2c784] shrink-0">
                {currentApp === 'boss_tracker' ? (
                  <Skull className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <span className="text-xs font-bold font-serif gold-gradient-text truncate max-w-[130px] xs:max-w-[150px]">
                {currentApp === 'boss_tracker' ? 'БОСС ТРЕКЕР' : t.hubTitle}
              </span>
            </div>

            {/* Right: Quick actions (Profile, sound, lock) */}
            <div className="flex items-center gap-1 shrink-0">
              {onOpenCharacterProfile && (
                <button
                  onClick={onOpenCharacterProfile}
                  className="p-1 rounded bg-[#181d28] border border-[#c2a363]/50 text-amber-200 flex items-center justify-center min-h-[28px] min-w-[28px]"
                  title={activeChar?.nickname || 'Профиль'}
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded bg-[#121620] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Sound"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              <button
                onClick={onLockPin}
                className="p-1 rounded bg-[#121620] border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                title="Lock"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Switcher, Level filter scroll bar, or quick LFG nav buttons */}
          <div className="flex items-center justify-between gap-2 w-full pt-1 border-t border-slate-800/40">
            {/* Left: App Switcher */}
            {onSwitchApp && (
              <div className="flex items-center p-0.5 bg-[#10141e] border border-[#c2a363]/30 rounded-lg gap-0.5 shrink-0 scale-90 sm:scale-100 origin-left">
                <button
                  onClick={() => onSwitchApp('lfg')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    currentApp === 'lfg'
                      ? 'bg-gradient-to-r from-[#94773c] to-[#c2a363] text-slate-950 font-serif'
                      : 'text-slate-400'
                  }`}
                >
                  LFG
                </button>
                <button
                  onClick={() => onSwitchApp('boss_tracker')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    currentApp === 'boss_tracker'
                      ? 'bg-red-950 text-red-200 border border-red-500 font-serif'
                      : 'text-slate-400'
                  }`}
                >
                  Боссы
                </button>
              </div>
            )}

            {/* Right: Contextual scroll area */}
            <div className="flex-1 overflow-x-auto scrollbar-none flex justify-end">
              {currentApp === 'boss_tracker' ? (
                <div className="flex items-center gap-1 pl-1">
                  {[
                    { id: 'ALL', label: 'Все' },
                    { id: '20-29', label: '20–29' },
                    { id: '30-39', label: '30–39' },
                    { id: '40-49', label: '40–49' },
                    { id: '50-56', label: '50–56' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setFilterLevel(lvl.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        filterLevel === lvl.id
                          ? 'bg-amber-500 text-slate-950 font-serif border border-amber-400'
                          : 'bg-[#121622] text-slate-400 hover:text-slate-100 border border-slate-800'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 pl-1 origin-right scale-90">
                  {renderNavButtons()}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
