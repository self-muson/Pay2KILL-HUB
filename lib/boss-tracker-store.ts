'use client';

import { create } from 'zustand';
import { TrackerBoss, TrackerRole, SpectatorUser, CameraAccountCharacter, SpawnAlertLogEntry } from './boss-tracker-types';
import { buildInitialBosses, calculateRespawnTimestamps, getBossCooldownRange } from './boss-tracker-data';
import { AccountOccupancy, CAMERA_ACCOUNTS, CameraAccount, normalizeCamCode, CUSTOM_ACCOUNTS_STORAGE_KEY } from './camera-accounts-data';
import { audioManager } from './audio-manager';

const ROLE_STORAGE_KEY = 'tl_alliance_role';
const PIN_STORAGE_KEY = 'tl_alliance_pin_verified';
const PIN_VERSION_KEY = 'tl_alliance_pin_version';
const SELECTED_GROUP_STORAGE_KEY = 'p2k_selected_camera_group_v2';

export interface RolePinsConfig {
  viewerPin: string; // default '1111'
  scoutPin: string;  // default '1555'
  adminPin: string;  // default '1234'
  pinVersion: number;
}

const DEFAULT_PINS_CONFIG: RolePinsConfig = {
  viewerPin: '1111',
  scoutPin: '1555',
  adminPin: '1234',
  pinVersion: 1,
};

const INITIAL_SPECTATORS: SpectatorUser[] = [];

interface BossTrackerState {
  bosses: TrackerBoss[];
  role: TrackerRole;
  isPinVerified: boolean;
  pinsConfig: RolePinsConfig;
  spectators: SpectatorUser[];
  mySpectatorId: string;
  kickSpectator: (spectatorId: string) => void;
  filterLevel: string; // 'ALL' | '20-29' | '30-39' | '40-49' | '50-56'
  filterPhase: string; // 'ALL' | 'WINDOW_OPEN' | 'WAITING_WINDOW' | 'NO_DATA'
  searchQuery: string;

  // Sound settings
  soundVolume: number;
  isMuted: boolean;
  setSoundVolume: (vol: number) => void;
  toggleSoundMute: () => void;

  // Boss Spawn Alert & Ready Check
  spawnAlertLogs: SpawnAlertLogEntry[];
  triggerSpawnAlert: (bossId: string, pressedBy?: { nickname: string; className: string; level: number; clanName: string; role: TrackerRole }) => Promise<void>;
  cancelSpawnAlert: (bossId: string, cancelledBy?: { nickname: string; role: TrackerRole }) => Promise<void>;
  clearSpawnLogs: () => void;
  triggerReadyCheck: (bossId: string, requestedBy?: string, userNickname?: string) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  confirmReadyCheck: (bossId: string) => Promise<void>;

  // Server Synchronization
  fetchServerBossState: () => Promise<void>;

  // Actions
  verifyPin: (pin: string) => Promise<{ success: boolean; role?: TrackerRole; message?: string }>;
  setSessionFromPin: (session: {
    role: 'member' | 'scout' | 'admin';
    isAdmin: boolean;
    isScout: boolean;
    pinVersion?: number;
  }) => void;
  logoutPin: () => void;
  updateRolePin: (targetRole: 'viewer' | 'scout' | 'admin', newPin: string) => void;
  updateAllPinsOnServer: (pins: {
    pinCode?: string;
    adminPinCode?: string;
    bossViewerPin?: string;
    bossScoutPin?: string;
    bossAdminPin?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  forceLogoutAllSessions: () => Promise<void>;

  setBossDeathNow: (bossId: string, authorNick?: string) => Promise<void>;
  setBossDeathCustom: (bossId: string, todStr: string, authorNick?: string, todTimestamp?: number) => Promise<void>;
  resetBoss: (bossId: string) => Promise<void>;
  recalculateAllPhases: () => void;
  setFilterLevel: (lvl: string) => void;
  setFilterPhase: (phase: string) => void;
  setSearchQuery: (query: string) => void;
  syncUserCharacterToSpectator: (char: { nickname: string; className: string; level: number; clanName: string }) => Promise<void>;
  occupySpot: (bossId: string, char: { nickname: string; className: string; level: number; clanName: string }) => Promise<{ success: boolean; error?: string }>;
  leaveSpot: (bossId: string, userNick?: string) => Promise<void>;
  updateBossDetails: (bossId: string, updates: { name: string; level: number; camCode?: string; notes?: string; link?: string }) => Promise<void>;
  addNewBoss: (bossData: { name: string; level: number; camCode?: string; notes?: string; link?: string }) => Promise<void>;
  deleteBoss: (bossId: string) => Promise<void>;

  // Camera Account Multi-Character Locking & Management
  accountOccupancies: Record<number, AccountOccupancy>;
  customAccounts: CameraAccount[];
  occupyAccount: (
    groupId: number,
    camCode: string,
    user: { nickname: string; className: string; level: number; clanName: string }
  ) => Promise<void>;
  releaseAccount: (groupId: number) => Promise<void>;
  addCustomAccount: (data: {
    authorGroup: string;
    groupName: string;
    login: string;
    password: string;
    characters: CameraAccountCharacter[];
  }) => Promise<void>;
  deleteCustomAccount: (groupId: number) => Promise<void>;
  deleteAuthorGroup: (groupName: string) => Promise<void>;
  updateCustomAccount: (groupId: number, data: Partial<CameraAccount>) => Promise<void>;
  setSelectedAccountForBoss: (bossId: string, accountId: number, characterName?: string, camCode?: string) => void;
  setBossAuthorGroup: (bossId: string, group: string) => void;
  selectedCameraGroup: string;
  setSelectedCameraGroup: (group: string) => void;
  hydrateFromStorage: () => void;
  fetchPinsConfigFromServer: () => Promise<RolePinsConfig | null>;
}

export const useBossTrackerStore = create<BossTrackerState>((set, get) => {
  return {
    bosses: buildInitialBosses(),
    role: 'viewer',
    isPinVerified: true,
    pinsConfig: DEFAULT_PINS_CONFIG,
    spectators: INITIAL_SPECTATORS,
    mySpectatorId: 'my_spec_' + Math.random().toString(36).substring(2, 8),
    filterLevel: 'ALL',
    filterPhase: 'ALL',
    searchQuery: '',
    soundVolume: 0.8,
    isMuted: false,
    accountOccupancies: {},
    customAccounts: [],
    spawnAlertLogs: [],
    selectedCameraGroup: 'Qox',

    fetchServerBossState: async () => {
      try {
        const res = await fetch('/api/bosses');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.bosses)) {
            const initial = buildInitialBosses();
            const mySpecId = get().mySpectatorId;

            const merged = initial.map((initBoss) => {
              const sBoss = (data.bosses || []).find((b: TrackerBoss) => b.id === initBoss.id);
              if (sBoss) {
                return {
                  ...initBoss,
                  timeOfDeath: sBoss.timeOfDeath,
                  timeOfDeathTimestamp: sBoss.timeOfDeathTimestamp,
                  windowStart: sBoss.windowStart,
                  windowEnd: sBoss.windowEnd,
                  windowStartTimestamp: sBoss.windowStartTimestamp,
                  windowEndTimestamp: sBoss.windowEndTimestamp,
                  phase: sBoss.phase,
                  secondsUntilWindow: sBoss.secondsUntilWindow,
                  secondsRemainingInWindow: sBoss.secondsRemainingInWindow,
                  assignedSpotter: sBoss.assignedSpotter || null,
                  spawnAlertUntil: sBoss.spawnAlertUntil,
                  readyCheckUntil: sBoss.readyCheckUntil,
                  readyCheckBy: sBoss.readyCheckBy,
                  notes: sBoss.notes || initBoss.notes,
                  name: sBoss.name || initBoss.name,
                  camCode: sBoss.camCode || initBoss.camCode,
                  selectedAuthorGroup: sBoss.selectedAuthorGroup || initBoss.selectedAuthorGroup,
                  selectedAccountId: sBoss.selectedAccountId || initBoss.selectedAccountId,
                  selectedCharacterName: sBoss.selectedCharacterName || initBoss.selectedCharacterName,
                  selectedCamCode: sBoss.selectedCamCode || initBoss.selectedCamCode,
                };
              }
              return initBoss;
            });

            const customBosses = (data.bosses || []).filter(
              (b: TrackerBoss) => !initial.some((init) => init.id === b.id)
            );

            // Mark which spectator is ME in the spectators list
            const rawSpectators: SpectatorUser[] = (data.spectators || []).map((s: SpectatorUser) => ({
              ...s,
              isMe: s.id === mySpecId,
            }));

            set({
              bosses: [...merged, ...customBosses],
              spectators: rawSpectators,
              accountOccupancies: data.accountOccupancies || {},
              customAccounts: data.customAccounts || [],
              spawnAlertLogs: data.spawnAlertLogs || [],
            });
          }
        }
      } catch {
        // Transient network error or server reboot during polling, ignore silently
      }
    },

    hydrateFromStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        let savedRole: TrackerRole = 'viewer';
        let isSavedVerified = false;

        const allianceVerified = localStorage.getItem(PIN_STORAGE_KEY) === 'true';
        const allianceRole = localStorage.getItem(ROLE_STORAGE_KEY);

        if (allianceVerified) {
          isSavedVerified = true;
          if (allianceRole === 'admin') savedRole = 'admin';
          else if (allianceRole === 'scout') savedRole = 'scout';
          else savedRole = 'viewer';
        }

        // Clean up any legacy localStorage keys to prevent loop invalidations
        localStorage.removeItem('p2k_boss_tracker_pin_v2');
        localStorage.removeItem('p2k_boss_tracker_role_v2');
        localStorage.removeItem('p2k_boss_tracker_pin_version_v2');

        const storedGroup = localStorage.getItem(SELECTED_GROUP_STORAGE_KEY) || 'Qox';

        let initialPinsConfig = DEFAULT_PINS_CONFIG;
        const cachedPins = localStorage.getItem('tl_alliance_pins_config');
        if (cachedPins) {
          try {
            initialPinsConfig = { ...DEFAULT_PINS_CONFIG, ...JSON.parse(cachedPins) };
          } catch {}
        }

        set({
          role: savedRole,
          isPinVerified: true,
          pinsConfig: initialPinsConfig,
          selectedCameraGroup: storedGroup,
          soundVolume: audioManager.getVolume(),
          isMuted: audioManager.getIsMuted(),
        });

        if (savedRole === 'admin') {
          void get().fetchPinsConfigFromServer();
        }

        // Trigger immediate fetch from server to get latest TODs, spotters, and spectators
        void get().fetchServerBossState();
      } catch (e) {
        console.error('Failed to hydrate tracker state', e);
      }
    },

    setSoundVolume: (vol: number) => {
      audioManager.setVolume(vol);
      set({ soundVolume: vol, isMuted: vol === 0 });
    },

    toggleSoundMute: () => {
      const nextMuted = audioManager.toggleMute();
      set({ isMuted: nextMuted });
    },

    triggerSpawnAlert: async (bossId, pressedBy) => {
      try {
        const charData = pressedBy || {
          nickname: 'Скаут',
          className: 'Warlock',
          level: 75,
          clanName: 'Pay2KILL',
          role: get().role,
        };
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trigger_spawn_alert', bossId, pressedBy: charData }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    cancelSpawnAlert: async (bossId, cancelledBy) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel_spawn_alert', bossId, cancelledBy }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    clearSpawnLogs: () => {
      set({ spawnAlertLogs: [] });
    },

    triggerReadyCheck: async (bossId, requestedBy) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'trigger_ready_check',
            bossId,
            requestedBy: requestedBy || 'Скаут',
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await get().fetchServerBossState();
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером' };
      }
    },

    confirmReadyCheck: async (bossId: string) => {
      try {
        audioManager.stopReadyCheckRadio();
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm_ready_check', bossId }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    verifyPin: async (pin: string) => {
      const cleaned = pin.trim();
      try {
        const res = await fetch('/api/lfg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_pin', pin: cleaned }),
        });
        const data = await res.json();

        if (data.isValid) {
          const roleStr: TrackerRole = data.isAdmin ? 'admin' : data.isScout ? 'scout' : 'viewer';
          const unifiedRole = data.role || (data.isAdmin ? 'admin' : data.isScout ? 'scout' : 'member');

          if (typeof window !== 'undefined') {
            localStorage.setItem(ROLE_STORAGE_KEY, unifiedRole);
            localStorage.setItem(PIN_STORAGE_KEY, 'true');
            localStorage.setItem(PIN_VERSION_KEY, String(data.pinVersion || 1));
            localStorage.setItem('tl_alliance_is_admin', data.isAdmin ? 'true' : 'false');
            localStorage.setItem('tl_alliance_is_scout', data.isScout ? 'true' : 'false');
            localStorage.removeItem('p2k_boss_tracker_pin_v2');
            localStorage.removeItem('p2k_boss_tracker_role_v2');
            localStorage.removeItem('p2k_boss_tracker_pin_version_v2');
          }
          set({ isPinVerified: true, role: roleStr });

          if (roleStr === 'admin') {
            void get().fetchPinsConfigFromServer();
          }

          let roleMsg = 'Клан мембер (Просмотр таймеров и спотов)';
          if (roleStr === 'admin') roleMsg = 'Лидер Клана (КЛ)';
          else if (roleStr === 'scout') roleMsg = 'Скаут / Рейд Лидер (Доступ к камерам и TOD)';

          await get().fetchServerBossState();
          return { success: true, role: roleStr, message: `Авторизован как ${roleMsg}` };
        } else {
          return {
            success: false,
            message: 'Неверный PIN-код. Обратитесь к КЛу за актуальным кодом доступа.',
          };
        }
      } catch (e) {
        return { success: false, message: 'Ошибка связи с сервером.' };
      }
    },

    setSessionFromPin: (session: {
      role: 'member' | 'scout' | 'admin';
      isAdmin: boolean;
      isScout: boolean;
      pinVersion?: number;
    }) => {
      const roleStr: TrackerRole = session.isAdmin ? 'admin' : session.isScout ? 'scout' : 'viewer';
      if (typeof window !== 'undefined') {
        localStorage.setItem(ROLE_STORAGE_KEY, session.role);
        localStorage.setItem(PIN_STORAGE_KEY, 'true');
        if (session.pinVersion) {
          localStorage.setItem(PIN_VERSION_KEY, String(session.pinVersion));
        }
        localStorage.setItem('tl_alliance_is_admin', session.isAdmin ? 'true' : 'false');
        localStorage.setItem('tl_alliance_is_scout', session.isScout ? 'true' : 'false');
        localStorage.removeItem('p2k_boss_tracker_pin_v2');
        localStorage.removeItem('p2k_boss_tracker_role_v2');
        localStorage.removeItem('p2k_boss_tracker_pin_version_v2');
      }
      set({ isPinVerified: true, role: roleStr });
      if (roleStr === 'admin') {
        void get().fetchPinsConfigFromServer();
      }
      void get().fetchServerBossState();
    },

    logoutPin: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(PIN_STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
        localStorage.removeItem('tl_alliance_is_admin');
        localStorage.removeItem('tl_alliance_is_scout');
        localStorage.removeItem('p2k_boss_tracker_pin_v2');
        localStorage.removeItem('p2k_boss_tracker_role_v2');
        localStorage.removeItem('p2k_boss_tracker_pin_version_v2');
      }
      set({ isPinVerified: false, role: 'viewer' });
    },

    updateRolePin: () => {},

    fetchPinsConfigFromServer: async () => {
      try {
        const res = await fetch('/api/lfg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_admin_pins', isAdmin: true }),
        });
        const data = await res.json();
        if (res.ok && data.pinsConfig) {
          set({ pinsConfig: data.pinsConfig });
          if (typeof window !== 'undefined') {
            localStorage.setItem('tl_alliance_pins_config', JSON.stringify(data.pinsConfig));
          }
          return data.pinsConfig;
        }
      } catch (e) {
        console.error('Failed to fetch pins config:', e);
      }
      return null;
    },

    updateAllPinsOnServer: async (pins) => {
      try {
        const res = await fetch('/api/lfg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_all_pins',
            isAdmin: true,
            memberPin: pins.bossViewerPin || pins.pinCode,
            scoutPin: pins.bossScoutPin,
            adminPin: pins.bossAdminPin || pins.adminPinCode,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          const newPinsConfig: RolePinsConfig = {
            viewerPin: pins.bossViewerPin || pins.pinCode || get().pinsConfig.viewerPin,
            scoutPin: pins.bossScoutPin || get().pinsConfig.scoutPin,
            adminPin: pins.bossAdminPin || pins.adminPinCode || get().pinsConfig.adminPin,
            pinVersion: data.pinsConfig?.pinVersion || data.state?.pinVersion || (get().pinsConfig.pinVersion + 1),
          };
          if (data.pinsConfig) {
            newPinsConfig.viewerPin = data.pinsConfig.viewerPin;
            newPinsConfig.scoutPin = data.pinsConfig.scoutPin;
            newPinsConfig.adminPin = data.pinsConfig.adminPin;
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem(PIN_VERSION_KEY, String(newPinsConfig.pinVersion));
            localStorage.setItem('tl_alliance_pins_config', JSON.stringify(newPinsConfig));
          }
          set({ pinsConfig: newPinsConfig });
          return { success: true };
        }
        return { success: false, error: data.error };
      } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером.' };
      }
    },

    forceLogoutAllSessions: async () => {
      try {
        const res = await fetch('/api/lfg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'force_logout_sessions', isAdmin: true }),
        });
        const data = await res.json();
        if (res.ok && data.state?.pinVersion) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(PIN_VERSION_KEY, String(data.state.pinVersion));
          }
          get().logoutPin();
        }
      } catch (e) {
        console.error(e);
      }
    },

    setBossDeathNow: async (bossId: string, authorNick?: string) => {
      try {
        const nowMs = Date.now();
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_tod_now', bossId, authorNick, todTimestamp: nowMs }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    setBossDeathCustom: async (bossId: string, todStr: string, authorNick?: string, todTimestamp?: number) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_tod_custom', bossId, todStr, authorNick, todTimestamp }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    resetBoss: async (bossId: string) => {
      audioManager.stopReadyCheckRadio();
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_boss', bossId }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    recalculateAllPhases: () => {
      const now = Date.now();
      const updated = get().bosses.map((boss) => {
        if (!boss.timeOfDeath && !boss.timeOfDeathTimestamp) return boss;
        const range = getBossCooldownRange(boss.level);
        const deathMs = boss.timeOfDeathTimestamp || (boss.timeOfDeath ? calculateRespawnTimestamps(boss.timeOfDeath, range.minCooldownHours, range.maxCooldownHours).timeOfDeathTimestamp : now);
        const startMs = boss.windowStartTimestamp || (deathMs + range.minCooldownHours * 3600 * 1000);
        const endMs = boss.windowEndTimestamp || (deathMs + range.maxCooldownHours * 3600 * 1000);

        let phase: any = 'NO_DATA';
        let secondsUntilWindow = 0;
        let secondsRemainingInWindow = 0;

        if (now < startMs) {
          phase = 'WAITING_WINDOW';
          secondsUntilWindow = Math.max(0, Math.floor((startMs - now) / 1000));
          secondsRemainingInWindow = Math.max(0, Math.floor((endMs - now) / 1000));
        } else if (now >= startMs && now <= endMs) {
          phase = 'WINDOW_OPEN';
          secondsUntilWindow = 0;
          secondsRemainingInWindow = Math.max(0, Math.floor((endMs - now) / 1000));
        } else {
          phase = 'WINDOW_EXPIRED';
          secondsUntilWindow = 0;
          secondsRemainingInWindow = 0;
        }

        return {
          ...boss,
          phase,
          secondsUntilWindow,
          secondsRemainingInWindow,
        };
      });
      set({ bosses: updated });
    },

    setFilterLevel: (lvl: string) => {
      set({ filterLevel: lvl });
    },

    setFilterPhase: (phase: string) => {
      set({ filterPhase: phase });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    syncUserCharacterToSpectator: async (char) => {
      try {
        const myId = get().mySpectatorId;
        const currentRole = get().role;
        const roleLabel = currentRole === 'admin' ? 'LEADER' : currentRole === 'scout' ? 'SPOTTER' : 'VIEWER';

        await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'heartbeat',
            spectator: {
              id: myId,
              nickname: char.nickname,
              className: char.className,
              level: char.level,
              clanName: char.clanName,
              role: roleLabel,
            },
          }),
        });
      } catch (e) {}
    },

    kickSpectator: (spectatorId: string) => {
      set((state) => ({
        spectators: state.spectators.filter((s) => s.id !== spectatorId),
      }));
    },

    occupySpot: async (bossId, char) => {
      audioManager.stopReadyCheckRadio();
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'occupy_spot',
            bossId,
            spotter: {
              nickname: char.nickname,
              className: char.className,
              level: char.level,
              clanName: char.clanName,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Спот уже занят другим мембером' };
        }
        await get().fetchServerBossState();
        return { success: true };
      } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером' };
      }
    },

    leaveSpot: async (bossId, userNick) => {
      audioManager.stopReadyCheckRadio();
      try {
        const isScoutOrAdmin = get().role === 'scout' || get().role === 'admin';
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave_spot',
            bossId,
            userNick,
            isScoutOrAdmin,
          }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    updateBossDetails: async (bossId, updates) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_boss_details', bossId, updates }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    addNewBoss: async (bossData) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_boss', bossData }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    deleteBoss: async (bossId: string) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_boss', bossId }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    occupyAccount: async (groupId, camCode, user) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'occupy_account', groupId, camCode, user }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    releaseAccount: async (groupId) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release_account', groupId }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    addCustomAccount: async (data) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_custom_account', accountData: data }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    deleteCustomAccount: async (groupId: number) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_custom_account', groupId }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    deleteAuthorGroup: async (groupName: string) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_author_group', groupName }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    updateCustomAccount: async (groupId, data) => {
      try {
        const res = await fetch('/api/bosses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_custom_account', groupId, accountData: data }),
        });
        if (res.ok) {
          await get().fetchServerBossState();
        }
      } catch (e) {
        console.error(e);
      }
    },

    setSelectedAccountForBoss: (bossId: string, accountId: number, characterName?: string, camCode?: string) => {
      const updated = get().bosses.map((b) =>
        b.id === bossId
          ? {
              ...b,
              selectedAccountId: accountId,
              selectedCharacterName: characterName,
              selectedCamCode: camCode,
            }
          : b
      );
      set({ bosses: updated });
      void fetch('/api/bosses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_boss_camera',
          bossId,
          data: {
            selectedAccountId: accountId,
            selectedCharacterName: characterName,
            selectedCamCode: camCode,
          },
        }),
      }).catch(() => {});
    },

    setBossAuthorGroup: (bossId: string, group: string) => {
      const updated = get().bosses.map((b) =>
        b.id === bossId ? { ...b, selectedAuthorGroup: group } : b
      );
      set({ bosses: updated });
      void fetch('/api/bosses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_boss_camera',
          bossId,
          data: { selectedAuthorGroup: group },
        }),
      }).catch(() => {});
    },

    setSelectedCameraGroup: (group: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(SELECTED_GROUP_STORAGE_KEY, group);
      }
      set({ selectedCameraGroup: group });
    },
  };
});
