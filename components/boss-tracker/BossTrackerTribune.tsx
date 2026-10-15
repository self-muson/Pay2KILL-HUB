'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Shield,
  PawPrint,
  Heart,
  Sword,
  Crosshair,
  Sparkles,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Crown,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useAuthStore } from '@/lib/auth-store';

export function BossTrackerTribune() {
  const { spectators, syncUserCharacterToSpectator, role, kickSpectator } = useBossTrackerStore();
  const { characters, activeCharacterId } = useL2SpotStore();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const active =
    characters.find((c) => c.id === activeCharacterId) ||
    characters.find((c) => c.isMain) ||
    characters[0];

  const nick = active?.nickname || user?.displayName || user?.username || 'Клан мембер';
  const cls = active?.className || (role === 'admin' ? 'Warlock (Котовод)' : role === 'scout' ? 'Silver Ranger' : 'Watcher');
  const lvl = active?.levelNumber || 75;
  const clan = active?.clanName || user?.clanName || 'Pay2KILL';

  // Sync user's active character or account name to the tribune with steady heartbeat
  useEffect(() => {
    const sendHeartbeat = () => {
      void useBossTrackerStore.getState().syncUserCharacterToSpectator({
        nickname: nick,
        className: cls,
        level: lvl,
        clanName: clan,
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [nick, cls, lvl, clan]);

  const renderClassIcon = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.includes('warlock') || lower.includes('summoner') || lower.includes('кот') || lower.includes('конь') || lower.includes('тень')) {
      return <PawPrint className="w-3.5 h-3.5 text-amber-300" />;
    }
    if (lower.includes('bishop') || lower.includes('cleric') || lower.includes('elder') || lower.includes('prophet') || lower.includes('warcryer')) {
      return <Heart className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (lower.includes('knight') || lower.includes('paladin') || lower.includes('avenger')) {
      return <Shield className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (lower.includes('ranger') || lower.includes('scout') || lower.includes('hawkeye')) {
      return <Crosshair className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (lower.includes('sorcerer') || lower.includes('spellsinger') || lower.includes('spellhowler') || lower.includes('necro')) {
      return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <Sword className="w-3.5 h-3.5 text-red-400" />;
  };

  return (
    <div className="bg-[#0b0e14] border border-[#c2a363]/30 rounded-xl p-3 sm:p-4 shadow-lg select-none space-y-2.5">
      {/* Tribune Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-md shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold font-serif text-amber-100 uppercase tracking-wide">
                ТРИБУНА НАБЛЮДАТЕЛЕЙ
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {spectators.length} онлайн
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Клан мемберы, которые прямо сейчас следят за фазами респауна боссов
            </p>
          </div>
        </div>

        {/* Role breakdown chips in header */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
          <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/60 text-red-200 font-bold flex items-center gap-1 shadow-sm">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>КЛ: {spectators.filter((s) => (s.isMe && role === 'admin') || (!s.isMe && s.role === 'LEADER')).length}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-yellow-950/80 border border-yellow-400 text-yellow-300 font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(250,204,21,0.35)]">
            <ShieldCheck className="w-3 h-3 text-yellow-400" />
            <span>СКАУТЫ: {spectators.filter((s) => (s.isMe && role === 'scout') || (!s.isMe && s.role === 'SPOTTER')).length}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-bold flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>НАБЛЮДАТЕЛИ: {spectators.filter((s) => !((s.isMe && role === 'admin') || (!s.isMe && s.role === 'LEADER')) && !((s.isMe && role === 'scout') || (!s.isMe && s.role === 'SPOTTER'))).length}</span>
          </span>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors sm:hidden ml-1"
            aria-label="Toggle tribune"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tribune Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
          {[...spectators]
            .sort((a, b) => {
              const aIsCL = (a.isMe && role === 'admin') || (!a.isMe && a.role === 'LEADER');
              const bIsCL = (b.isMe && role === 'admin') || (!b.isMe && b.role === 'LEADER');
              if (aIsCL && !bIsCL) return -1;
              if (!aIsCL && bIsCL) return 1;

              const aIsScout = (a.isMe && role === 'scout') || (!a.isMe && a.role === 'SPOTTER');
              const bIsScout = (b.isMe && role === 'scout') || (!b.isMe && b.role === 'SPOTTER');
              if (aIsScout && !bIsScout) return -1;
              if (!aIsScout && bIsScout) return 1;

              return 0;
            })
            .map((spec) => {
              const isMe = spec.isMe;
              const isClanLeader = (isMe && role === 'admin') || (!isMe && spec.role === 'LEADER');
              const isScout = (isMe && role === 'scout') || (!isMe && spec.role === 'SPOTTER');
              const isViewer = !isClanLeader && !isScout;

              const roleLabel = isClanLeader ? 'КЛ' : isScout ? 'СКАУТ' : 'НАБЛЮДАТЕЛЬ';

              return (
                <div
                  key={spec.id}
                  className={`p-2 rounded-xl text-left flex flex-col gap-1 transition-all relative overflow-hidden ${
                    isClanLeader
                      ? 'bg-gradient-to-b from-[#2e1518] via-[#1c0f12] to-[#12090b] border-2 border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.35)] ring-1 ring-amber-400/40'
                      : isScout
                      ? 'bg-gradient-to-b from-[#2d2208] via-[#1f1705] to-[#120e03] border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6)] ring-1 ring-yellow-400/50'
                      : isMe
                      ? 'bg-[#151c27] border border-cyan-500/60'
                      : 'bg-[#0e121a] border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Clan status top banner */}
                  {isClanLeader ? (
                    <div className="flex items-center justify-between text-[9px] font-bold text-amber-200 font-mono pb-1 border-b border-red-500/40">
                      <span className="flex items-center gap-1 text-amber-300">
                        <Crown className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.9)]" />
                        <span className="tracking-wider uppercase font-black">
                          КЛ
                        </span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" title="КЛ Онлайн" />
                    </div>
                  ) : isScout ? (
                    <div className="flex items-center justify-between text-[9px] font-bold text-yellow-300 font-mono pb-1 border-b border-yellow-500/40">
                      <span className="flex items-center gap-1 text-yellow-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
                        <span className="tracking-wider uppercase font-black">
                          СКАУТ
                        </span>
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" title="Скаут Онлайн" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pb-0.5 border-b border-slate-800/40">
                      <span className="uppercase text-[8px] text-slate-400 font-bold">НАБЛЮДАТЕЛЬ</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" title="В сети" />
                    </div>
                  )}

                  {/* Nick & Badge */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span
                      className={`text-[11px] truncate max-w-[85px] ${
                        isClanLeader
                          ? 'text-amber-100 font-black tracking-wide drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                          : isScout
                          ? 'text-yellow-100 font-black tracking-wide drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]'
                          : 'text-slate-200 font-semibold'
                      }`}
                      title={spec.nickname}
                    >
                      {spec.nickname}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black shrink-0 shadow-sm">
                        ВЫ
                      </span>
                    )}
                  </div>

                  {/* Class & Level */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-300 truncate">
                    {renderClassIcon(spec.className)}
                    <span className="truncate">{spec.className}</span>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        isClanLeader ? 'text-amber-300' : isScout ? 'text-yellow-300' : 'text-slate-400'
                      }`}
                    >
                      {spec.level}
                    </span>
                  </div>

                  {/* Clan tag & role */}
                  <div
                    className={`flex items-center justify-between text-[9px] font-mono pt-1 border-t ${
                      isClanLeader
                        ? 'border-red-900/60 text-amber-300'
                        : isScout
                        ? 'border-yellow-900/60 text-yellow-300'
                        : 'border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <span className="truncate">[{spec.clanName}]</span>
                    <span
                      className={`font-bold ${
                        isClanLeader
                          ? 'text-amber-300 font-black'
                          : isScout
                          ? 'text-yellow-400 font-black'
                          : 'text-slate-400'
                      }`}
                    >
                      {roleLabel}
                    </span>
                  </div>

                  {/* Kick spectator button (ADMIN ONLY, not on self) */}
                  {role === 'admin' && !isMe && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        kickSpectator(spec.id);
                      }}
                      className="mt-0.5 w-full py-0.5 rounded bg-red-950/90 hover:bg-red-900 border border-red-700/80 hover:border-red-500 text-red-300 hover:text-red-100 text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                      title={`Выгнать наблюдателя ${spec.nickname} с трибуны`}
                    >
                      <UserX className="w-3 h-3 text-red-400" />
                      <span>Выгнать</span>
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
