'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Flame,
  RotateCcw,
  Trash2,
  Clock,
  Shield,
  User,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { SpawnAlertLogEntry } from '@/lib/boss-tracker-types';

interface SpawnAlertLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function SpawnAlertLogsModal({
  isOpen,
  onClose,
  onShowToast,
}: SpawnAlertLogsModalProps) {
  const {
    spawnAlertLogs,
    role,
    cancelSpawnAlert,
    clearSpawnLogs,
    spectators,
    mySpectatorId,
  } = useBossTrackerStore();

  const isScoutOrAdmin = role === 'scout' || role === 'admin';
  const [filterBoss, setFilterBoss] = useState('');
  const [filterUser, setFilterUser] = useState('');

  if (!isOpen) return null;

  const currentSpec = spectators.find((s) => s.id === mySpectatorId || s.isMe);
  const currentCancellerName =
    currentSpec?.nickname || (role === 'admin' ? 'КЛ (Админ)' : 'Скаут');

  const filteredLogs = spawnAlertLogs.filter((log) => {
    if (filterBoss.trim()) {
      const q = filterBoss.toLowerCase().trim();
      const match =
        log.bossName.toLowerCase().includes(q) ||
        String(log.bossLevel).includes(q);
      if (!match) return false;
    }
    if (filterUser.trim()) {
      const q = filterUser.toLowerCase().trim();
      const match =
        log.pressedBy.nickname.toLowerCase().includes(q) ||
        log.pressedBy.className.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCancelAlert = (bossId: string, bossName: string) => {
    cancelSpawnAlert(bossId, {
      nickname: currentCancellerName,
      role,
    });
    if (onShowToast) {
      onShowToast(`Оповещение по боссу ${bossName} отменено (${currentCancellerName})`);
    }
  };

  const handleClearAll = () => {
    if (confirm('Очистить историю логов оповещений?')) {
      clearSpawnLogs();
      if (onShowToast) onShowToast('Журнал логов очищен');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#0b0e14] border-2 border-amber-500/60 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#17110c] via-[#21160e] to-[#121622] border-b border-amber-500/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-slate-100 gold-gradient-text tracking-wide flex items-center gap-2">
                ЖУРНАЛ ОПОВЕЩЕНИЙ РЕСПАУНА
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50">
                  {spawnAlertLogs.length} записей
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Логирование нажатий кнопки «Оповестить» наблюдателями с трибуны
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isScoutOrAdmin && spawnAlertLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 text-xs font-mono font-bold transition-all flex items-center gap-1"
                title="Очистить все логи"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 bg-[#0f1420] border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs font-mono shrink-0">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={filterBoss}
              onChange={(e) => setFilterBoss(e.target.value)}
              placeholder="Фильтр по боссу..."
              className="w-full pl-8 pr-2 py-1.5 bg-[#080b11] border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Фильтр по персонажу..."
              className="w-full pl-8 pr-2 py-1.5 bg-[#080b11] border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          {(filterBoss || filterUser) && (
            <button
              type="button"
              onClick={() => {
                setFilterBoss('');
                setFilterUser('');
              }}
              className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px]"
            >
              Сброс
            </button>
          )}
        </div>

        {/* Log Entries List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 font-mono text-xs">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-700" />
              {spawnAlertLogs.length === 0
                ? 'Журнал оповещений пуст. Нажмите «Оповестить» в таблице боссов для создания записи.'
                : 'Нет записей, удовлетворяющих заданным фильтрам.'}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isActive = log.status === 'ACTIVE' && Date.now() - log.timestamp < 10 * 60 * 1000;
              const isCancelled = log.status === 'CANCELLED';

              const roleLabel =
                log.pressedBy.role === 'admin'
                  ? '👑 КЛ'
                  : log.pressedBy.role === 'scout'
                  ? '⚡ СКАУТ'
                  : '👁️ НАБЛЮДАТЕЛЬ';

              const roleColor =
                log.pressedBy.role === 'admin'
                  ? 'text-amber-400 bg-amber-950/80 border-amber-500/50'
                  : log.pressedBy.role === 'scout'
                  ? 'text-yellow-300 bg-yellow-950/80 border-yellow-400/50'
                  : 'text-slate-300 bg-slate-900 border-slate-700';

              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border transition-all text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCancelled
                      ? 'bg-[#180a0d] border-red-900/60 opacity-80'
                      : isActive
                      ? 'bg-[#1a1409] border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                      : 'bg-[#0f1422] border-slate-800'
                  }`}
                >
                  {/* Left: Boss info & time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-200 text-sm font-sans">
                        {log.bossName}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                        {log.bossLevel} ур.
                      </span>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          <Flame className="w-3 h-3 text-emerald-400" />
                          АКТИВНО (10 МИН)
                        </span>
                      ) : isCancelled ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-600 text-[10px] font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-red-400" />
                          ОТМЕНЕНО
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 text-[10px]">
                          ИСТЕКЛО
                        </span>
                      )}
                    </div>

                    {/* Who pressed */}
                    <div className="flex items-center gap-2 text-slate-300 text-[11px] flex-wrap">
                      <span className="text-slate-500">Нажал:</span>
                      <span className={`px-1.5 py-0.2 rounded border font-bold text-[10px] ${roleColor}`}>
                        {roleLabel}
                      </span>
                      <b className="text-slate-100 font-sans">{log.pressedBy.nickname}</b>
                      <span className="text-slate-400 text-[10px]">
                        ({log.pressedBy.className} {log.pressedBy.level} ур.)
                      </span>
                    </div>

                    {/* Cancellation info if cancelled */}
                    {isCancelled && log.cancelledBy && (
                      <div className="text-[10px] text-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>
                          Отменил: <b>{log.cancelledBy.nickname}</b> ({log.cancelledBy.role === 'admin' ? 'КЛ' : 'Скаут'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Timestamp & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-bold text-slate-200">{log.timeFormatted}</span>
                      <span className="text-slate-500 text-[10px]">({log.dateFormatted})</span>
                    </div>

                    {/* Scout / Admin can cancel active alert */}
                    {isScoutOrAdmin && isActive && (
                      <button
                        type="button"
                        onClick={() => handleCancelAlert(log.bossId, log.bossName)}
                        className="px-2 py-1 rounded-lg bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm"
                        title="Отменить этот респ (ложная тревога)"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Отменить</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a0d14] border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span className="text-[11px]">
            💡 Только пользователи с трибуны наблюдателей могут объявлять о респе.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
