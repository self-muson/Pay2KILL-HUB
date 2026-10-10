'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Clock,
  Zap,
  UserCheck,
  UserPlus,
  Flame,
  Swords,
  ChevronRight,
  Sparkles,
  Shield,
  RotateCcw,
  FastForward,
  Play,
  Pause,
  X,
} from 'lucide-react';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { L2Boss, UserCharacter } from '@/lib/l2-spot-types';
import { l2Audio } from '@/lib/l2-audio';

export function L2TimeGateTimeline() {
  const {
    bosses,
    characters,
    activeCharacterId,
    takeSpotWithCharacter,
    leaveSpot,
    reportSpawn,
    reportPvp,
    timeGateOffsetMinutes,
    setTimeGateOffsetMinutes,
  } = useL2SpotStore();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedBoss, setSelectedBoss] = useState<L2Boss | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Time updater tick every second
  useEffect(() => {
    const update = () => {
      const now = new Date(Date.now() + timeGateOffsetMinutes * 60 * 1000);
      setCurrentTime(now);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timeGateOffsetMinutes]);

  // Current real/simulated time in minutes from midnight
  const currentTotalMinutes =
    currentTime.getHours() * 60 +
    currentTime.getMinutes() +
    currentTime.getSeconds() / 60;

  // Format time string for gate
  const formattedHours = String(currentTime.getHours()).padStart(2, '0');
  const formattedMinutes = String(currentTime.getMinutes()).padStart(2, '0');
  const formattedSeconds = String(currentTime.getSeconds()).padStart(2, '0');
  const gateTimeString = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

  // Helper: parse "HH:MM" to minutes of day
  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Pixels per minute scale
  const pixelsPerMinute = 3.2;
  // Gate position is fixed at 40% from container left
  const gatePercentage = 38;

  // Calculate position of boss relative to current time gate
  // A boss whose windowStart == currentTotalMinutes sits exactly at gatePercentage
  const getBossPositionPercent = (boss: L2Boss) => {
    const bossMinutes = parseTimeToMinutes(boss.windowStart);
    // Delta minutes: positive if boss is in future, negative if in past
    let delta = bossMinutes - currentTotalMinutes;
    // Handle 24h wrap
    if (delta < -720) delta += 1440;
    if (delta > 720) delta -= 1440;

    return delta;
  };

  // Group bosses by proximity to avoid overlap (stagger into rows)
  const sortedBosses = [...bosses].sort((a, b) => {
    return parseTimeToMinutes(a.windowStart) - parseTimeToMinutes(b.windowStart);
  });

  const handleSelectBoss = (boss: L2Boss) => {
    setSelectedBoss(boss);
    l2Audio.playEquipClick();
  };

  const handleAssignCharacter = (bossId: string, char: UserCharacter) => {
    takeSpotWithCharacter(bossId, char.id);
    const boss = bosses.find((b) => b.id === bossId);
    setSuccessToast(`Персонаж [${char.nickname}] занял спот ${boss?.name || ''}!`);
    setTimeout(() => setSuccessToast(null), 3500);
    setSelectedBoss(null);
  };

  return (
    <section className="w-full bg-gradient-to-b from-[#0a0d14] via-[#10141e] to-[#0d1017] border-y border-[#c2a363]/40 shadow-2xl relative select-none overflow-hidden">
      {/* Top Controller Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 font-mono text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-serif font-black text-amber-200 tracking-wider text-xs uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            ВРЕМЕННОЙ ШЛАГБАУМ // ТАЙМЛАЙН РЕЙД-БОССОВ
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            (Зеленые иконки переступили шлагбаум — их окно открыто!)
          </span>
        </div>

        {/* Live / Scrub Controls */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 mr-1 hidden md:inline">СИМУЛЯЦИЯ ВРЕМЕНИ:</span>
          <button
            onClick={() => setTimeGateOffsetMinutes(timeGateOffsetMinutes - 30)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
            title="Назад на 30 минут"
          >
            -30м
          </button>
          <button
            onClick={() => setTimeGateOffsetMinutes(0)}
            className={`px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${
              timeGateOffsetMinutes === 0
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                : 'bg-slate-900 text-amber-300 border-slate-700'
            }`}
            title="Реальное системное время"
          >
            <Clock className="w-3 h-3" />
            <span>РЕАЛ-ТАЙМ</span>
          </button>
          <button
            onClick={() => setTimeGateOffsetMinutes(timeGateOffsetMinutes + 30)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300"
            title="Вперед на 30 минут"
          >
            +30м
          </button>
          <button
            onClick={() => setTimeGateOffsetMinutes(timeGateOffsetMinutes + 60)}
            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-amber-300"
            title="Вперед на 1 час"
          >
            +1ч
          </button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {successToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TIMELINE CONVEYOR TRACK WITH STATIONARY TIME GATE */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#0a0d13]">
        {/* Background Grid & Hour Ticks */}
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#c2a363_1px,transparent_1px),linear-gradient(to_bottom,#c2a363_1px,transparent_1px)] bg-[size:4rem_2rem] pointer-events-none" />

        {/* ---------------------------------------------------------------- */}
        {/* FIXED STATIONARY TIME GATE (НЕПОДВИЖНЫЙ ШЛАГБАУМ НАСТОЯЩЕГО ВРЕМЕНИ) */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
          style={{ left: `${gatePercentage}%` }}
        >
          {/* Top Gate Beacon & Exact Current Clock */}
          <div className="absolute top-2 -translate-x-1/2 bg-gradient-to-r from-[#2a1e0b] via-[#453215] to-[#2a1e0b] border-2 border-[#c2a363] text-amber-100 px-3 py-1 rounded-full shadow-[0_0_20px_rgba(194,163,99,0.7)] flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <div className="text-center font-mono">
              <span className="text-[9px] uppercase tracking-wider text-[#c2a363] block font-bold">
                ШЛАГБАУМ ВРЕМЕНИ
              </span>
              <span className="text-xs font-black text-amber-200 tracking-widest">
                {gateTimeString}
              </span>
            </div>
          </div>

          {/* Laser-like Vertical Stationary Barrier Beam */}
          <div className="w-[3px] h-full bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_15px_#c2a363,0_0_30px_#f59e0b] opacity-90 mt-12" />

          {/* Bottom Gate Anchor */}
          <div className="absolute bottom-1 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/60 text-[9px] font-mono font-bold text-amber-300 tracking-wider">
            НАСТОЯЩЕЕ ВРЕМЯ
          </div>
        </div>

        {/* Zone Labels */}
        <div
          className="absolute top-2 text-[10px] font-mono text-emerald-400/80 font-bold tracking-wider pointer-events-none uppercase"
          style={{ left: `${gatePercentage - 20}%` }}
        >
          ◄ АКТИВНЫЕ ОКНА (ЗЕЛЕНЫЕ)
        </div>
        <div
          className="absolute top-2 text-[10px] font-mono text-amber-300/70 font-bold tracking-wider pointer-events-none uppercase"
          style={{ left: `${gatePercentage + 4}%` }}
        >
          ОЖИДАЮТ ПОДХОДА К ШЛАГБАУМУ ►
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MOVING TIMELINE STRIP: BOSS ICONS PASSING THROUGH THE GATE */}
        {/* ---------------------------------------------------------------- */}
        <div className="relative h-full w-full">
          {sortedBosses.map((boss, idx) => {
            const deltaMinutes = getBossPositionPercent(boss);
            // Has the boss crossed the stationary gate?
            const hasCrossedGate = deltaMinutes <= 0;
            // Is it currently within its window? (e.g. within 3 hours after start)
            const isWindowActive = deltaMinutes <= 0 && deltaMinutes > -180;

            // Stagger bosses vertically into 2 rows if they are close in time
            const verticalRow = idx % 2 === 0 ? 'top-14' : 'top-28';

            // Calculate horizontal offset in px or % relative to gate
            // gatePercentage% + (deltaMinutes * pixelsPerMinute)
            const leftCalc = `calc(${gatePercentage}% + ${deltaMinutes * pixelsPerMinute}px)`;

            return (
              <div
                key={boss.id}
                onClick={() => handleSelectBoss(boss)}
                style={{ left: leftCalc }}
                className={`absolute ${verticalRow} -translate-x-1/2 z-20 cursor-pointer group transition-all duration-300`}
              >
                {/* Boss Item Ribbon Card */}
                <div
                  className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border-2 shadow-2xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                    hasCrossedGate
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-pulse ring-2 ring-emerald-400/50'
                      : 'bg-[#121622]/90 border-[#c2a363]/60 text-amber-100 hover:border-[#c2a363] shadow-lg'
                  }`}
                >
                  {/* Boss Avatar */}
                  <div
                    className={`relative w-10 h-10 rounded-lg overflow-hidden border shrink-0 ${
                      hasCrossedGate ? 'border-emerald-300' : 'border-[#c2a363]'
                    }`}
                  >
                    <Image
                      src={boss.image}
                      alt={boss.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Status badge in avatar */}
                    {boss.spotter && (
                      <div
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[8px] text-white font-bold"
                        title={`Скаут: ${boss.spotter.nickname}`}
                      >
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Boss Quick Data */}
                  <div className="font-mono text-left leading-tight min-w-[105px]">
                    <div className="flex items-center gap-1">
                      <span className="font-serif font-black text-xs uppercase truncate max-w-[95px]">
                        {boss.name.split(' ')[0]}...
                      </span>
                      <span className="text-[10px] font-bold text-amber-300">
                        {boss.level}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      <span>{boss.windowStart}</span>
                      {boss.timeOfDeath && (
                        <span className="text-[9px] text-red-300 font-bold ml-1">
                          💀{boss.timeOfDeath}
                        </span>
                      )}
                    </div>

                    {/* Crossing state indicator */}
                    {hasCrossedGate ? (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-900/80 px-1 rounded block mt-0.5">
                        ● ПЕРЕСТУПИЛ ЧЕРТУ
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-300/80 block mt-0.5">
                        через {Math.round(deltaMinutes)} мин.
                      </span>
                    )}

                    {/* Spotter Tag if assigned */}
                    {boss.spotter && (
                      <span className="text-[9px] text-blue-300 block truncate font-bold">
                        👤 {boss.spotter.nickname}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* QUICK CHARACTER SELECTION MODAL (ПРИ НАЖАТИИ НА БОССА) */}
      {/* ------------------------------------------------------------------ */}
      {selectedBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#10141d] border-2 border-[#c2a363] rounded-xl shadow-2xl overflow-hidden font-sans select-none">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#1c1813] via-[#2a2217] to-[#1c1813] border-b border-[#c2a363]/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#c2a363]">
                  <Image
                    src={selectedBoss.image}
                    alt={selectedBoss.name}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-black text-amber-100 text-sm uppercase">
                      {selectedBoss.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50 text-xs font-mono font-bold">
                      Lv {selectedBoss.level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Окно респауна: {selectedBoss.windowStart} – {selectedBoss.windowEnd} ({selectedBoss.location})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBoss(null)}
                className="p-1 rounded text-amber-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Select Character to Stand on Spot */}
            <div className="p-5 space-y-4 font-mono text-xs">
              <div className="bg-[#151b27] p-3 rounded-lg border border-slate-800">
                <span className="font-serif font-bold text-amber-200 block text-xs mb-1">
                  🎯 ВЫБЕРИТЕ ПЕРСОНАЖА ДЛЯ ЗАНЯТИЯ СПОТА:
                </span>
                <p className="text-[11px] text-slate-400 font-sans">
                  Персонаж закрепится за этим боссом. Вы отбегаете на спот в игре и сможете мгновенно
                  оповестить саппортов и КК, как только босс появится!
                </p>
              </div>

              {/* Character List from Personal Cabinet */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {characters.map((char) => {
                  const isAlreadyOnThisSpot =
                    selectedBoss.spotter?.nickname.toLowerCase() === char.nickname.toLowerCase();

                  return (
                    <div
                      key={char.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                        isAlreadyOnThisSpot
                          ? 'bg-emerald-950/70 border-emerald-500'
                          : 'bg-[#141824] border-slate-800 hover:border-[#c2a363]/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded bg-[#1e2638] border border-slate-700 flex items-center justify-center text-amber-300 font-bold shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-serif font-black text-amber-100 text-xs truncate">
                              {char.nickname}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold">
                              Ур. {char.approxLevel}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {char.className} · {char.gearSummary}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignCharacter(selectedBoss.id, char)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-[11px] uppercase tracking-wider shrink-0 transition-all shadow-md active:scale-95"
                      >
                        {isAlreadyOnThisSpot ? 'НА СПОТЕ' : 'ПОСТАВИТЬ'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* If spot already occupied, allow reporting spawn or clearing */}
              {selectedBoss.spotter && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Сейчас на споте: <strong className="text-amber-300">{selectedBoss.spotter.nickname}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        reportSpawn(selectedBoss.id);
                        setSelectedBoss(null);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold flex items-center gap-1"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>БОСС РЕСНУЛСЯ!</span>
                    </button>
                    <button
                      onClick={() => {
                        leaveSpot(selectedBoss.id);
                        setSelectedBoss(null);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                    >
                      ОСВОБОДИТЬ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-[#0c1017] border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBoss(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs transition-colors"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
