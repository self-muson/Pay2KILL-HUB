'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  UserPlus,
  Clock,
  UserCheck,
  Flame,
  Swords,
  LogOut,
  ChevronDown,
  Shield,
  Plus,
  Skull,
  Edit3,
} from 'lucide-react';
import { L2Boss, BossState, UserCharacter } from '@/lib/l2-spot-types';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { L2TakeSpotModal } from './L2TakeSpotModal';

interface L2BossCardProps {
  boss: L2Boss;
}

export function L2BossCard({ boss }: L2BossCardProps) {
  const {
    characters,
    activeCharacterId,
    takeSpotWithCharacter,
    leaveSpot,
    reportSpawn,
    reportPvp,
    markBossKilled,
    setBossState,
    setBossTimeOfDeath,
  } = useL2SpotStore();

  const [isTakeModalOpen, setIsTakeModalOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isCharSelectOpen, setIsCharSelectOpen] = useState(false);

  // Status visual configurations
  const getStatusBadge = (status: BossState) => {
    switch (status) {
      case 'ALIVE':
        return {
          label: '🔥 РЕСНУЛСЯ',
          bg: 'bg-red-600/90 text-amber-100 border-amber-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse',
        };
      case 'WINDOW_OPEN':
        return {
          label: '⚡ ОКНО ОТКРЫТО',
          bg: 'bg-amber-600/90 text-amber-950 border-amber-300 font-bold',
        };
      case 'PVP_ENGAGED':
        return {
          label: '⚔️ ИДЕТ ПВП',
          bg: 'bg-purple-700/90 text-purple-100 border-purple-400 animate-pulse',
        };
      case 'DEAD':
        return {
          label: '⏳ УБИТ / КД',
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
        };
    }
  };

  const statusConfig = getStatusBadge(boss.status);

  // Archetype Badge Color
  const getArchetypeColor = (archetype?: string) => {
    switch (archetype) {
      case 'ARCHER':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40';
      case 'DAGGER':
        return 'text-amber-400 bg-amber-950/70 border-amber-500/40';
      case 'SUPPORT':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40';
      case 'WARRIOR':
        return 'text-red-400 bg-red-950/70 border-red-500/40';
      case 'TANK':
        return 'text-blue-400 bg-blue-950/70 border-blue-500/40';
      case 'MAGE':
        return 'text-purple-400 bg-purple-950/70 border-purple-500/40';
      default:
        return 'text-slate-300 bg-slate-900 border-slate-700';
    }
  };

  const activeChar =
    characters.find((c) => c.id === activeCharacterId) || characters[0];

  const handleSelectCharacter = (char: UserCharacter) => {
    takeSpotWithCharacter(boss.id, char.id);
    setIsCharSelectOpen(false);
  };

  return (
    <>
      <div
        className={`relative flex flex-col bg-[#10131a] rounded-xl border p-3.5 shadow-xl transition-all duration-200 select-none group ${
          boss.status === 'ALIVE'
            ? 'border-red-500/90 shadow-[0_0_25px_rgba(239,68,68,0.4)] ring-1 ring-red-500/40'
            : boss.status === 'PVP_ENGAGED'
            ? 'border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : boss.status === 'WINDOW_OPEN'
            ? 'border-[#c2a363]/60 hover:border-[#c2a363] shadow-md'
            : 'border-slate-800 hover:border-slate-700 opacity-90 hover:opacity-100'
        }`}
      >
        {/* 1. TOP: Boss Name & Level */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-serif font-black text-amber-100 text-sm tracking-wide truncate uppercase">
              {boss.name}
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono font-bold text-xs shrink-0 shadow-sm">
            Lv {boss.level}
          </span>
        </div>

        {/* 2. MIDDLE: Boss Avatar + Respawn Window / Status */}
        <div className="flex items-center gap-3 mb-3">
          {/* Boss Avatar */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-[#c2a363]/60 bg-black shrink-0 shadow-md">
            <Image
              src={boss.image}
              alt={boss.name}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Respawn Window & Status */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 font-mono">
            {/* Status badge with menu toggle */}
            <div className="flex items-center justify-between gap-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${statusConfig.bg}`}
              >
                {statusConfig.label}
              </span>

              <div className="relative">
                <button
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className="p-1 rounded bg-[#181d28] hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Изменить статус"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isStatusMenuOpen && (
                  <div className="absolute right-0 top-6 w-40 bg-[#0c1016] border border-[#c2a363]/60 rounded-lg shadow-2xl p-1 z-30 font-mono text-[10px] flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        setBossState(boss.id, 'WINDOW_OPEN');
                        setIsStatusMenuOpen(false);
                      }}
                      className="px-2 py-1 text-left text-amber-300 hover:bg-amber-950/40 rounded transition-colors"
                    >
                      • ОКНО ОТКРЫТО
                    </button>
                    <button
                      onClick={() => {
                        reportSpawn(boss.id);
                        setIsStatusMenuOpen(false);
                      }}
                      className="px-2 py-1 text-left text-red-300 font-bold hover:bg-red-950/50 rounded transition-colors"
                    >
                      • РЕСНУЛСЯ!
                    </button>
                    <button
                      onClick={() => {
                        reportPvp(boss.id);
                        setIsStatusMenuOpen(false);
                      }}
                      className="px-2 py-1 text-left text-purple-300 hover:bg-purple-950/40 rounded transition-colors"
                    >
                      • ИДЕТ ПВП
                    </button>
                    <button
                      onClick={() => {
                        markBossKilled(boss.id);
                        setIsStatusMenuOpen(false);
                      }}
                      className="px-2 py-1 text-left text-slate-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      • УБИТ (КД)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Respawn Window */}
            <div className="flex items-center gap-1.5 text-xs text-amber-200/90 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {boss.windowStart} – {boss.windowEnd}
              </span>
            </div>

            {/* Time of Death (Время смерти из таблицы Google Диска) */}
            <div className="flex items-center justify-between text-[10px] bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/30 text-red-200">
              <div className="flex items-center gap-1 font-bold truncate">
                <Skull className="w-3 h-3 text-red-400 shrink-0" />
                <span className="text-slate-400">Убит:</span>
                <span className="text-amber-200 font-mono font-black">{boss.timeOfDeath || '—'}</span>
              </div>
              <button
                onClick={() => {
                  const val = prompt(`Введите время смерти для ${boss.name} (ЧЧ:ММ):`, boss.timeOfDeath || '14:20');
                  if (val && val.trim()) setBossTimeOfDeath(boss.id, val.trim());
                }}
                className="text-slate-400 hover:text-amber-300 p-0.5 ml-1 transition-colors"
                title="Редактировать время смерти"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>
            </div>

            <span className="text-[10px] text-slate-400 truncate">
              {boss.location}
            </span>
          </div>
        </div>

        {/* 3. BOTTOM: Minimal Character Slot (Ячейка персонажа) */}
        {boss.spotter ? (
          /* OCCUPIED SPOT */
          <div className="rounded-lg bg-[#141924] border border-[#c2a363]/50 p-2 shadow-inner flex flex-col gap-1.5 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs border shrink-0 ${getArchetypeColor(
                    boss.spotter.classArchetype
                  )}`}
                  title={boss.spotter.gearSummary || boss.spotter.classArchetype}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-serif font-black text-xs text-amber-100 truncate">
                      {boss.spotter.nickname}
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold">
                      {boss.spotter.approxLevel ? `Ур. ${boss.spotter.approxLevel}` : `Lv ${boss.spotter.level}`}
                    </span>
                  </div>
                  <span
                    className="text-[10px] text-slate-400 block truncate"
                    title={boss.spotter.gearSummary || boss.spotter.className}
                  >
                    {boss.spotter.className}
                  </span>
                </div>
              </div>

              {/* Quick Actions for active scout */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => reportSpawn(boss.id)}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded shadow transition-colors"
                  title="Босс реснулся! Оповестить саппортов и КК"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200" />
                </button>
                <button
                  onClick={() => reportPvp(boss.id)}
                  className="p-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded shadow transition-colors"
                  title="ПВП враги на споте"
                >
                  <Swords className="w-3.5 h-3.5 text-purple-200" />
                </button>
                <button
                  onClick={() => leaveSpot(boss.id)}
                  className="p-1.5 bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 rounded border border-slate-700 transition-colors"
                  title="Освободить спот"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* EMPTY SPOT (Slot waiting for character with selector) */
          <div className="relative">
            <button
              onClick={() => setIsCharSelectOpen(!isCharSelectOpen)}
              className="w-full rounded-lg bg-[#0e121a] hover:bg-[#151b26] border border-dashed border-[#c2a363]/40 hover:border-[#c2a363] p-2 flex items-center justify-between text-left transition-all group/slot cursor-pointer"
              title="Занять ячейку персонажем из личного кабинета"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded bg-[#181f2c] border border-slate-700 flex items-center justify-center text-slate-400 group-hover/slot:text-amber-300 transition-colors shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div className="font-mono min-w-0 truncate">
                  <span className="text-xs text-slate-300 group-hover/slot:text-amber-200 font-medium block">
                    Встать на спот
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {activeChar.nickname} ({activeChar.approxLevel})
                  </span>
                </div>
              </div>

              <span className="px-2 py-1 rounded bg-[#1b2230] text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30 shrink-0">
                ВЫБРАТЬ
              </span>
            </button>

            {/* Quick Character Picker Dropdown */}
            {isCharSelectOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-[#0d1118] border-2 border-[#c2a363] rounded-xl shadow-2xl p-2 z-40 font-mono text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 text-[11px] text-[#c2a363] font-bold">
                  <span>ВЫБЕРИТЕ ПЕРСОНАЖА:</span>
                  <button
                    onClick={() => setIsCharSelectOpen(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="w-full text-left p-1.5 rounded hover:bg-[#1a2232] border border-transparent hover:border-[#c2a363]/50 flex items-center justify-between gap-1 transition-colors group/item"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-amber-200 group-hover/item:text-amber-100 truncate">
                            {char.nickname}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Ур. {char.approxLevel})
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 block truncate">
                          {char.className} · {char.gearSummary}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 group-hover/item:text-emerald-400">
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal if custom character needed */}
      {isTakeModalOpen && (
        <L2TakeSpotModal boss={boss} onClose={() => setIsTakeModalOpen(false)} />
      )}
    </>
  );
}
