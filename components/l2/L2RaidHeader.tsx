'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  Crown,
  Search,
  User,
  Clock,
  Flame,
  Radio,
  RotateCcw,
  Sparkles,
  Database,
  Cloud,
} from 'lucide-react';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { l2Audio } from '@/lib/l2-audio';
import { L2CharacterProfileModal } from './L2CharacterProfileModal';
import { L2GoogleDriveModal } from './L2GoogleDriveModal';

export function L2RaidHeader() {
  const {
    bosses,
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    myCharacter,
    characters,
    activeCharacterId,
    isRaidLeader,
    setIsRaidLeader,
    resetToDefaults,
    isDriveConnected,
    driveUserEmail,
  } = useL2SpotStore();

  const [soundOn, setSoundOn] = useState(() => (typeof window !== 'undefined' ? l2Audio.isEnabled() : true));
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [serverTime, setServerTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setServerTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    l2Audio.setEnabled(next);
    setSoundOn(next);
  };

  // Metrics
  const totalBosses = bosses.length;
  const aliveCount = bosses.filter((b) => b.status === 'ALIVE').length;
  const windowOpenCount = bosses.filter((b) => b.status === 'WINDOW_OPEN').length;
  const needScoutCount = bosses.filter((b) => b.spotter === null && b.status !== 'DEAD').length;
  const occupiedCount = bosses.filter((b) => b.spotter !== null).length;

  return (
    <>
      <header className="relative w-full bg-[#0d1017] border-b-2 border-[#c2a363]/50 shadow-2xl select-none z-20">
        {/* Top Metallic Filigree Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c2a363] to-transparent opacity-90" />

        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Lineage 2 Brand & Realm */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#3d2e17] via-[#211a10] to-[#120e09] border border-[#c2a363] flex items-center justify-center text-[#c2a363] shadow-md">
                <Crown className="w-5 h-5 text-amber-300" />
                {aliveCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-black text-base tracking-wider text-amber-100 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    PAY2KILL // РЕЙД-СПОТЫ
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold">
                    L2 UE5
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Контроль спотов эпик-боссов и вызов Командного Канала
                </p>
              </div>
            </div>

            {/* Mobile Server Clock */}
            <div className="md:hidden flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-black/50 px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{serverTime}</span>
            </div>
          </div>

          {/* Center: Search Boss */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-amber-400/70 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск босса или локации..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#080b0f] border border-[#c2a363]/40 rounded-md text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono shadow-inner"
            />
          </div>

          {/* Right: Controls (Character Profile, RL toggle, Sound, Clock) */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* My Character Profile button (Личный Кабинет) */}
            <button
              onClick={() => setIsCharModalOpen(true)}
              className="px-2.5 py-1.5 rounded-md bg-[#181d28] hover:bg-[#202736] border border-[#c2a363]/40 text-xs font-mono text-amber-200 flex items-center gap-1.5 transition-all shadow-sm"
              title="Личный кабинет: выбор и настройка персонажей"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold truncate max-w-[90px] sm:max-w-[120px]">
                {characters.find((c) => c.id === activeCharacterId)?.nickname || myCharacter.nickname || 'Персонажи'}
              </span>
              <span className="text-[10px] text-amber-400/80 hidden sm:inline">
                ({characters.find((c) => c.id === activeCharacterId)?.approxLevel || `Lv${myCharacter.level}`})
              </span>
              <span className="px-1 rounded bg-amber-950/70 border border-amber-500/40 text-[9px] text-amber-300 font-bold hidden md:inline" title="Количество персонажей в профиле">
                {characters.length}
              </span>
            </button>

            {/* Google Drive Database Sync Button */}
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isDriveConnected
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                  : 'bg-[#181d28] hover:bg-[#202736] border-[#c2a363]/40 text-amber-200'
              }`}
              title="Синхронизация базы данных с Google Диском"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">GOOGLE ДИСК (БД)</span>
              <span className="sm:hidden">БД ДИСК</span>
              {isDriveConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Raid Leader Mode Switch */}
            <button
              onClick={() => setIsRaidLeader(!isRaidLeader)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                isRaidLeader
                  ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Переключить права Рейд-Лидера (РЛ / Скаут)"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">РЕЖИМ:</span>
              <span>{isRaidLeader ? 'РЛ' : 'СКАУТ'}</span>
            </button>

            {/* War Horn Audio Switch */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded-md border transition-all ${
                soundOn
                  ? 'bg-amber-950/70 border-amber-400 text-amber-300'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title={soundOn ? 'Звук горна включен' : 'Звук горна выключен'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Desktop Server Clock */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-black/60 px-2.5 py-1.5 rounded-md border border-[#c2a363]/40 shadow-inner">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{serverTime}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar (No Pills, clean segmented tabs) */}
        <div className="border-t border-slate-800/80 bg-[#090c12] px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto text-xs font-mono">
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded transition-colors ${
                  filterStatus === 'ALL'
                    ? 'bg-[#1e2432] text-amber-100 font-bold border border-[#c2a363]/50 shadow-sm'
                    : 'text-slate-400 hover:text-amber-200'
                }`}
              >
                ВСЕ БОССЫ ({totalBosses})
              </button>

              <button
                onClick={() => setFilterStatus('ALIVE')}
                className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                  filterStatus === 'ALIVE'
                    ? 'bg-red-950/80 text-red-200 font-bold border border-red-500/60 shadow-sm'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                <Flame className="w-3 h-3 text-red-400" />
                <span>РЕСНУЛИСЬ! ({aliveCount})</span>
              </button>

              <button
                onClick={() => setFilterStatus('WINDOW_OPEN')}
                className={`px-3 py-1 rounded transition-colors ${
                  filterStatus === 'WINDOW_OPEN'
                    ? 'bg-amber-950/70 text-amber-200 font-bold border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                ОКНО ОТКРЫТО ({windowOpenCount})
              </button>

              <button
                onClick={() => setFilterStatus('NEED_SCOUT')}
                className={`px-3 py-1 rounded transition-colors ${
                  filterStatus === 'NEED_SCOUT'
                    ? 'bg-yellow-950/60 text-yellow-200 font-bold border border-yellow-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-yellow-300'
                }`}
              >
                НУЖЕН СКАУТ ({needScoutCount})
              </button>

              <button
                onClick={() => setFilterStatus('ON_DUTY')}
                className={`px-3 py-1 rounded transition-colors ${
                  filterStatus === 'ON_DUTY'
                    ? 'bg-emerald-950/60 text-emerald-200 font-bold border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                НА ДЕЖУРСТВЕ ({occupiedCount})
              </button>
            </div>

            {/* Reset button */}
            <button
              onClick={resetToDefaults}
              className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors shrink-0"
              title="Сбросить к исходным данным рейда"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сброс</span>
            </button>
          </div>
        </div>
      </header>

      {/* Character Profile Modal */}
      {isCharModalOpen && <L2CharacterProfileModal onClose={() => setIsCharModalOpen(false)} />}

      {/* Google Drive Database Sync Modal */}
      {isDriveModalOpen && <L2GoogleDriveModal onClose={() => setIsDriveModalOpen(false)} />}
    </>
  );
}
