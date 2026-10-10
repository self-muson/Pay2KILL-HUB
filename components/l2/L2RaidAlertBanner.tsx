'use client';

import React, { useState } from 'react';
import {
  Flame,
  Swords,
  Volume2,
  Copy,
  Check,
  ShieldCheck,
  X,
  Crown,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { l2Audio } from '@/lib/l2-audio';

export function L2RaidAlertBanner() {
  const { activeRally, dismissRally, markBossKilled, isRaidLeader } = useL2SpotStore();
  const [copiedMacro, setCopiedMacro] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  if (!activeRally) return null;

  const handleSoundReplay = () => {
    if (activeRally.type === 'SPAWN') {
      l2Audio.playWarHorn();
    } else {
      l2Audio.playPvpAlert();
    }
  };

  const handleCopyTargetMacro = () => {
    const macro = `/target ${activeRally.bossName}\n/attack`;
    navigator.clipboard.writeText(macro);
    setCopiedMacro(true);
    setTimeout(() => setCopiedMacro(false), 2000);
  };

  const handleCopyDiscordNotice = () => {
    const text = `🚨 **ВНИМАНИЕ КЛАН!** 🚨\n🔥 **БОСС ${activeRally.bossName.toUpperCase()} РЕСНУЛСЯ!**\n👑 Скаут на месте: **${activeRally.scoutNickname}**\n⚔️ Сбор Командного Канала (КК) и паков в игре и голосовом канале Discord!`;
    navigator.clipboard.writeText(text);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  const isSpawn = activeRally.type === 'SPAWN';

  return (
    <div
      className={`relative w-full border-b shadow-2xl transition-all select-none z-30 ${
        isSpawn
          ? 'bg-gradient-to-r from-[#2a0e0e] via-[#451414] to-[#2a0e0e] border-[#ef4444]/60 text-amber-100'
          : 'bg-gradient-to-r from-[#240b2e] via-[#3d134d] to-[#240b2e] border-[#a855f7]/60 text-purple-100'
      }`}
    >
      {/* Decorative Golden Top & Bottom borders */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c2a363] to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Horn Icon + Raid Announcement */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border shadow-lg ${
              isSpawn
                ? 'bg-red-950/80 border-amber-500/60 text-amber-400 animate-pulse'
                : 'bg-purple-950/80 border-purple-400/60 text-purple-300 animate-bounce'
            }`}
          >
            {isSpawn ? <Flame className="w-5 h-5 text-amber-300" /> : <Swords className="w-5 h-5 text-purple-300" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-300/90 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                {isSpawn ? 'РЕЙДОВЫЙ СБОР КК // RAID CALL' : 'ПВП ТРЕВОГА // PVP COMBAT'}
              </span>
              <span className="text-xs text-amber-200/80 font-mono">
                {new Date(activeRally.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-serif font-black tracking-wide text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {activeRally.message}
            </h2>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Replay War Horn */}
          <button
            onClick={handleSoundReplay}
            className="p-2 rounded bg-black/50 hover:bg-black/80 border border-[#c2a363]/40 text-amber-300 transition-colors shadow-sm"
            title="Повторить звук рейдового горна"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Copy Macro */}
          <button
            onClick={handleCopyTargetMacro}
            className="px-3 py-1.5 rounded bg-slate-900/90 hover:bg-slate-800 border border-[#c2a363]/50 text-amber-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Скопировать игровой макрос: /target [Boss]"
          >
            {copiedMacro ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedMacro ? 'СКОПИРОВАНО!' : 'МАКРОС /target'}</span>
          </button>

          {/* Copy Discord Call */}
          <button
            onClick={handleCopyDiscordNotice}
            className="px-3 py-1.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/50 text-indigo-200 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            title="Скопировать форматированный текст для Discord"
          >
            {copiedDiscord ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Megaphone className="w-3.5 h-3.5 text-indigo-300" />}
            <span>{copiedDiscord ? 'ГОТОВО В БУФЕР!' : 'АНОНС В ДИСКОРД'}</span>
          </button>

          {/* Raid Leader: Boss Killed */}
          {isRaidLeader && (
            <button
              onClick={() => markBossKilled(activeRally.bossId)}
              className="px-3 py-1.5 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
              title="Отметить босса убитым и запустить таймер отката"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>БОСС УБИТ (КД)</span>
            </button>
          )}

          {/* Dismiss Alert */}
          <button
            onClick={dismissRally}
            className="p-1.5 rounded bg-black/40 hover:bg-black/70 text-slate-400 hover:text-slate-200 transition-colors ml-1"
            title="Скрыть оповещение"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#c2a363]/60 to-transparent" />
    </div>
  );
}
