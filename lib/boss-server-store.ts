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
  normalizeCamCode,
} from './camera-accounts-data';

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

let globalBossState: BossServerState = {
  bosses: buildInitialBosses(),
  spectators: [],
  accountOccupancies: {},
  customAccounts: [],
  spawnAlertLogs: [],
  lastUpdated: Date.now(),
};

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
    const dataStr = JSON.stringify(globalBossState, null, 2);
    try {
      fs.writeFileSync(DATA_FILE, dataStr, 'utf8');
    } catch {}
    try {
      fs.writeFileSync(BACKUP_FILE, dataStr, 'utf8');
    } catch {}
  } catch (e) {
    try {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(globalBossState), 'utf8');
    } catch {}
  }
}

function loadPersistedState(): void {
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
        // Merge with initial boss definitions to preserve levels and cooldowns
        const initial = buildInitialBosses();
        const mergedBosses = initial.map((initBoss) => {
          const saved = parsed.bosses.find((b: TrackerBoss) => b.id === initBoss.id);
          if (saved) {
            return {
              ...initBoss,
              timeOfDeath: saved.timeOfDeath,
              timeOfDeathTimestamp: saved.timeOfDeathTimestamp,
              assignedSpotter: saved.assignedSpotter || null,
              spawnAlertUntil: saved.spawnAlertUntil,
              lastAlertId: saved.lastAlertId,
              lastAlertTimestamp: saved.lastAlertTimestamp,
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

        // Add any custom bosses added by CL/Scouts
        const customBosses = parsed.bosses.filter(
          (b: TrackerBoss) => !initial.some((init) => init.id === b.id)
        );

        // Filter out spectators older than 45 seconds from loaded file
        const now = Date.now();
        const activeSpectators = Array.isArray(parsed.spectators)
          ? (parsed.spectators as SpectatorUser[]).filter((s) => now - (s.lastActive || 0) < 45000)
          : [];

        globalBossState = {
          bosses: [...mergedBosses, ...customBosses],
          spectators: activeSpectators,
          accountOccupancies: parsed.accountOccupancies || {},
          customAccounts: parsed.customAccounts || [],
          spawnAlertLogs: parsed.spawnAlertLogs || [],
          lastUpdated: parsed.lastUpdated || Date.now(),
        };
        return;
      }
    }
  } catch (e) {
    console.error('Failed to load persisted boss state:', e);
  }

  globalBossState = {
    bosses: buildInitialBosses(),
    spectators: [],
    accountOccupancies: {},
    customAccounts: [],
    spawnAlertLogs: [],
    lastUpdated: Date.now(),
  };
}

// Initial bootstrap
loadPersistedState();

// Recalculate phases for all bosses based on current server time
function recalculateBosses(bosses: TrackerBoss[]): TrackerBoss[] {
  const now = Date.now();
  return bosses.map((boss) => {
    let spotter = boss.assignedSpotter;
    let rCheckUntil = boss.readyCheckUntil;
    let rCheckBy = boss.readyCheckBy;

    // Ready check expiration check (10 min)
    if (rCheckUntil && now > rCheckUntil) {
      spotter = null; // Unseat unresponsive spotter
      rCheckUntil = undefined;
      rCheckBy = undefined;
    }

    const spawnAlertUntil =
      boss.spawnAlertUntil && now > boss.spawnAlertUntil ? undefined : boss.spawnAlertUntil;
    const lastAlertId = spawnAlertUntil ? boss.lastAlertId : undefined;

    if (!boss.timeOfDeath) {
      return {
        ...boss,
        phase: 'NO_DATA' as const,
        secondsUntilWindow: undefined,
        secondsRemainingInWindow: undefined,
        windowStart: undefined,
        windowEnd: undefined,
        assignedSpotter: spotter,
        readyCheckUntil: rCheckUntil,
        readyCheckBy: rCheckBy,
        spawnAlertUntil,
        lastAlertId,
      };
    }

    const range = getBossCooldownRange(boss.level);
    const calc = calculateRespawnTimestamps(
      boss.timeOfDeath,
      range.minCooldownHours,
      range.maxCooldownHours
    );

    return {
      ...boss,
      minCooldownHours: range.minCooldownHours,
      maxCooldownHours: range.maxCooldownHours,
      windowStart: calc.windowStart,
      windowEnd: calc.windowEnd,
      windowStartTimestamp: calc.windowStartTimestamp,
      windowEndTimestamp: calc.windowEndTimestamp,
      phase: calc.phase,
      secondsUntilWindow: calc.secondsUntilWindow,
      secondsRemainingInWindow: calc.secondsRemainingInWindow,
      assignedSpotter: spotter,
      readyCheckUntil: rCheckUntil,
      readyCheckBy: rCheckBy,
      spawnAlertUntil,
      lastAlertId,
    };
  });
}

// Clean up spectators that have not sent heartbeat in the last 35 seconds
function cleanupSpectators(): boolean {
  const now = Date.now();
  const initialLen = globalBossState.spectators.length;
  globalBossState.spectators = globalBossState.spectators.filter(
    (s) => now - (s.lastActive || 0) < 35000
  );
  return globalBossState.spectators.length !== initialLen;
}

export function getBossState(): BossServerState {
  loadPersistedState();
  const cleaned = cleanupSpectators();
  if (cleaned) {
    persistState();
  }
  globalBossState.bosses = recalculateBosses(globalBossState.bosses);
  return {
    ...globalBossState,
    bosses: globalBossState.bosses,
    spectators: globalBossState.spectators,
    accountOccupancies: globalBossState.accountOccupancies,
    customAccounts: globalBossState.customAccounts,
    spawnAlertLogs: globalBossState.spawnAlertLogs,
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
  loadPersistedState();
  const now = Date.now();
  cleanupSpectators();

  const existingIdx = globalBossState.spectators.findIndex(
    (s) => s.id === spectator.id || (s.nickname && s.nickname.toLowerCase() === spectator.nickname.toLowerCase())
  );

  if (existingIdx >= 0) {
    globalBossState.spectators[existingIdx] = {
      ...globalBossState.spectators[existingIdx],
      ...spectator,
      lastActive: now,
    };
  } else {
    globalBossState.spectators.push({
      ...spectator,
      isMe: false,
      lastActive: now,
    });
  }

  globalBossState.lastUpdated = now;
  persistState();
}

export function removeSpectator(idOrNickname: string): void {
  loadPersistedState();
  const lower = idOrNickname.toLowerCase();
  globalBossState.spectators = globalBossState.spectators.filter(
    (s) => s.id !== idOrNickname && s.nickname.toLowerCase() !== lower
  );
  globalBossState.lastUpdated = Date.now();
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
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false };

  if (data.selectedAuthorGroup !== undefined) target.selectedAuthorGroup = data.selectedAuthorGroup;
  if (data.selectedAccountId !== undefined) target.selectedAccountId = data.selectedAccountId;
  if (data.selectedCharacterName !== undefined) target.selectedCharacterName = data.selectedCharacterName;
  if (data.selectedCamCode !== undefined) target.selectedCamCode = data.selectedCamCode;

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function setBossDeath(
  bossId: string,
  todStr: string,
  authorNick?: string,
  todTimestamp?: number
): { success: boolean; boss?: TrackerBoss; error?: string } {
  loadPersistedState();
  const cleaned = todStr.trim();
  if (!cleaned && !todTimestamp) return { success: false, error: 'Не указано время TOD' };

  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };

  const range = getBossCooldownRange(target.level);

  let deathMs: number;
  let calcWindowStart = '';
  let calcWindowEnd = '';

  if (todTimestamp && !isNaN(todTimestamp)) {
    deathMs = todTimestamp;
    const pad = (n: number) => String(n).padStart(2, '0');
    const startD = new Date(deathMs + range.minCooldownHours * 3600 * 1000);
    const endD = new Date(deathMs + range.maxCooldownHours * 3600 * 1000);
    calcWindowStart = `${pad(startD.getHours())}:${pad(startD.getMinutes())}`;
    calcWindowEnd = `${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
  } else {
    const calc = calculateRespawnTimestamps(cleaned, range.minCooldownHours, range.maxCooldownHours);
    deathMs = calc.timeOfDeathTimestamp;
    calcWindowStart = calc.windowStart;
    calcWindowEnd = calc.windowEnd;
  }

  const windowStartMs = deathMs + range.minCooldownHours * 3600 * 1000;
  const windowEndMs = deathMs + range.maxCooldownHours * 3600 * 1000;
  const now = Date.now();

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

  target.timeOfDeath = cleaned || target.timeOfDeath;
  target.timeOfDeathTimestamp = deathMs;
  target.windowStart = calcWindowStart;
  target.windowEnd = calcWindowEnd;
  target.windowStartTimestamp = windowStartMs;
  target.windowEndTimestamp = windowEndMs;
  target.phase = phase;
  target.secondsUntilWindow = secondsUntilWindow;
  target.secondsRemainingInWindow = secondsRemainingInWindow;

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function resetBossState(bossId: string): { success: boolean } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
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
    target.lastAlertId = undefined;
    globalBossState.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function occupyBossSpot(
  bossId: string,
  spotter: BossSpotterInfo & { sessionId?: string }
): { success: boolean; error?: string; boss?: TrackerBoss } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false, error: 'Босс не найден' };

  // If spot is already occupied by someone else, prevent overwriting
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

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: target };
}

export function leaveBossSpot(
  bossId: string,
  userNick?: string,
  isScoutOrAdmin: boolean = false
): { success: boolean; error?: string } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
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
    globalBossState.lastUpdated = Date.now();
    persistState();
  }

  return { success: true };
}

export function triggerServerSpawnAlert(
  bossId: string,
  pressedBy: { nickname: string; className: string; level: number; clanName: string; role: TrackerRole }
): { success: boolean; log?: SpawnAlertLogEntry; alertId?: string } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (!target) return { success: false };

  const alertId = `alert_${bossId}_${Date.now()}`;
  target.spawnAlertUntil = Date.now() + 600000; // 10 minutes
  target.lastAlertId = alertId;
  target.lastAlertTimestamp = Date.now();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeFormatted = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateFormatted = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}`;

  const logEntry: SpawnAlertLogEntry = {
    id: alertId,
    bossId,
    bossName: target.name,
    bossLevel: target.level,
    pressedBy,
    timestamp: Date.now(),
    timeFormatted,
    dateFormatted,
    status: 'ACTIVE',
  };

  globalBossState.spawnAlertLogs.unshift(logEntry);
  if (globalBossState.spawnAlertLogs.length > 50) {
    globalBossState.spawnAlertLogs.pop();
  }

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, log: logEntry, alertId };
}

export function cancelServerSpawnAlert(
  bossId: string,
  cancelledBy: { nickname: string; role: TrackerRole }
): { success: boolean } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (target) {
    target.spawnAlertUntil = undefined;
    target.lastAlertId = undefined;
    // Update logs
    globalBossState.spawnAlertLogs.forEach((log) => {
      if (log.bossId === bossId && log.status === 'ACTIVE') {
        log.status = 'CANCELLED';
        log.cancelledBy = cancelledBy;
        log.cancelledAt = Date.now();
      }
    });
    globalBossState.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function triggerServerReadyCheck(
  bossId: string,
  requestedBy: string
): { success: boolean; message?: string; error?: string } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
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

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, message: `Ready Check отправлен для [${target.assignedSpotter.nickname}]` };
}

export function confirmServerReadyCheck(bossId: string): { success: boolean } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (target) {
    target.readyCheckUntil = undefined;
    target.readyCheckBy = undefined;
    globalBossState.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function occupyServerAccount(
  groupId: number,
  camCode: string,
  user: { nickname: string; className: string; level: number; clanName: string }
): { success: boolean } {
  loadPersistedState();
  const normCam = normalizeCamCode(camCode);
  globalBossState.accountOccupancies[groupId] = {
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

  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function releaseServerAccount(groupId: number): { success: boolean } {
  loadPersistedState();
  delete globalBossState.accountOccupancies[groupId];
  globalBossState.lastUpdated = Date.now();
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
  loadPersistedState();
  const current = globalBossState.customAccounts;
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

  globalBossState.customAccounts.unshift(newAcc);
  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, account: newAcc };
}

export function updateServerCustomAccount(
  groupId: number,
  data: Partial<CameraAccount>
): { success: boolean } {
  loadPersistedState();
  const acc = globalBossState.customAccounts.find((a) => a.groupId === groupId);
  if (acc) {
    Object.assign(acc, data);
    globalBossState.lastUpdated = Date.now();
    persistState();
  }
  return { success: true };
}

export function deleteServerCustomAccount(groupId: number): { success: boolean } {
  loadPersistedState();
  globalBossState.customAccounts = globalBossState.customAccounts.filter(
    (a) => a.groupId !== groupId
  );
  delete globalBossState.accountOccupancies[groupId];
  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function deleteServerAuthorGroup(groupName: string): { success: boolean } {
  loadPersistedState();
  const toDelete = globalBossState.customAccounts.filter(
    (a) => a.authorGroup.toLowerCase() === groupName.toLowerCase()
  );
  toDelete.forEach((a) => {
    delete globalBossState.accountOccupancies[a.groupId];
  });
  globalBossState.customAccounts = globalBossState.customAccounts.filter(
    (a) => a.authorGroup.toLowerCase() !== groupName.toLowerCase()
  );
  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function updateServerBossDetails(
  bossId: string,
  updates: { name: string; level: number; camCode?: string; notes?: string; link?: string }
): { success: boolean } {
  loadPersistedState();
  const target = globalBossState.bosses.find((b) => b.id === bossId);
  if (target) {
    target.name = updates.name.trim();
    target.level = updates.level;
    target.camCode = updates.camCode?.trim();
    target.notes = updates.notes?.trim();
    target.link = updates.link?.trim();

    const range = getBossCooldownRange(target.level);
    target.minCooldownHours = range.minCooldownHours;
    target.maxCooldownHours = range.maxCooldownHours;

    globalBossState.lastUpdated = Date.now();
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
  loadPersistedState();
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

  globalBossState.bosses.push(newBoss);
  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true, boss: newBoss };
}

export function deleteServerBoss(bossId: string): { success: boolean } {
  loadPersistedState();
  globalBossState.bosses = globalBossState.bosses.filter((b) => b.id !== bossId);
  globalBossState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}
