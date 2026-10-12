import fs from 'fs';
import path from 'path';
import {
  TrackerBoss,
  BossSpotterInfo,
  SpectatorUser,
  SpawnAlertLogEntry,
  TrackerRole,
} from './boss-tracker-types';
import { buildInitialBosses, calculateRespawnTimestamps, getBossCooldownRange } from './boss-tracker-data';
import {
  CameraAccount,
  AccountOccupancy,
  CAMERA_ACCOUNTS,
  normalizeCamCode,
} from './camera-accounts-data';
import {
  saveBossStateToFirestore,
  getBossStateFromFirestore,
} from './firestore-sync';

const DATA_DIR = path.join(process.cwd(), 'data');

const DATA_FILE = path.join(DATA_DIR, 'boss-state.json');
const BACKUP_FILE = '/tmp/boss-state.json';

export interface BossServerState {
  bosses: TrackerBoss[];
  spectators: SpectatorUser[];
  accountOccupancies: Record<number, AccountOccupancy>;
  customAccounts: CameraAccount[];
  spawnAlertLogs: SpawnAlertLogEntry[];
  lastUpdated: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __p2k_boss_server_state: BossServerState | undefined;
}

function ensureDirSync(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function persistState() {
  try {
    ensureDirSync(DATA_DIR);
    const dataStr = JSON.stringify(globalThis.__p2k_boss_server_state);
    fs.writeFileSync(DATA_FILE, dataStr, 'utf8');
    fs.writeFileSync(BACKUP_FILE, dataStr, 'utf8');
  } catch {
    try {
      if (globalThis.__p2k_boss_server_state) {
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(globalThis.__p2k_boss_server_state), 'utf8');
      }
    } catch {
      // ignore
    }
  }

  // Asynchronously sync to Cloud Firestore
  try {
    if (globalThis.__p2k_boss_server_state) {
      void saveBossStateToFirestore(globalThis.__p2k_boss_server_state);
    }
  } catch {}
}

export function mergeIncomingBossState(incoming: BossServerState): void {
  const state = getStateRef();
  if (!incoming || !Array.isArray(incoming.bosses)) return;

  const initial = buildInitialBosses();
  const mergedBosses = initial.map((initBoss) => {
    const saved = incoming.bosses.find((b: TrackerBoss) => b.id === initBoss.id);
    if (saved) {
      return {
        ...initBoss,
        timeOfDeath: saved.timeOfDeath,
        timeOfDeathTimestamp: saved.timeOfDeathTimestamp,
        windowStart: saved.windowStart,
        windowEnd: saved.windowEnd,
        windowStartTimestamp: saved.windowStartTimestamp,
        windowEndTimestamp: saved.windowEndTimestamp,
        phase: saved.phase || 'NO_DATA',
        secondsUntilWindow: saved.secondsUntilWindow,
        secondsRemainingInWindow: saved.secondsRemainingInWindow,
        assignedSpotter: saved.assignedSpotter || null,
        spawnAlertUntil: saved.spawnAlertUntil,
        readyCheckUntil: saved.readyCheckUntil,
        readyCheckBy: saved.readyCheckBy,
        notes: saved.notes || initBoss.notes,
        name: saved.name || initBoss.name,
        camCode: saved.camCode || initBoss.camCode,
        selectedAuthorGroup: saved.selectedAuthorGroup || initBoss.selectedAuthorGroup,
        selectedAccountId: saved.selectedAccountId || initBoss.selectedAccountId,
        selectedCharacterName: saved.selectedCharacterName || initBoss.selectedCharacterName,
        selectedCamCode: saved.selectedCamCode || initBoss.selectedCamCode,
      };
    }
    return initBoss;
  });

  const customBosses = incoming.bosses.filter(
    (b: TrackerBoss) => !initial.some((init) => init.id === b.id)
  );

  state.bosses = [...mergedBosses, ...customBosses];
  if (Array.isArray(incoming.spectators)) {
    state.spectators = incoming.spectators;
  }
  if (incoming.accountOccupancies) {
    state.accountOccupancies = incoming.accountOccupancies;
  }
  if (Array.isArray(incoming.customAccounts)) {
    state.customAccounts = incoming.customAccounts;
  }
  if (Array.isArray(incoming.spawnAlertLogs)) {
    state.spawnAlertLogs = incoming.spawnAlertLogs;
  }
  state.lastUpdated = incoming.lastUpdated || Date.now();
}

export async function syncBossStateWithFirestore(): Promise<void> {
  try {
    const fsState = await getBossStateFromFirestore();
    if (fsState && Array.isArray(fsState.bosses) && fsState.bosses.length > 0) {
      const state = getStateRef();
      if (!state.lastUpdated || (fsState.lastUpdated && fsState.lastUpdated >= state.lastUpdated)) {
        mergeIncomingBossState(fsState);
      }
    }
  } catch (e) {
    console.warn('syncBossStateWithFirestore error:', e);
  }
}


function loadPersistedState(): BossServerState {
  try {
    let raw = '';
    if (fs.existsSync(DATA_FILE)) {
      raw = fs.readFileSync(DATA_FILE, 'utf8');
    } else if (fs.existsSync(BACKUP_FILE)) {
      raw = fs.readFileSync(BACKUP_FILE, 'utf8');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.bosses) && parsed.bosses.length > 0) {
        const initial = buildInitialBosses();
        const mergedBosses = initial.map((initBoss) => {
          const saved = parsed.bosses.find((b: TrackerBoss) => b.id === initBoss.id);
          if (saved) {
            return {
              ...initBoss,
              timeOfDeath: saved.timeOfDeath,
              timeOfDeathTimestamp: saved.timeOfDeathTimestamp,
              windowStart: saved.windowStart,
              windowEnd: saved.windowEnd,
              windowStartTimestamp: saved.windowStartTimestamp,
              windowEndTimestamp: saved.windowEndTimestamp,
              phase: saved.phase || 'NO_DATA',
              secondsUntilWindow: saved.secondsUntilWindow,
              secondsRemainingInWindow: saved.secondsRemainingInWindow,
              assignedSpotter: saved.assignedSpotter || null,
              spawnAlertUntil: saved.spawnAlertUntil,
              readyCheckUntil: saved.readyCheckUntil,
              readyCheckBy: saved.readyCheckBy,
              notes: saved.notes || initBoss.notes,
              name: saved.name || initBoss.name,
              camCode: saved.camCode || initBoss.camCode,
              selectedAuthorGroup: saved.selectedAuthorGroup || initBoss.selectedAuthorGroup,
              selectedAccountId: saved.selectedAccountId || initBoss.selectedAccountId,
              selectedCharacterName: saved.selectedCharacterName || initBoss.selectedCharacterName,
              selectedCamCode: saved.selectedCamCode || initBoss.selectedCamCode,
            };
          }
          return initBoss;
        });

        const customBosses = parsed.bosses.filter(
          (b: TrackerBoss) => !initial.some((init) => init.id === b.id)
        );

        return {
          bosses: [...mergedBosses, ...customBosses],
          spectators: Array.isArray(parsed.spectators) ? parsed.spectators : [],
          accountOccupancies: parsed.accountOccupancies || {},
          customAccounts: parsed.customAccounts || [],
          spawnAlertLogs: parsed.spawnAlertLogs || [],
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
      }
    }
  } catch (e) {
    console.error('Failed to load persisted boss state:', e);
  }

  return {
    bosses: buildInitialBosses(),
    spectators: [],
    accountOccupancies: {},
    customAccounts: [],
    spawnAlertLogs: [],
    lastUpdated: Date.now(),
  };
}

// Initialize server singleton once on globalThis
if (!globalThis.__p2k_boss_server_state) {
  globalThis.__p2k_boss_server_state = loadPersistedState();
}

function getStateRef(): BossServerState {
  if (!globalThis.__p2k_boss_server_state) {
    globalThis.__p2k_boss_server_state = loadPersistedState();
  }
  return globalThis.__p2k_boss_server_state;
}

// Recalculate phases for all bosses based on current server time
function recalculateBosses(bosses: TrackerBoss[]): TrackerBoss[] {
  const now = Date.now();
  const pad = (n: number) => String(n).padStart(2, '0');

  return bosses.map((boss) => {
    let spotter = boss.assignedSpotter;
    let rCheckUntil = boss.readyCheckUntil;
    let rCheckBy = boss.readyCheckBy;

    // Unseat unresponsive spotter only if an active ready check timer expired
    if (rCheckUntil && now > rCheckUntil) {
      spotter = null;
      rCheckUntil = undefined;
      rCheckBy = undefined;
    }

    const spawnAlertUntil =
      boss.spawnAlertUntil && now > boss.spawnAlertUntil ? undefined : boss.spawnAlertUntil;

    if (!boss.timeOfDeath && !boss.timeOfDeathTimestamp) {
      return {
        ...boss,
        phase: 'NO_DATA' as const,
        secondsUntilWindow: undefined,
        secondsRemainingInWindow: undefined,
        windowStart: undefined,
        windowEnd: undefined,
        windowStartTimestamp: undefined,
        windowEndTimestamp: undefined,
        assignedSpotter: spotter,
        readyCheckUntil: rCheckUntil,
        readyCheckBy: rCheckBy,
        spawnAlertUntil,
      };
    }

    const range = getBossCooldownRange(boss.level);
    let deathMs = boss.timeOfDeathTimestamp;

    // Fallback: If death timestamp was somehow missing, compute from TOD string
    if (!deathMs && boss.timeOfDeath) {
      const calc = calculateRespawnTimestamps(
        boss.timeOfDeath,
        range.minCooldownHours,
        range.maxCooldownHours
      );
      deathMs = calc.timeOfDeathTimestamp;
    }

    if (!deathMs) {
      return {
        ...boss,
        phase: 'NO_DATA' as const,
        assignedSpotter: spotter,
        readyCheckUntil: rCheckUntil,
        readyCheckBy: rCheckBy,
        spawnAlertUntil,
      };
    }

    const startMs = deathMs + range.minCooldownHours * 3600 * 1000;
    const endMs = deathMs + range.maxCooldownHours * 3600 * 1000;

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

    const dStart = new Date(startMs);
    const dEnd = new Date(endMs);
    const windowStart = `${pad(dStart.getHours())}:${pad(dStart.getMinutes())}`;
    const windowEnd = `${pad(dEnd.getHours())}:${pad(dEnd.getMinutes())}`;

    return {
      ...boss,
      minCooldownHours: range.minCooldownHours,
      maxCooldownHours: range.maxCooldownHours,
      timeOfDeathTimestamp: deathMs,
      timeOfDeath: boss.timeOfDeath || `${pad(new Date(deathMs).getHours())}:${pad(new Date(deathMs).getMinutes())}:${pad(new Date(deathMs).getSeconds())}`,
      windowStart,
      windowEnd,
      windowStartTimestamp: startMs,
      windowEndTimestamp: endMs,
      phase,
      secondsUntilWindow,
      secondsRemainingInWindow,
      assignedSpotter: spotter,
      readyCheckUntil: rCheckUntil,
      readyCheckBy: rCheckBy,
      spawnAlertUntil,
    };
  });
}

// Clean up spectators that have not sent heartbeat in the last 90 seconds
function cleanupSpectators(): void {
  const now = Date.now();
  const state = getStateRef();
  state.spectators = state.spectators.filter((s) => now - s.lastActive < 90000);
}

export function getBossState(): BossServerState {
  const state = getStateRef();
  cleanupSpectators();
  state.bosses = recalculateBosses(state.bosses);
  return {
    ...state,
    bosses: state.bosses,
    spectators: state.spectators,
    accountOccupancies: state.accountOccupancies,
    customAccounts: state.customAccounts,
    spawnAlertLogs: state.spawnAlertLogs,
  };
}

export function heartbeatSpectator(spectator: {
  id: string;
  nickname: string;
  className: string;
  level: number;
  clanName: string;
  role: 'VIEWER' | 'SPOTTER' | 'LEADER';
}): void {
  const state = getStateRef();
  const now = Date.now();
  cleanupSpectators();

  const existingIdx = state.spectators.findIndex(
    (s) => s.id === spectator.id || (s.nickname && s.nickname.toLowerCase() === spectator.nickname.toLowerCase())
  );

  if (existingIdx >= 0) {
    state.spectators[existingIdx] = {
      ...state.spectators[existingIdx],
      ...spectator,
      lastActive: now,
    };
  } else {
    state.spectators.push({
      ...spectator,
      isMe: false,
      lastActive: now,
    });
  }

  state.lastUpdated = now;
  persistState();
}

export function removeSpectator(id: string): void {
  const state = getStateRef();
  state.spectators = state.spectators.filter((s) => s.id !== id);
  state.lastUpdated = Date.now();
  persistState();
}

export function setServerBossCamera(
  bossId: string,
  data: {
    selectedAuthorGroup?: string;
    selectedAccountId?: number;
    selectedCharacterName?: string;
    selectedCamCode?: string;
  }
): { success: boolean; boss?: TrackerBoss } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false };

  if (data.selectedAuthorGroup !== undefined) target.selectedAuthorGroup = data.selectedAuthorGroup;
  if (data.selectedAccountId !== undefined) target.selectedAccountId = data.selectedAccountId;
  if (data.selectedCharacterName !== undefined) target.selectedCharacterName = data.selectedCharacterName;
  if (data.selectedCamCode !== undefined) target.selectedCamCode = data.selectedCamCode;

  state.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function setBossDeath(
  bossId: string,
  todStr: string,
  authorNick?: string,
  todTimestamp?: number
): { success: boolean; boss?: TrackerBoss; error?: string } {
  const state = getStateRef();
  const cleaned = todStr.trim();
  if (!cleaned && !todTimestamp) return { success: false, error: 'Не указано время TOD' };

  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };

  const range = getBossCooldownRange(target.level);
  let deathMs: number;

  if (todTimestamp && !isNaN(todTimestamp)) {
    deathMs = todTimestamp;
  } else {
    const calc = calculateRespawnTimestamps(cleaned, range.minCooldownHours, range.maxCooldownHours);
    deathMs = calc.timeOfDeathTimestamp;
  }

  const windowStartMs = deathMs + range.minCooldownHours * 3600 * 1000;
  const windowEndMs = deathMs + range.maxCooldownHours * 3600 * 1000;
  const now = Date.now();
  const pad = (n: number) => String(n).padStart(2, '0');

  let phase: any = 'NO_DATA';
  let secondsUntilWindow = 0;
  let secondsRemainingInWindow = 0;

  if (now < windowStartMs) {
    phase = 'WAITING_WINDOW';
    secondsUntilWindow = Math.max(0, Math.floor((windowStartMs - now) / 1000));
    secondsRemainingInWindow = Math.max(0, Math.floor((windowEndMs - now) / 1000));
  } else if (now >= windowStartMs && now <= windowEndMs) {
    phase = 'WINDOW_OPEN';
    secondsUntilWindow = 0;
    secondsRemainingInWindow = Math.max(0, Math.floor((windowEndMs - now) / 1000));
  } else {
    phase = 'WINDOW_EXPIRED';
    secondsUntilWindow = 0;
    secondsRemainingInWindow = 0;
  }

  const dStart = new Date(windowStartMs);
  const dEnd = new Date(windowEndMs);
  const calcWindowStart = `${pad(dStart.getHours())}:${pad(dStart.getMinutes())}`;
  const calcWindowEnd = `${pad(dEnd.getHours())}:${pad(dEnd.getMinutes())}`;

  target.timeOfDeath = cleaned || target.timeOfDeath || `${pad(new Date(deathMs).getHours())}:${pad(new Date(deathMs).getMinutes())}:${pad(new Date(deathMs).getSeconds())}`;
  target.timeOfDeathTimestamp = deathMs;
  target.windowStart = calcWindowStart;
  target.windowEnd = calcWindowEnd;
  target.windowStartTimestamp = windowStartMs;
  target.windowEndTimestamp = windowEndMs;
  target.phase = phase;
  target.secondsUntilWindow = secondsUntilWindow;
  target.secondsRemainingInWindow = secondsRemainingInWindow;

  state.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function resetBossState(bossId: string): { success: boolean } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (target) {
    target.timeOfDeath = undefined;
    target.timeOfDeathTimestamp = undefined;
    target.windowStart = undefined;
    target.windowEnd = undefined;
    target.windowStartTimestamp = undefined;
    target.windowEndTimestamp = undefined;
    target.phase = 'NO_DATA';
    target.secondsUntilWindow = undefined;
    target.secondsRemainingInWindow = undefined;
    target.assignedSpotter = null;
    target.readyCheckUntil = undefined;
    target.readyCheckBy = undefined;
    target.spawnAlertUntil = undefined;
    state.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function occupyBossSpot(
  bossId: string,
  spotter: BossSpotterInfo & { sessionId?: string }
): { success: boolean; error?: string; boss?: TrackerBoss } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };

  // If spot is already occupied by someone else, allow re-occupying only if same user or empty
  if (
    target.assignedSpotter &&
    target.assignedSpotter.nickname.trim().toLowerCase() !==
      spotter.nickname.trim().toLowerCase()
  ) {
    return {
      success: false,
      error: `Этот спот уже занят бойцом [${target.assignedSpotter.nickname}]!`,
    };
  }

  target.assignedSpotter = {
    nickname: spotter.nickname.trim(),
    className: spotter.className,
    level: spotter.level,
    clanName: spotter.clanName,
    assignedAt: Date.now(),
  };

  // Crucial: clear any lingering ready check flags so spotter is not immediately kicked
  target.readyCheckUntil = undefined;
  target.readyCheckBy = undefined;

  state.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function leaveBossSpot(
  bossId: string,
  userNick?: string,
  isScoutOrAdmin: boolean = false
): { success: boolean; error?: string } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };

  if (target.assignedSpotter) {
    if (
      !isScoutOrAdmin &&
      userNick &&
      target.assignedSpotter.nickname.trim().toLowerCase() !==
        userNick.trim().toLowerCase()
    ) {
      return { success: false, error: 'Вы можете освободить только свой спот' };
    }
    target.assignedSpotter = null;
    target.readyCheckUntil = undefined;
    target.readyCheckBy = undefined;
    state.lastUpdated = Date.now();
    persistState();
  }

  return { success: true };
}

export function triggerServerSpawnAlert(
  bossId: string,
  pressedBy: { nickname: string; className: string; level: number; clanName: string; role: TrackerRole }
): { success: boolean; log?: SpawnAlertLogEntry } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false };

  target.spawnAlertUntil = Date.now() + 600000; // 10 minutes

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeFormatted = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateFormatted = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}`;

  const logEntry: SpawnAlertLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bossId,
    bossName: target.name,
    bossLevel: target.level,
    pressedBy,
    timestamp: Date.now(),
    timeFormatted,
    dateFormatted,
    status: 'ACTIVE',
  };

  state.spawnAlertLogs.unshift(logEntry);
  if (state.spawnAlertLogs.length > 50) {
    state.spawnAlertLogs.pop();
  }

  state.lastUpdated = Date.now();
  persistState();
  return { success: true, log: logEntry };
}

export function cancelServerSpawnAlert(
  bossId: string,
  cancelledBy: { nickname: string; role: TrackerRole }
): { success: boolean } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (target) {
    target.spawnAlertUntil = undefined;
    // Update logs
    state.spawnAlertLogs.forEach((log) => {
      if (log.bossId === bossId && log.status === 'ACTIVE') {
        log.status = 'CANCELLED';
        log.cancelledBy = cancelledBy;
        log.cancelledAt = Date.now();
      }
    });
    state.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function triggerServerReadyCheck(
  bossId: string,
  requestedBy: string
): { success: boolean; message?: string; error?: string } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };
  if (!target.assignedSpotter) {
    return { success: false, error: 'На этом споте нет споттера для проверки!' };
  }

  const now = Date.now();
  if (
    target.lastReadyCheckTimestamp &&
    now - target.lastReadyCheckTimestamp < 600000
  ) {
    const leftSec = Math.ceil((600000 - (now - target.lastReadyCheckTimestamp)) / 1000);
    return {
      success: false,
      error: `Ready Check на кулдауне. Подождите еще ${Math.floor(leftSec / 60)} мин ${leftSec % 60} сек.`,
    };
  }

  target.readyCheckUntil = now + 600000;
  target.readyCheckBy = requestedBy;
  target.lastReadyCheckTimestamp = now;

  state.lastUpdated = Date.now();
  persistState();
  return { success: true, message: `Ready Check отправлен для [${target.assignedSpotter.nickname}]` };
}

export function confirmServerReadyCheck(bossId: string): { success: boolean } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (target) {
    target.readyCheckUntil = undefined;
    target.readyCheckBy = undefined;
    state.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function occupyServerAccount(
  groupId: number,
  camCode: string,
  user: { nickname: string; className: string; level: number; clanName: string }
): { success: boolean } {
  const state = getStateRef();
  const normCam = normalizeCamCode(camCode);
  state.accountOccupancies[groupId] = {
    groupId,
    activeCamCode: normCam,
    occupiedBy: {
      nickname: user.nickname,
      className: user.className,
      level: user.level,
      clanName: user.clanName,
      isMe: false,
    },
    occupiedAt: Date.now(),
  };

  state.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function releaseServerAccount(groupId: number): { success: boolean } {
  const state = getStateRef();
  delete state.accountOccupancies[groupId];
  state.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function addServerCustomAccount(data: {
  authorGroup: string;
  groupName: string;
  login: string;
  password: string;
  characters: any[];
}): { success: boolean; account: CameraAccount } {
  const state = getStateRef();
  const current = state.customAccounts;
  const newId = 100 + current.length + 1;
  const newAcc: CameraAccount = {
    groupId: newId,
    authorGroup: data.authorGroup.trim() || 'Qox',
    groupName: data.groupName.trim() || `Аккаунт #${newId}`,
    login: data.login.trim(),
    password: data.password.trim(),
    camCodes: data.characters.map((c) => c.camCode || '').filter(Boolean),
    characters: data.characters,
    description: `${data.authorGroup}: ${data.characters.map((c) => c.characterName).join(', ')}`,
  };

  state.customAccounts.unshift(newAcc);
  state.lastUpdated = Date.now();
  persistState();
  return { success: true, account: newAcc };
}

export function updateServerCustomAccount(
  groupId: number,
  data: Partial<CameraAccount>
): { success: boolean } {
  const state = getStateRef();
  const acc = state.customAccounts.find((a) => a.groupId === groupId);
  if (acc) {
    Object.assign(acc, data);
    state.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function deleteServerCustomAccount(groupId: number): { success: boolean } {
  const state = getStateRef();
  state.customAccounts = state.customAccounts.filter(
    (a) => a.groupId !== groupId
  );
  delete state.accountOccupancies[groupId];
  state.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function deleteServerAuthorGroup(groupName: string): { success: boolean } {
  const state = getStateRef();
  const toDelete = state.customAccounts.filter(
    (a) => a.authorGroup.toLowerCase() === groupName.toLowerCase()
  );
  toDelete.forEach((a) => {
    delete state.accountOccupancies[a.groupId];
  });
  state.customAccounts = state.customAccounts.filter(
    (a) => a.authorGroup.toLowerCase() !== groupName.toLowerCase()
  );
  state.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function updateServerBossDetails(
  bossId: string,
  updates: { name: string; level: number; camCode?: string; notes?: string; link?: string }
): { success: boolean } {
  const state = getStateRef();
  const target = state.bosses.find((b) => b.id === bossId);
  if (target) {
    target.name = updates.name.trim();
    target.level = updates.level;
    target.camCode = updates.camCode?.trim();
    target.notes = updates.notes?.trim();
    target.link = updates.link?.trim();

    const range = getBossCooldownRange(target.level);
    target.minCooldownHours = range.minCooldownHours;
    target.maxCooldownHours = range.maxCooldownHours;

    state.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function addServerBoss(data: {
  name: string;
  level: number;
  camCode?: string;
  notes?: string;
  link?: string;
}): { success: boolean; boss: TrackerBoss } {
  const state = getStateRef();
  const range = getBossCooldownRange(data.level);
  const newBoss: TrackerBoss = {
    id: `custom_boss_${Date.now()}`,
    name: data.name.trim(),
    level: data.level,
    camCode: data.camCode?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    link: data.link?.trim() || undefined,
    minCooldownHours: range.minCooldownHours,
    maxCooldownHours: range.maxCooldownHours,
    phase: 'NO_DATA',
    assignedSpotter: null,
  };

  state.bosses.push(newBoss);
  state.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: newBoss };
}

export function deleteServerBoss(bossId: string): { success: boolean } {
  const state = getStateRef();
  state.bosses = state.bosses.filter((b) => b.id !== bossId);
  state.lastUpdated = Date.now();
  persistState();
  return { success: true };
}
