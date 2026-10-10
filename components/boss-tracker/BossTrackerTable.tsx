'use client';

import React, { useState } from 'react';
import {
  Skull,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Edit3,
  X,
  Video,
  Lock,
  Radio,
  Flame,
  Copy,
  Check,
  ChevronDown,
  User,
  Sparkles,
  Settings,
  History,
  XCircle,
  Camera,
  FileText,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { audioManager } from '@/lib/audio-manager';
import { TrackerBoss } from '@/lib/boss-tracker-types';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useAuthStore } from '@/lib/auth-store';
import {
  formatTimeInTimezone,
  parseTimeToUtcTimestamp,
  getTimezoneOption,
} from '@/lib/timezone-manager';
import { BossEditModal } from './BossEditModal';
import {
  findAccountByCamCode,
  CAMERA_ACCOUNTS,
  normalizeCamCode,
  loadAllAccounts,
  findAccountsForBoss,
  getAccountForBossInGroup,
  findAccountInAuthorGroupForBoss,
} from '@/lib/camera-accounts-data';
import { SpawnAlertLogsModal } from './SpawnAlertLogsModal';

interface BossTrackerTableProps {
  onOpenAdminModal?: () => void;
  onOpenAccountsModal?: () => void;
  onShowToast?: (msg: string) => void;
}

export function BossTrackerTable({
  onOpenAdminModal,
  onOpenAccountsModal,
  onShowToast,
}: BossTrackerTableProps) {
  const {
    bosses,
    role,
    isPinVerified,
    setBossDeathNow,
    setBossDeathCustom,
    resetBoss,
    filterLevel,
    filterPhase,
    searchQuery,
    occupySpot,
    leaveSpot,
    accountOccupancies,
    occupyAccount,
    releaseAccount,
    triggerSpawnAlert,
    cancelSpawnAlert,
    spawnAlertLogs,
    triggerReadyCheck,
    confirmReadyCheck,
    customAccounts,
    setSelectedAccountForBoss,
    setBossAuthorGroup,
    selectedCameraGroup,
    setSelectedCameraGroup,
    spectators,
    mySpectatorId,
  } = useBossTrackerStore();

  const { user: authUser, timezoneOffset, timezoneId } = useAuthStore();
  const canEditBosses = Boolean(
    authUser?.permissions?.canEditBosses ||
    authUser?.role === 'admin' ||
    authUser?.role === 'scout' ||
    role === 'admin' ||
    role === 'scout'
  );
  const isScoutOrAdmin = canEditBosses;
  const activeTimezoneOption = getTimezoneOption(timezoneId);

  const { characters, activeCharacterId, setActiveCharacter } = useL2SpotStore();
  const activeChar =
    characters.find((c) => c.id === activeCharacterId) ||
    characters.find((c) => c.isMain) ||
    characters[0];

  const allAccounts = loadAllAccounts(customAccounts);
  const allAuthorGroups = Array.from(
    new Set(allAccounts.map((a) => a.authorGroup || 'Qox'))
  );

  const [editingBoss, setEditingBoss] = useState<TrackerBoss | null>(null);
  const [customTodInput, setCustomTodInput] = useState('');
  const [editingBossDetails, setEditingBossDetails] = useState<TrackerBoss | null>(null);
  const [spotSelectBoss, setSpotSelectBoss] = useState<TrackerBoss | null>(null);
  const [selectedSpotterCharId, setSelectedSpotterCharId] = useState<string | null>(null);
  const [viewerLockedModalOpen, setViewerLockedModalOpen] = useState(false);

  // Dropdown for switching camera account per boss
  const [openAccountDropdownBossId, setOpenAccountDropdownBossId] = useState<string | null>(null);

  // Global logs modal state
  const [isGlobalLogsModalOpen, setIsGlobalLogsModalOpen] = useState(false);

  // Toast for copied account credentials
  const [copiedCredentialToast, setCopiedCredentialToast] = useState<{
    login: string;
    password: string;
    groupName: string;
    charName: string;
    copiedPass?: boolean;
  } | null>(null);

  const handleCopyCredentials = (login: string, pass: string, grp: string, charName: string) => {
    if (!isScoutOrAdmin) {
      if (onShowToast) onShowToast(`Персонаж на споте: ${charName}`);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(login);
    }
    setCopiedCredentialToast({
      login,
      password: pass,
      groupName: grp,
      charName,
    });
    if (onShowToast) onShowToast(`Логин скопирован: ${login}`);
  };

  const handleCopyCredentialsWithOccupancy = (
    account: any,
    displayCharName: string,
    camCode: string
  ) => {
    handleCopyCredentials(account.login, account.password, account.groupName, displayCharName);

    const userChar = activeChar || {
      nickname: role === 'admin' ? 'КЛ (Админ)' : 'Скаут',
      className: 'Watcher',
      levelNumber: 75,
      clanName: 'Pay2KILL',
    };

    occupyAccount(account.groupId, camCode || account.camCodes?.[0] || 'cam', {
      nickname: userChar.nickname,
      className: userChar.className,
      level: userChar.levelNumber || 75,
      clanName: userChar.clanName || 'Pay2KILL',
    });

    // Broadcast occupancy change to other tabs/devices
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const ch = new BroadcastChannel('p2k_boss_tracker_alerts_v1');
        ch.postMessage({
          type: 'OCCUPANCY_CHANGED',
          occupancies: useBossTrackerStore.getState().accountOccupancies,
        });
        ch.close();
      } catch (e) {}
    }
  };

  const handleCameraAccountSelect = (
    boss: TrackerBoss,
    account: typeof allAccounts[0],
    overrideCharName?: string
  ) => {
    // Automatically match and select camera & character belonging to this group
    const match = getAccountForBossInGroup(boss, account);
    const chosenCharName = overrideCharName || match.charName;
    setSelectedAccountForBoss(boss.id, account.groupId, chosenCharName, match.camCode);
    setOpenAccountDropdownBossId(null);

    // Occupy the account
    const userChar = activeChar || {
      nickname: 'Scout_Me',
      className: 'Silver Ranger',
      levelNumber: 75,
      clanName: 'Pay2KILL',
    };

    occupyAccount(account.groupId, match.camCode, {
      nickname: userChar.nickname,
      className: userChar.className,
      level: userChar.levelNumber || 75,
      clanName: userChar.clanName || 'Pay2KILL',
    });

    handleCopyCredentials(account.login, account.password, account.groupName, chosenCharName);
    if (onShowToast) {
      onShowToast(`Выбрана ${account.groupName}: камера [${match.camCode}] для ${boss.name}`);
    }
  };

  const handleTriggerSpawnAlert = (boss: TrackerBoss) => {
    const mySpec = spectators.find((s) => s.id === mySpectatorId || s.isMe);
    const userChar = {
      nickname:
        authUser?.displayName ||
        mySpec?.nickname ||
        activeChar?.nickname ||
        (canEditBosses ? 'Скаут' : 'Наблюдатель'),
      className:
        mySpec?.className ||
        activeChar?.className ||
        (canEditBosses ? 'Silver Ranger' : 'Watcher'),
      level: mySpec?.level || activeChar?.levelNumber || 75,
      clanName: authUser?.clanName || mySpec?.clanName || activeChar?.clanName || 'Pay2KILL',
      role: (authUser?.role || (canEditBosses ? 'scout' : 'viewer')) as any,
    };

    triggerSpawnAlert(boss.id, userChar);

    if (onShowToast) {
      onShowToast(`📢 ${userChar.nickname} (${role === 'admin' ? 'КЛ' : role === 'scout' ? 'Скаут' : 'Наблюдатель'}) оповестил о респе: ${boss.name}!`);
    }
  };

  const handleCancelSpawnAlert = (boss: TrackerBoss) => {
    if (!isScoutOrAdmin) {
      if (onShowToast) onShowToast('⚠️ Только скаут или админ (КЛ) может отменить статус респа');
      return;
    }

    const mySpec = spectators.find((s) => s.id === mySpectatorId || s.isMe);
    const cancellerName = mySpec?.nickname || (role === 'admin' ? 'КЛ (Админ)' : 'Скаут');

    cancelSpawnAlert(boss.id, {
      nickname: cancellerName,
      role,
    });

    if (onShowToast) {
      onShowToast(`❌ Оповещение по боссу ${boss.name} отменено [${cancellerName}]`);
    }
  };

  const handleTriggerReadyCheck = async (boss: TrackerBoss) => {
    if (!isScoutOrAdmin) {
      if (onShowToast) {
        onShowToast('⚠️ Только Скаут или КЛ (Админ) может отправлять Ready Check!');
      }
      return;
    }

    const myNick = activeChar?.nickname || (role === 'admin' ? 'КЛ (Админ)' : 'Скаут');
    const res = await triggerReadyCheck(boss.id, myNick, myNick);

    if (onShowToast && res?.message) {
      onShowToast(res.message);
    }
  };

  const handleOpenEditTod = (boss: TrackerBoss) => {
    if (!isScoutOrAdmin) {
      setViewerLockedModalOpen(true);
      return;
    }
    setEditingBoss(boss);
    setCustomTodInput(
      boss.timeOfDeathTimestamp
        ? formatTimeInTimezone(boss.timeOfDeathTimestamp, timezoneOffset, true)
        : boss.timeOfDeath || ''
    );
  };

  const handleSaveCustomTod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBoss || !customTodInput) return;
    const todUtc = parseTimeToUtcTimestamp(customTodInput, timezoneOffset);
    const authorNick = activeChar?.nickname || (role === 'admin' ? 'КЛ' : 'Скаут');
    setBossDeathCustom(editingBoss.id, customTodInput, authorNick, todUtc);
    setEditingBoss(null);
    if (onShowToast) {
      onShowToast(`Время TOD для ${editingBoss.name} обновлено (${customTodInput} в ${activeTimezoneOption.shortLabel})`);
    }
  };

  const formatTimer = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatMinSec = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Filter bosses based on active level page, phase filter, and search query
  const filteredBosses = bosses.filter((boss) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = boss.name.toLowerCase().includes(q);
      const levelMatch = String(boss.level).includes(q);
      const camMatch = boss.camCode?.toLowerCase().includes(q);
      const notesMatch = boss.notes?.toLowerCase().includes(q);
      const charMatch = boss.selectedCharacterName?.toLowerCase().includes(q);
      if (!nameMatch && !levelMatch && !camMatch && !notesMatch && !charMatch) return false;
    }

    // Level filter
    if (filterLevel !== 'ALL') {
      if (filterLevel === '20-29' && (boss.level < 20 || boss.level > 29)) return false;
      if (filterLevel === '30-39' && (boss.level < 30 || boss.level > 39)) return false;
      if (filterLevel === '40-49' && (boss.level < 40 || boss.level > 49)) return false;
      if (filterLevel === '50-56' && (boss.level < 50 || boss.level > 56)) return false;
    }

    // Phase filter
    if (filterPhase !== 'ALL') {
      if (boss.phase !== filterPhase) return false;
    }

    return true;
  });

  return (
    <div className="space-y-3 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* MAIN EXCEL-LIKE SPREADSHEET TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#0b0e14] border border-[#c2a363]/30 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead>
              <tr className="bg-[#121622] border-b border-slate-800 text-slate-300 font-serif uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-2 font-bold border-r border-slate-800/80 w-12 text-center">
                  Ур.
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-slate-800/80 w-52 text-left">
                  <div className="flex items-center justify-between gap-1">
                    <span>Группа аккаунтов</span>
                    {allAuthorGroups.length > 1 && (
                      <select
                        value={selectedCameraGroup || 'Qox'}
                        onChange={(e) => {
                          setSelectedCameraGroup(e.target.value);
                          if (onShowToast) onShowToast(`Выбрана группа камер: [${e.target.value}] (авто-привязка всех боссов)`);
                        }}
                        className="text-[10px] bg-[#090d16] border border-cyan-500/60 text-cyan-300 rounded px-1 py-0.5 font-mono cursor-pointer"
                        title="Быстрый выбор группы камер (авто-привязка всех боссов)"
                      >
                        {allAuthorGroups.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-800/80 min-w-[240px] sm:min-w-[300px]">
                  <div className="flex items-center justify-between gap-1">
                    <span>Рейд-босс & Персонаж</span>
                    <button
                      type="button"
                      onClick={() => setIsGlobalLogsModalOpen(true)}
                      className="text-[10px] font-mono text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 flex items-center gap-1 normal-case tracking-normal cursor-pointer"
                      title="Открыть журнал всех оповещений о респаунах"
                    >
                      <FileText className="w-3 h-3 text-amber-400" />
                      <span>Логи ({spawnAlertLogs.length})</span>
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-2 font-bold border-r border-slate-800/80 text-center w-24">
                  TOD
                </th>
                <th className="py-2.5 px-2.5 font-bold border-r border-slate-800/80 text-center w-52 sm:w-56">
                  Окно респауна
                </th>
                <th className="py-2.5 px-2 font-bold border-r border-slate-800/80 text-center w-44 sm:w-48">
                  На споте
                </th>
                {isScoutOrAdmin && (
                  <th className="py-2.5 px-2 font-bold text-center w-28">Действия</th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filteredBosses.length === 0 ? (
                <tr>
                  <td
                    colSpan={isScoutOrAdmin ? 7 : 6}
                    className="py-10 text-center text-slate-500 font-sans"
                  >
                    Ни одного босса не найдено по выбранным фильтрам
                  </td>
                </tr>
              ) : (
                filteredBosses.map((boss, idx) => {
                  const now = Date.now();
                  const isOpen = boss.phase === 'WINDOW_OPEN';
                  const isWaiting = boss.phase === 'WAITING_WINDOW';
                  const isExpired = boss.phase === 'WINDOW_EXPIRED';
                  const isNoData = boss.phase === 'NO_DATA';

                  // Spawn alert active check (10 minutes)
                  const isSpawnAlertActive = !!(boss.spawnAlertUntil && now < boss.spawnAlertUntil);
                  const spawnAlertRemainingSec = boss.spawnAlertUntil
                    ? Math.max(0, Math.ceil((boss.spawnAlertUntil - now) / 1000))
                    : 0;

                  // Ready check active check (10 minutes)
                  const isReadyCheckActive = !!(boss.readyCheckUntil && now < boss.readyCheckUntil);
                  const readyCheckRemainingSec = boss.readyCheckUntil
                    ? Math.max(0, Math.ceil((boss.readyCheckUntil - now) / 1000))
                    : 0;

                  // Find active camera group preference for this boss:
                  const bossAuthorGroup = boss.selectedAuthorGroup || selectedCameraGroup || 'Qox';

                  // Available groups specifically having accounts with characters for THIS boss
                  const availableGroupsForBoss = allAuthorGroups.filter((grp) => {
                    return !!findAccountInAuthorGroupForBoss(boss, grp, allAccounts);
                  });

                  // Find active camera account and character for this boss:
                  // Prefer the chosen group if it has characters on this boss, otherwise fallback to first available group with characters
                  const groupMatch =
                    findAccountInAuthorGroupForBoss(boss, bossAuthorGroup, allAccounts) ||
                    (availableGroupsForBoss.length > 0
                      ? findAccountInAuthorGroupForBoss(boss, availableGroupsForBoss[0], allAccounts)
                      : null);

                  const effectiveAuthorGroup = groupMatch?.account?.authorGroup || bossAuthorGroup;
                  const explicitAcc = boss.selectedAccountId
                    ? allAccounts.find((a) => a.groupId === boss.selectedAccountId)
                    : undefined;
                  const account = groupMatch?.account || explicitAcc || findAccountByCamCode(boss.camCode, allAccounts);

                  const occupancy = account ? accountOccupancies[account.groupId] : undefined;
                  const isGroupOccupied = !!occupancy;

                  // Character name & camera code for this spot (strictly derived from the chosen group for this boss)
                  const displayCharName =
                    groupMatch?.characterName ||
                    account?.characters?.find((c) => c.bossId === boss.id)?.characterName ||
                    boss.camCode ||
                    'камера';

                  const displayCamCode = groupMatch?.camCode || boss.selectedCamCode || boss.camCode || '';

                  const isDropdownOpen = openAccountDropdownBossId === boss.id;

                  return (
                    <tr
                      key={boss.id}
                      className={`transition-colors ${
                        isOpen
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/35'
                          : isWaiting
                          ? 'bg-red-950/10 hover:bg-red-950/20'
                          : idx % 2 === 0
                          ? 'bg-[#0b0e14]'
                          : 'bg-[#0f131a]'
                      }`}
                    >
                      {/* 1. LEVEL COLUMN */}
                      <td className="py-2 px-1.5 border-r border-slate-800/60 text-center">
                        <span className="font-bold text-xs font-mono text-slate-300">
                          {boss.level}
                        </span>
                      </td>

                      {/* 2. ACCOUNT & CAMERA COLUMN (PER-BOSS GROUP SELECTION WITH OCCUPANCY PREVIEW) */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-left font-sans text-xs relative">
                        {isScoutOrAdmin ? (
                          account ? (
                            <div className="space-y-0.5">
                              {/* Account / Group selector button */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenAccountDropdownBossId(isDropdownOpen ? null : boss.id)
                                  }
                                  className="w-full flex items-center justify-between text-[11px] leading-tight font-mono p-1 rounded bg-[#090d16] hover:bg-[#121828] border border-slate-700 hover:border-cyan-400 transition-colors cursor-pointer text-left shadow-sm"
                                  title={`Выбрать группу палилок для ${boss.name}`}
                                >
                                  <div className="truncate pr-1">
                                    <span className="text-[9px] text-cyan-400 block uppercase font-bold">
                                      Группа: {effectiveAuthorGroup}
                                    </span>
                                    <span className="font-bold text-slate-100 truncate">
                                      {account.groupName}
                                    </span>
                                  </div>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                </button>

                                {/* Dropdown menu for picking group specifically for THIS boss with real-time occupancy status */}
                                {isDropdownOpen && (
                                  <div className="absolute left-0 top-full mt-1 w-80 bg-[#0a0e18] border-2 border-cyan-500 rounded-xl shadow-2xl p-2.5 z-40 space-y-2 animate-fade-in font-mono text-xs">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[10px] text-cyan-300 font-bold uppercase">
                                      <span className="truncate pr-1">
                                        Группы палилок ({boss.name}):
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setOpenAccountDropdownBossId(null)}
                                        className="text-slate-400 hover:text-white p-0.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Groups list with character preview and OCCUPANCY indicator for this boss - ONLY groups with characters on this boss */}
                                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                                      {availableGroupsForBoss.length === 0 ? (
                                        <div className="p-3 text-center text-slate-400 text-[11px]">
                                          Нет групп с палилкой на этого босса
                                        </div>
                                      ) : (
                                        availableGroupsForBoss.map((grp) => {
                                          const isCurrentGrp = effectiveAuthorGroup === grp;
                                          const grpMatch = findAccountInAuthorGroupForBoss(
                                            boss,
                                            grp,
                                            allAccounts
                                          );
                                          const grpAcc = grpMatch?.account;
                                          const grpOcc = grpAcc
                                            ? accountOccupancies[grpAcc.groupId]
                                            : undefined;
                                          const isGrpOccupied = !!grpOcc;

                                          return (
                                            <button
                                              key={grp}
                                              type="button"
                                              onClick={() => {
                                                setBossAuthorGroup(boss.id, grp);
                                                setOpenAccountDropdownBossId(null);
                                                if (onShowToast) {
                                                  onShowToast(
                                                    `Для ${boss.name} выбрана группа [${grp}] (персонаж: ${grpMatch?.characterName || 'привязан'})`
                                                  );
                                                }
                                              }}
                                              className={`w-full p-2 rounded-lg text-left transition-all border flex flex-col gap-1 ${
                                                isCurrentGrp
                                                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-100 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                                  : isGrpOccupied
                                                  ? 'bg-[#180b0e] border-red-800/80 text-red-200 hover:border-red-500'
                                                  : 'bg-[#0f1422] border-slate-800 text-slate-300 hover:border-cyan-500/70 hover:bg-[#141b2c]'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="flex items-center gap-1.5">
                                                  <span>📁 {grp}</span>
                                                  {isCurrentGrp && (
                                                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-800 text-cyan-200">
                                                      Выбрана
                                                    </span>
                                                  )}
                                                </span>

                                                {/* Occupancy Indicator */}
                                                {isGrpOccupied ? (
                                                  <span className="text-[9px] text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-950 border border-red-800">
                                                    🔴 Занято ({grpOcc.occupiedBy.nickname})
                                                  </span>
                                                ) : (
                                                  <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                                                    🟢 Свободно
                                                  </span>
                                                )}
                                              </div>

                                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/50">
                                                <span>
                                                  Ник: <b className="text-amber-300">{grpMatch?.characterName || boss.name}</b>
                                                </span>
                                                {grpMatch?.camCode && (
                                                  <span className="text-cyan-300 font-mono text-[9px]">
                                                    [{grpMatch.camCode}]
                                                  </span>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Occupancy or login button */}
                              {isGroupOccupied ? (
                                <div className="flex items-center justify-between text-[10px] font-mono text-red-200/90 pt-0.5">
                                  <span className="truncate max-w-[105px]" title={occupancy.occupiedBy.nickname}>
                                    {occupancy.occupiedBy.nickname} <b className="text-amber-300">({occupancy.activeCamCode})</b>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => releaseAccount(account.groupId)}
                                    className="text-red-400 hover:text-red-200 underline text-[9px] shrink-0 font-bold ml-1 cursor-pointer"
                                    title="Освободить аккаунт"
                                  >
                                    Выйти
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                                  <span className="truncate max-w-[95px] select-all font-bold text-amber-300">
                                    {account.login}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyCredentialsWithOccupancy(
                                        account,
                                        displayCharName,
                                        displayCamCode
                                      )
                                    }
                                    className="text-amber-400 hover:text-amber-300 font-bold text-[9px] shrink-0 ml-1 px-1 rounded bg-[#0a0f1c] border border-slate-700 cursor-pointer"
                                    title="Скопировать логин и пароль"
                                  >
                                    Логин
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono text-xs">—</span>
                          )
                        ) : (
                          // For Viewers: Lock indicator
                          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                            {boss.camCode ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px]">
                                {boss.camCode}
                              </span>
                            ) : null}
                            <span className="text-[10px] text-slate-600 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-600" />
                              <span>Скрыто</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 3. RAID BOSS COLUMN WITH SPAWN ALERT GRADUAL PULSATION & ONLY CHOSEN GROUP CHARACTER */}
                      <td
                        className={`py-2 px-3 border-r border-slate-800/60 font-sans transition-all relative overflow-hidden ${
                          isSpawnAlertActive ? 'spawn-alert-active' : ''
                        }`}
                      >
                        {/* Gradual pulsation smooth breathing aura */}
                        {isSpawnAlertActive && <div className="spawn-aura-pulse" />}

                        <div className="flex flex-col gap-1 relative z-10">
                          {/* Top line: Boss Name + Spawn Alert & Cancel Buttons */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="font-bold text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5 min-w-0">
                              {isOpen && (
                                <span
                                  className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                  title="Окно открыто"
                                />
                              )}
                              <span
                                className="truncate font-semibold tracking-wide text-amber-200"
                                title={boss.name}
                              >
                                {boss.name}
                              </span>
                            </div>

                            {/* Right side of Boss Name: SPAWN ALERT & CANCEL BUTTONS */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Spawn alert button ("Оповестить") */}
                              <button
                                type="button"
                                onClick={() => handleTriggerSpawnAlert(boss)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                                  isSpawnAlertActive
                                    ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.9)] animate-pulse'
                                    : 'bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900 hover:to-amber-900 text-amber-300 border border-amber-600/60'
                                }`}
                                title="Оповестить о том, что босс заспавнился прямо сейчас! Нажимать можно неограниченно, таймер обновляется на 10 минут. Только для наблюдателей с трибуны."
                              >
                                <Flame
                                  className={`w-3.5 h-3.5 ${
                                    isSpawnAlertActive ? 'text-slate-950' : 'text-amber-400'
                                  }`}
                                />
                                <span>
                                  {isSpawnAlertActive
                                    ? `Оповещено (${formatMinSec(spawnAlertRemainingSec)})`
                                    : 'Оповестить'}
                                </span>
                              </button>

                              {/* Cancel button for Scout / Admin if active */}
                              {isSpawnAlertActive && isScoutOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelSpawnAlert(boss)}
                                  className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-600 transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                                  title="Отменить статус респа (ложная тревога / босса нет)"
                                >
                                  <RotateCcw className="w-3 h-3 text-red-300" />
                                  <span className="hidden sm:inline">Отменить</span>
                                </button>
                              )}

                              {/* Edit details for Scout / Admin */}
                              {isScoutOrAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setEditingBossDetails(boss)}
                                  className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-slate-800 transition-colors"
                                  title="Редактировать параметры босса"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bottom line: PROMINENT CHARACTER NAME FOR THIS SPOT WITH RED OCCUPANCY HIGHLIGHT */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (isScoutOrAdmin && account) {
                                  handleCopyCredentialsWithOccupancy(
                                    account,
                                    displayCharName,
                                    displayCamCode
                                  );
                                } else {
                                  if (onShowToast) onShowToast(`Персонаж на споте: ${displayCharName}`);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs tracking-wide transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                                isGroupOccupied
                                  ? 'bg-[#2b080d] hover:bg-[#3a0b12] border-2 border-red-500 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.55)] animate-pulse'
                                  : 'bg-[#0a1424] hover:bg-[#12223a] border border-cyan-500/80 hover:border-cyan-400 text-cyan-200 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              }`}
                              title={
                                isGroupOccupied
                                  ? `Аккаунт и персонаж занят пользователем: ${occupancy?.occupiedBy.nickname}. Нажмите для копирования логина или освобождения.`
                                  : isScoutOrAdmin
                                  ? `Персонаж на споте (группа: ${bossAuthorGroup}). Нажмите, чтобы скопировать логин и занять персонажа.`
                                  : `Персонаж на споте: ${displayCharName} (группа: ${bossAuthorGroup})`
                              }
                            >
                              {isGroupOccupied ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block shrink-0" />
                                  <span className="text-[11px] font-black text-red-300 font-sans uppercase">
                                    🔴 ЗАНЯТ [{occupancy?.occupiedBy.nickname}]:
                                  </span>
                                  <span className="text-white font-black underline decoration-red-400 decoration-2">
                                    [{displayCharName}]
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-cyan-400 font-sans font-semibold">
                                    👤 Персонаж:
                                  </span>
                                  <span className="text-amber-300 font-black">
                                    [{displayCharName}]
                                  </span>
                                </>
                              )}
                            </button>

                            {/* Quick Release Button if occupied */}
                            {isGroupOccupied && isScoutOrAdmin && account && (
                              <button
                                type="button"
                                onClick={() => releaseAccount(account.groupId)}
                                className="px-2 py-0.5 rounded bg-red-950 hover:bg-red-900 border border-red-600 text-red-200 text-[10px] font-mono font-bold hover:text-white transition-all shadow cursor-pointer shrink-0"
                                title="Освободить этого персонажа/аккаунт"
                              >
                                Освободить
                              </button>
                            )}

                            {boss.notes && (
                              <span
                                className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]"
                                title={boss.notes}
                              >
                                · {boss.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. TIME OF DEATH (TOD) COLUMN */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-center font-mono font-bold text-xs">
                        {boss.timeOfDeathTimestamp || boss.timeOfDeath ? (
                          <span
                            className={
                              isOpen
                                ? 'text-emerald-400 font-bold'
                                : 'text-red-400 font-bold'
                            }
                            title={`TOD в выбранном поясе (${activeTimezoneOption.shortLabel})`}
                          >
                            {boss.timeOfDeathTimestamp
                              ? formatTimeInTimezone(boss.timeOfDeathTimestamp, timezoneOffset, true)
                              : boss.timeOfDeath}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* 5. RESPAWN WINDOW COLUMN */}
                      <td className="py-2 px-2.5 border-r border-slate-800/60 text-center font-sans">
                        {isOpen && (
                          <div className="w-full max-w-[240px] mx-auto py-1 px-2 rounded bg-[#072416] border border-emerald-500/80 text-emerald-100 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 uppercase">
                              <span>🟢 ОКНО ОТКРЫТО</span>
                              <span className="font-mono">
                                {formatTimer(boss.secondsRemainingInWindow)}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-bold font-mono text-emerald-100 tracking-wide">
                              {boss.windowStartTimestamp && boss.windowEndTimestamp
                                ? `${formatTimeInTimezone(boss.windowStartTimestamp, timezoneOffset)} — ${formatTimeInTimezone(boss.windowEndTimestamp, timezoneOffset)}`
                                : `${boss.windowStart} — ${boss.windowEnd}`}
                            </div>
                          </div>
                        )}

                        {isWaiting && (
                          <div className="w-full max-w-[240px] mx-auto py-1 px-2 rounded bg-[#24090c] border border-red-600/80 text-red-100 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-red-300 uppercase">
                              <span>🔴 ДО РЕСПАУНА</span>
                              <span className="font-mono">
                                через {formatTimer(boss.secondsUntilWindow)}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-bold font-mono text-red-100 tracking-wide">
                              {boss.windowStartTimestamp && boss.windowEndTimestamp
                                ? `${formatTimeInTimezone(boss.windowStartTimestamp, timezoneOffset)} — ${formatTimeInTimezone(boss.windowEndTimestamp, timezoneOffset)}`
                                : `${boss.windowStart} — ${boss.windowEnd}`}
                            </div>
                          </div>
                        )}

                        {isExpired && (
                          <div className="w-full max-w-[240px] mx-auto py-1 px-2 rounded bg-[#201407] border border-amber-600/80 text-amber-200 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase">
                              <span>ОКНО ЗАКРЫЛОСЬ</span>
                              <span className="text-[9px] font-mono">ПРОСРОЧЕН</span>
                            </div>
                            <div className="text-xs font-mono text-amber-100">
                              {boss.windowStartTimestamp && boss.windowEndTimestamp
                                ? `${formatTimeInTimezone(boss.windowStartTimestamp, timezoneOffset)} — ${formatTimeInTimezone(boss.windowEndTimestamp, timezoneOffset)}`
                                : `${boss.windowStart} — ${boss.windowEnd}`}
                            </div>
                          </div>
                        )}

                        {isNoData && (
                          <div className="w-full max-w-[240px] mx-auto py-1.5 px-2 rounded bg-[#0e121a] border border-slate-800 text-slate-500 text-[10px] font-mono">
                            ⚪ Нет TOD ({boss.minCooldownHours}–{boss.maxCooldownHours} ч)
                          </div>
                        )}
                      </td>

                      {/* 6. SPOTTER ON CAMERA COLUMN (WITH READY CHECK) */}
                      <td className="py-2 px-2 border-r border-slate-800/60 text-center font-sans">
                        {boss.assignedSpotter ? (
                          isReadyCheckActive ? (
                            // URGENT READY CHECK BANNER
                            <div className="w-full max-w-[170px] mx-auto py-1.5 px-2 rounded-xl bg-[#280a0f] border-2 border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.6)] animate-pulse text-left space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-red-200 font-mono">
                                <span className="flex items-center gap-1 text-red-300">
                                  <Radio className="w-3.5 h-3.5 animate-spin" />
                                  <span>РАДИО-ПРОВЕРКА!</span>
                                </span>
                                <span className="text-amber-300 font-black">
                                  {formatMinSec(readyCheckRemainingSec)}
                                </span>
                              </div>

                              <div className="text-xs font-bold text-white truncate" title={boss.assignedSpotter.nickname}>
                                {boss.assignedSpotter.nickname} ({boss.assignedSpotter.level} ур.)
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  audioManager.stopReadyCheckRadio();
                                  confirmReadyCheck(boss.id);
                                  audioManager.playClickSound();
                                }}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-1 active:scale-95 cursor-pointer ring-1 ring-emerald-300"
                                title="Подтвердить, что вы стоите на споте (мгновенно выключает аудио рации)"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>ПОДТВЕРДИТЬ (Я ТУТ)</span>
                              </button>
                            </div>
                          ) : (
                            // NORMAL SPOTTER CARD WITH READY CHECK BUTTON
                            <div className="w-full max-w-[170px] mx-auto py-1 px-2 rounded-xl bg-[#0e1420] border border-emerald-500/40 text-left text-xs space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-emerald-400 font-bold">🟢 НА СПОТЕ</span>
                                <span className="text-[9px] text-slate-400 font-mono">[{boss.assignedSpotter.clanName}]</span>
                              </div>
                              <div className="text-xs font-bold text-slate-100 truncate" title={boss.assignedSpotter.nickname}>
                                {boss.assignedSpotter.nickname} ({boss.assignedSpotter.level} ур.)
                              </div>
                              <div className="text-[9px] text-slate-400 truncate">
                                {boss.assignedSpotter.className}
                              </div>

                              {/* Ready Check Trigger Button (Scouts & Admins only) */}
                              <button
                                type="button"
                                onClick={() => handleTriggerReadyCheck(boss)}
                                className={`w-full mt-1 py-0.5 px-1.5 rounded text-[10px] font-bold font-mono transition-colors flex items-center justify-center gap-1 ${
                                  isScoutOrAdmin
                                    ? 'bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 text-amber-200 active:scale-95 cursor-pointer'
                                    : 'bg-slate-900/90 border border-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                                title={
                                  isScoutOrAdmin
                                    ? 'Вызвать Ready Check. Запустит радио-проверку для споттера и 10-минутный таймер'
                                    : 'Только Скаут или КЛ (Админ) может отправлять Ready Check'
                                }
                              >
                                <Radio className={`w-3 h-3 ${isScoutOrAdmin ? 'text-amber-400' : 'text-slate-600'}`} />
                                <span>Ready Check</span>
                              </button>

                              {(boss.assignedSpotter.nickname === activeChar?.nickname || isScoutOrAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => leaveSpot(boss.id)}
                                  className="text-[9px] text-red-400 hover:text-red-300 font-bold block pt-0.5 text-center w-full"
                                  title="Освободить спот"
                                >
                                  Покинуть спот
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSpotSelectBoss(boss)}
                            className="w-full max-w-[170px] mx-auto py-1.5 px-2 rounded-xl bg-[#0f1522] hover:bg-[#162034] border border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-amber-200 text-[11px] font-bold transition-colors shadow-sm"
                            title="Выбрать персонажа и встать на спот"
                          >
                            + Встать на спот
                          </button>
                        )}
                      </td>

                      {/* 7. SCOUT / ADMIN TOD ACTIONS */}
                      {isScoutOrAdmin && (
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setBossDeathNow(boss.id)}
                              className="px-2 py-1.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-500/60 text-amber-200 font-bold text-[10px] uppercase transition-colors"
                              title="Зафиксировать TOD прямо сейчас"
                            >
                              СЕЙЧАС
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditTod(boss)}
                              className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Ввести TOD вручную"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {boss.timeOfDeath && (
                              <button
                                type="button"
                                onClick={() => resetBoss(boss.id)}
                                className="p-1.5 rounded bg-slate-900 hover:bg-red-950/60 border border-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                                title="Сбросить TOD"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-[#080a0f] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Показано боссов: <b className="text-amber-300">{filteredBosses.length}</b> из {bosses.length}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Зеленый = Окно открыто
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Красный = До респауна
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            {role === 'admin'
              ? '👑 Режим Администратора (КЛ)'
              : role === 'scout'
              ? '🛡️ Режим Скаута / Шерифа'
              : '👁️ Режим Наблюдателя'}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COPIED CREDENTIALS FLOATING TOAST */}
      {/* ------------------------------------------------------------- */}
      {copiedCredentialToast && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#090e18] border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)] text-xs font-mono space-y-1 animate-fade-in max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-cyan-300 text-[11px]">
              {copiedCredentialToast.groupName}
            </span>
            <button
              onClick={() => setCopiedCredentialToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-slate-300 text-[10px]">
            Персонаж: <b className="text-amber-300">{copiedCredentialToast.charName}</b>
          </div>
          <div className="flex items-center justify-between bg-black/60 p-1 rounded border border-slate-800">
            <span className="text-slate-400">Логин:</span>
            <span className="font-bold text-amber-300 select-all">{copiedCredentialToast.login}</span>
          </div>
          <div className="flex items-center justify-between bg-black/60 p-1 rounded border border-slate-800">
            <span className="text-slate-400">Пароль:</span>
            <span className="font-bold text-cyan-200 select-all">{copiedCredentialToast.password}</span>
          </div>
          <div className="text-[9px] text-emerald-400 font-bold pt-0.5">
            ✓ Логин скопирован в буфер обмена!
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM TOD EDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none">
          <div className="w-full max-w-sm bg-[#0e121a] border-2 border-amber-500/70 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold font-serif text-amber-200 text-sm">
                  ВРЕМЯ СМЕРТИ (TOD)
                </h3>
              </div>
              <button
                onClick={() => setEditingBoss(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200 font-sans">{editingBoss.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Уровень: {editingBoss.level} · Респ: {editingBoss.minCooldownHours}–{editingBoss.maxCooldownHours} ч
              </div>
            </div>

            <form onSubmit={handleSaveCustomTod} className="space-y-3 font-mono">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-sans">
                  Введите время смерти (ЧЧ:ММ:СС или ЧЧ:ММ):
                </label>
                <input
                  type="text"
                  required
                  value={customTodInput}
                  onChange={(e) => setCustomTodInput(e.target.value)}
                  placeholder="23:15:00"
                  className="w-full px-3 py-2 bg-[#080a0f] border border-slate-700 rounded-lg text-amber-300 font-bold text-center tracking-widest focus:outline-none focus:border-amber-400 text-base"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] text-slate-950 font-bold font-serif uppercase tracking-wider text-xs shadow-md"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBoss(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-sans"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SPOT SELECTOR MODAL (CHOOSE FROM USER'S CHARACTER ROSTER) */}
      {/* ------------------------------------------------------------- */}
      {spotSelectBoss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none font-sans">
          <div className="w-full max-w-md bg-[#0a0e18] border-2 border-emerald-500/70 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] p-4 sm:p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/70 flex items-center justify-center text-emerald-300">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-emerald-200 text-sm sm:text-base uppercase tracking-wider">
                    ВСТАТЬ НА СПОТ БОССА
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    [{spotSelectBoss.level} ур.] {spotSelectBoss.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSpotSelectBoss(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Выберите персонажа для спота:</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {characters.length} доступно
                </span>
              </label>
              <p className="text-[11px] text-slate-400">
                Выберите персонажа из вашего списка, который наблюдает за респом босса.
              </p>
            </div>

            {/* Character Selection Cards */}
            <div className="space-y-2 overflow-y-auto max-h-60 pr-1 scrollbar-thin">
              {characters.map((char) => {
                const isSelected =
                  (selectedSpotterCharId || activeChar?.id) === char.id;

                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedSpotterCharId(char.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0e241b] border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-[#090d16] border-slate-700/80 hover:border-emerald-500/60 hover:bg-[#0f1624]'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-300 text-xs sm:text-sm truncate">
                          {char.nickname}
                        </span>
                        {char.isMain && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600/60 text-amber-300 text-[9px] font-mono font-bold">
                            МЕЙН
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 text-[9px] font-mono">
                          {char.levelNumber || char.approxLevel || 75} ур.
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {char.className} · [{char.clanName || 'Pay2KILL'}]
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-slate-600">
                      {isSelected ? (
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const targetId = selectedSpotterCharId || activeChar?.id || characters[0]?.id;
                  const chosenChar =
                    characters.find((c) => c.id === targetId) ||
                    activeChar || {
                      id: 'def_scout',
                      nickname: 'Scout_Me',
                      className: 'Silver Ranger',
                      levelNumber: 75,
                      clanName: 'Pay2KILL',
                    };

                  occupySpot(spotSelectBoss.id, {
                    nickname: chosenChar.nickname,
                    className: chosenChar.className,
                    level: chosenChar.levelNumber || 75,
                    clanName: chosenChar.clanName || 'Pay2KILL',
                  });

                  if (chosenChar.id) {
                    setActiveCharacter(chosenChar.id);
                  }

                  setSpotSelectBoss(null);
                  if (onShowToast) {
                    onShowToast(
                      `Персонаж ${chosenChar.nickname} (${chosenChar.className}) встал на спот ${spotSelectBoss.name}!`
                    );
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 text-white font-bold font-serif uppercase tracking-wider text-xs shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Подтвердить спот</span>
              </button>
              <button
                type="button"
                onClick={() => setSpotSelectBoss(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans font-bold cursor-pointer transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEWER LOCKED MODAL */}
      {/* ------------------------------------------------------------- */}
      {viewerLockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none">
          <div className="w-full max-w-sm bg-[#0e121a] border-2 border-red-500/80 rounded-2xl shadow-2xl p-5 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950 border border-red-500 flex items-center justify-center text-red-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-red-200 text-base">
                ДОСТУП ОГРАНИЧЕН
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Логины и пароли от камер наблюдения доступны только <b>Скаутам (Шерифам)</b> и <b>Администраторам (КЛу)</b>.
              </p>
            </div>
            <button
              onClick={() => setViewerLockedModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-serif"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOSS DETAILS EDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      <BossEditModal
        isOpen={!!editingBossDetails}
        onClose={() => setEditingBossDetails(null)}
        boss={editingBossDetails}
      />

      {/* ------------------------------------------------------------- */}
      {/* SPAWN ALERT LOGS AUDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      <SpawnAlertLogsModal
        isOpen={isGlobalLogsModalOpen}
        onClose={() => setIsGlobalLogsModalOpen(false)}
        onShowToast={onShowToast}
      />
    </div>
  );
}
