'use client';

import React, { useEffect, useState } from 'react';
import {
  Skull,
  Shield,
  Eye,
  KeyRound,
  ShieldAlert,
  Radio,
  Settings,
  Plus,
  Search,
  X,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useAuthStore } from '@/lib/auth-store';
import { audioManager } from '@/lib/audio-manager';
import { CAMERA_ACCOUNTS } from '@/lib/camera-accounts-data';
import { BossTrackerTribune } from './BossTrackerTribune';
import { BossTrackerTable } from './BossTrackerTable';
import { BossTrackerAdminModal } from './BossTrackerAdminModal';
import { CameraAccountsModal } from './CameraAccountsModal';
import { BossEditModal } from './BossEditModal';
import { SpawnAlertLogsModal } from './SpawnAlertLogsModal';
import { SoundSettingsModal } from './SoundSettingsModal';

interface BossTrackerAppProps {
  onSwitchToLfg: () => void;
  isAccountsModalOpen: boolean;
  setIsAccountsModalOpen: (val: boolean) => void;
  isBossAdminModalOpen: boolean;
  setIsBossAdminModalOpen: (val: boolean) => void;
  isSpawnLogsModalOpen: boolean;
  setIsSpawnLogsModalOpen: (val: boolean) => void;
  isSoundSettingsModalOpen: boolean;
  setIsSoundSettingsModalOpen: (val: boolean) => void;
  isNewBossModalOpen: boolean;
  setIsNewBossModalOpen: (val: boolean) => void;
}

// Track already-notified alert log IDs globally so sounds never loop or re-trigger repeatedly
const globalSeenAlertLogIds = new Set<string>();

export function BossTrackerApp({
  onSwitchToLfg,
  isAccountsModalOpen,
  setIsAccountsModalOpen,
  isBossAdminModalOpen,
  setIsBossAdminModalOpen,
  isSpawnLogsModalOpen,
  setIsSpawnLogsModalOpen,
  isSoundSettingsModalOpen,
  setIsSoundSettingsModalOpen,
  isNewBossModalOpen,
  setIsNewBossModalOpen,
}: BossTrackerAppProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const {
    isPinVerified,
    role,
    recalculateAllPhases,
    filterPhase,
    searchQuery,
    setFilterPhase,
    setSearchQuery,
  } = useBossTrackerStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Hydrate store state from localStorage on client mount
  useEffect(() => {
    setHasMounted(true);
    useBossTrackerStore.getState().hydrateFromStorage();
  }, []);

  // Periodic recalculation loop for real-time countdown and phase transitions
  useEffect(() => {
    const timer = setInterval(() => {
      recalculateAllPhases();
    }, 1000);
    return () => clearInterval(timer);
  }, [recalculateAllPhases]);

  // Server polling loop (every 3 seconds) for multi-user fallback synchronization
  useEffect(() => {
    const poll = async () => {
      await useBossTrackerStore.getState().fetchServerBossState();
      const state = useBossTrackerStore.getState();
      const now = Date.now();

      // Check spawn alert logs for fresh alerts (created in the last 15 seconds)
      const freshLogs = (state.spawnAlertLogs || []).filter(
        (log) => log.status === 'ACTIVE' && now - log.timestamp < 15000
      );

      freshLogs.forEach((log) => {
        if (!globalSeenAlertLogIds.has(log.id)) {
          globalSeenAlertLogIds.add(log.id);
          audioManager.playSpawnAlertSound();
          showToast(`🔥 ОПОВЕЩЕНИЕ В ПРЯМОМ ЭФИРЕ: ${log.bossName} (${log.bossLevel} ур.)!`);
        }
      });
    };

    void poll();
    const pollInterval = setInterval(() => {
      void poll();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);


  // Real-time remote spawn alerts listener across tabs and spectators
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('p2k_boss_tracker_alerts_v1');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'BOSS_SPAWNED') {
        const state = useBossTrackerStore.getState();
        const target = state.bosses.find((b) => b.id === data.bossId);
        if (target) {
          audioManager.playSpawnAlertSound();
          const senderNick = data.pressedBy?.nickname ? ` от [${data.pressedBy.nickname}]` : '';
          showToast(`🔥 ОПОВЕЩЕНИЕ: ${target.name} (${target.level} ур.)${senderNick}`);
        }
      } else if (data && data.type === 'SPAWN_CANCELLED') {
        audioManager.stopAllAlertSounds();
        const state = useBossTrackerStore.getState();
        const target = state.bosses.find((b) => b.id === data.bossId);
        if (target) {
          showToast(`❌ Оповещение по боссу ${target.name} отменено`);
        }
      } else if (data && data.type === 'READY_CHECK_TRIGGERED') {
        const state = useBossTrackerStore.getState();
        const target = state.bosses.find((b) => b.id === data.bossId);
        if (target) {
          const spotter = target.assignedSpotter;
          const authUser = useAuthStore.getState().user;
          const { characters, activeCharacterId } = useL2SpotStore.getState();
          const activeChar =
            characters.find((c) => c.id === activeCharacterId) ||
            characters.find((c) => c.isMain) ||
            characters[0];

          const isMySpotter =
            spotter?.isMe ||
            (spotter?.nickname &&
              (spotter.nickname.toLowerCase() === (authUser?.displayName || '').toLowerCase() ||
                spotter.nickname.toLowerCase() === (authUser?.username || '').toLowerCase() ||
                spotter.nickname.toLowerCase() === (activeChar?.nickname || '').toLowerCase()));

          if (isMySpotter) {
            audioManager.startReadyCheckRadio();
            showToast(`📻 ВАМ ОТПРАВЛЕН READY CHECK по боссу ${target.name}! Подтвердите присутствие на споте!`);
          } else {
            showToast(`📻 Ready Check отправлен для [${spotter?.nickname || 'споттера'}] (${target.name})`);
          }
        }
      } else if (data && data.type === 'READY_CHECK_CONFIRMED') {
        audioManager.stopAllAlertSounds();
        const state = useBossTrackerStore.getState();
        const target = state.bosses.find((b) => b.id === data.bossId);
        if (target) {
          showToast(`✅ Ready Check подтвержден для ${target.name}! Радио радиопроверки отключено.`);
        }
      } else if (data && data.type === 'OCCUPANCY_CHANGED') {
        useBossTrackerStore.setState({ accountOccupancies: data.occupancies });
      } else if (data && data.type === 'FORCE_LOGOUT_ALL') {
        useAuthStore.getState().logout();
        showToast('⚠️ Администратор сбросил все активные сессии клана.');
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  if (!hasMounted) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-xl border border-slate-800 bg-[#0b0e14]" />
        <div className="h-96 rounded-2xl border border-slate-800 bg-[#090b0e]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-[#151c27] border-2 border-amber-400 text-amber-200 text-xs font-bold font-mono rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* COMPACT SPREADSHEET FILTER BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#0d1017] border border-[#c2a363]/30 rounded-xl shadow-md">
        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono select-none">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>ФИЛЬТРЫ ТАБЛИЦЫ</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Phase Selector */}
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="px-2.5 py-1.5 bg-[#080a0f] border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner min-h-[34px] w-full sm:w-auto"
          >
            <option value="ALL">Все статусы</option>
            <option value="WINDOW_OPEN">🟢 Окно открыто</option>
            <option value="WAITING_WINDOW">🔴 До респауна</option>
            <option value="WINDOW_EXPIRED">⏳ Просрочен</option>
            <option value="NO_DATA">⚪ Нет TOD</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 w-full sm:w-56 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск (имя, уровень, cam)..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#080a0f] border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 min-h-[34px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spectator Tribune */}
      <BossTrackerTribune />

      {/* Main Excel-like Table */}
      <BossTrackerTable
        onOpenAdminModal={() => setIsBossAdminModalOpen(true)}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        onShowToast={showToast}
      />

      {/* Camera Accounts Modal */}
      <CameraAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Admin PIN Control Modal */}
      <BossTrackerAdminModal
        isOpen={isBossAdminModalOpen}
        onClose={() => setIsBossAdminModalOpen(false)}
      />

      {/* Add New Boss Modal */}
      <BossEditModal
        isOpen={isNewBossModalOpen}
        onClose={() => setIsNewBossModalOpen(false)}
        boss={null}
        isNew={true}
      />

      {/* Spawn Alert Logs Modal */}
      <SpawnAlertLogsModal
        isOpen={isSpawnLogsModalOpen}
        onClose={() => setIsSpawnLogsModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Sound Settings Modal (CL / Admin) */}
      <SoundSettingsModal
        isOpen={isSoundSettingsModalOpen}
        onClose={() => setIsSoundSettingsModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
