import fs from 'fs';
import path from 'path';
import {
  LfgState,
  QueuePlayer,
  ActiveGroup,
  Goal,
  Role,
  L2ClassId,
  L2_CLASSES_LIST,
  ClanInfo,
  INITIAL_CLANS_LIST,
  KbTopic,
  CharterRule,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lfg-state.json');
const BACKUP_FILE = '/tmp/lfg-state.json';

const defaultInitialState: LfgState = {
  pinCode: '1111',
  adminPinCode: '1234',
  bossViewerPin: '1111',
  bossScoutPin: '1555',
  bossAdminPin: '1234',
  pinVersion: 1,
  lastUpdated: Date.now(),
  clans: [...INITIAL_CLANS_LIST],
  kbTopics: [
    {
      id: 'kb_1',
      title: '9-man Party Setups',
      subtitle: 'Mage / Archer / Melee CP Formations',
      category: 'party_comp',
      content: `1. Mage Party (9-man): 3 Mages (SH/SPS/Sorc/Necro) + Overlord/Warcryer + Bishop + Elven Elder + BD + SWS + Tank.
2. Archer Party (9-man): 3 Archers (HE/PR/SR) + Warcryer + Bishop + Elven Elder + BD + SWS + Warlock/Tank.
3. Melee / Destroyer Party (AoE): 2-3 Destroyers/Warlords + Warcryer + SE + Bishop + BD + SWS + Spoil.`,
    },
    {
      id: 'kb_2',
      title: 'Epic Boss Timers',
      subtitle: 'Baium, Antharas, Valakas, Zaken Respawn',
      category: 'epics',
      content: `• Baium: 5 days +- 8 hours. Quest: Blooded Fabric (TOI 14). Reqs: 4+ Archer/Mage Packs.
• Antharas: 8 days +- 8 hours. Quest: Portal Stone (LOA). Reqs: Full Command Channel.
• Valakas: 11 days +- 8 hours. Quest: Floating Stone (FOG). Reqs: Max Alliance CC.
• Zaken: 2 days +- 4 hours. Quest: Devil's Isle Night Entrance. Reqs: 2 Destro packs.`,
    },
    {
      id: 'kb_3',
      title: 'AoE Farm Spots',
      subtitle: 'Catacombs, IT, FOG, Stakato, Pagan',
      category: 'aoe_spots',
      content: `• Catacombs (Witch / Dark Omen): Ancient Adena (AA) & Spoil B/A mats. Polearm Warlord/Destro + SE.
• Imperial Tomb (IT) & Forge of Gods (FOG): Fast exp for Mage & Polearm packs. A-grade recipe drops.`,
    },
    {
      id: 'kb_4',
      title: 'PL Commands & Macros',
      subtitle: 'In-game party & CC invite chat macros',
      category: 'pl_commands',
      content: `/invite <Nickname> — Invite player to party
/dismiss <Nickname> — Kick player from party
/leave — Leave current party
/channelinvite <Nickname> — Invite party to Command Channel (CC)`,
    },
  ],
  charterRules: [
    {
      id: 'r_1',
      num: 1,
      title: 'Закрытый доступ альянса',
      desc: 'Передача PIN-кода LFG варам или сторонним игрокам строго запрещена. Сервис предназначен исключительно для альянса Pay2KILL.',
    },
    {
      id: 'r_2',
      num: 2,
      title: 'Дисциплина в очереди LFG',
      desc: 'Если вы отходите от компьютера (AFK) более чем на 15 минут, снимите заявку или используйте кнопку продления.',
    },
    {
      id: 'r_3',
      num: 3,
      title: 'Авторитет ПЛ (Party Leader)',
      desc: 'ПЛ самостоятельно формирует состав 9-man пати. Команды ПЛ-а во время захода на эпиков и осад выполняются без пререканий.',
    },
    {
      id: 'r_4',
      num: 4,
      title: 'Дележ Дропа и Эпиков',
      desc: 'Эпическая бижутерия (Баюм, Тарас, Валакас, Закен) распределяется через Руководство Альянса Pay2KILL.',
    },
  ],
  queuePlayers: [],
  activeGroups: [],
};

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to create data dir:', err);
  }
}

function loadPersistedState(): LfgState | null {
  try {
    ensureDataDir();
    let raw = '';
    if (fs.existsSync(DATA_FILE)) {
      raw = fs.readFileSync(DATA_FILE, 'utf8');
    } else if (fs.existsSync(BACKUP_FILE)) {
      raw = fs.readFileSync(BACKUP_FILE, 'utf8');
    }

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LfgState>;
      if (parsed && typeof parsed === 'object') {
        return {
          ...defaultInitialState,
          ...parsed,
          pinCode: parsed.pinCode || parsed.bossViewerPin || defaultInitialState.pinCode,
          bossViewerPin: parsed.bossViewerPin || parsed.pinCode || defaultInitialState.bossViewerPin,
          bossScoutPin: parsed.bossScoutPin || defaultInitialState.bossScoutPin,
          adminPinCode: parsed.adminPinCode || parsed.bossAdminPin || defaultInitialState.adminPinCode,
          bossAdminPin: parsed.bossAdminPin || parsed.adminPinCode || defaultInitialState.bossAdminPin,
          pinVersion: parsed.pinVersion ?? defaultInitialState.pinVersion,
          queuePlayers: Array.isArray(parsed.queuePlayers) ? parsed.queuePlayers : [],
          activeGroups: Array.isArray(parsed.activeGroups) ? parsed.activeGroups : [],
          clans: parsed.clans && parsed.clans.length > 0 ? parsed.clans : [...INITIAL_CLANS_LIST],
          kbTopics: parsed.kbTopics && parsed.kbTopics.length > 0 ? parsed.kbTopics : defaultInitialState.kbTopics,
          charterRules: parsed.charterRules && parsed.charterRules.length > 0 ? parsed.charterRules : defaultInitialState.charterRules,
        };
      }
    }
  } catch (err) {
    console.error('Error loading persisted state:', err);
  }
  return null;
}

let globalLfgState: LfgState = loadPersistedState() || { ...defaultInitialState };

function persistState(): void {
  try {
    ensureDataDir();
    const data = JSON.stringify(globalLfgState, null, 2);
    try {
      fs.writeFileSync(DATA_FILE, data, 'utf8');
    } catch {
      // ignore
    }
    try {
      fs.writeFileSync(BACKUP_FILE, data, 'utf8');
    } catch {
      // ignore
    }
  } catch (err) {
    console.error('Error persisting state:', err);
  }
}

export function getCleanedState(): LfgState {
  const diskState = loadPersistedState();
  if (diskState) {
    if (
      diskState.lastUpdated >= globalLfgState.lastUpdated ||
      (diskState.pinVersion || 0) >= (globalLfgState.pinVersion || 0) ||
      diskState.queuePlayers.length > 0 ||
      diskState.activeGroups.length > 0
    ) {
      globalLfgState = diskState;
    }
  }

  const now = Date.now();
  const EXPIRE_MS = 3 * 60 * 60 * 1000; // 3 hours TTL for idle queue cards

  const prevLen = globalLfgState.queuePlayers.length;
  globalLfgState.queuePlayers = globalLfgState.queuePlayers.filter((player) => {
    return now - player.updatedAt < EXPIRE_MS;
  });

  if (globalLfgState.queuePlayers.length !== prevLen) {
    persistState();
  }

  globalLfgState.lastUpdated = now;
  return globalLfgState;
}

export function getState(): LfgState {
  return getCleanedState();
}

export function verifyPinCode(pin: string): {
  isValid: boolean;
  role: 'member' | 'scout' | 'admin';
  isAdmin: boolean;
  isScout: boolean;
  pinVersion: number;
} {
  const cleaned = pin?.toString().trim();
  const state = getState();
  const ver = state.pinVersion || 1;

  if (cleaned === state.adminPinCode || cleaned === state.bossAdminPin) {
    return { isValid: true, role: 'admin', isAdmin: true, isScout: true, pinVersion: ver };
  }
  if (cleaned === state.bossScoutPin) {
    return { isValid: true, role: 'scout', isAdmin: false, isScout: true, pinVersion: ver };
  }
  if (cleaned === state.pinCode || cleaned === state.bossViewerPin) {
    return { isValid: true, role: 'member', isAdmin: false, isScout: false, pinVersion: ver };
  }
  return { isValid: false, role: 'member', isAdmin: false, isScout: false, pinVersion: ver };
}

export function verifyBossPinCode(pin: string): {
  isValid: boolean;
  role: 'viewer' | 'scout' | 'admin' | null;
  pinVersion: number;
} {
  const res = verifyPinCode(pin);
  if (!res.isValid) return { isValid: false, role: null, pinVersion: res.pinVersion };
  const bossRole = res.role === 'admin' ? 'admin' : res.role === 'scout' ? 'scout' : 'viewer';
  return { isValid: true, role: bossRole, pinVersion: res.pinVersion };
}

// ---------------- QUEUE PLAYERS ----------------

export function addQueuePlayer(
  playerData: Omit<QueuePlayer, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): { success: boolean; player?: QueuePlayer; error?: string } {
  const targetNickLower = playerData.nickname.trim().toLowerCase();

  // 1. Check if nickname already exists in queue
  const existsInQueue = globalLfgState.queuePlayers.some(
    (p) => p.nickname.trim().toLowerCase() === targetNickLower
  );
  if (existsInQueue) {
    return {
      success: false,
      error: `Персонаж с именем "${playerData.nickname}" уже создан в очереди ожидания! Нельзя создать дубликат.`,
    };
  }

  // 2. Check if nickname already exists in an active group (as PL or member)
  const existsInGroup = globalLfgState.activeGroups.some(
    (g) =>
      g.rlNickname.trim().toLowerCase() === targetNickLower ||
      g.members.some((m) => m.nickname.trim().toLowerCase() === targetNickLower)
  );
  if (existsInGroup) {
    return {
      success: false,
      error: `Персонаж с именем "${playerData.nickname}" уже состоит в активной группе! Нельзя добавить его в очередь.`,
    };
  }

  const now = Date.now();
  const cappedLevel = Math.min(Math.max(Number(playerData.level) || 75, 1), 75);
  const safeGrade = playerData.equipGrade === ('S-Grade (S80)' as unknown) ? 'A-Grade' : (playerData.equipGrade || 'A-Grade');

  const newPlayer: QueuePlayer = {
    ...playerData,
    level: cappedLevel,
    equipGrade: safeGrade,
    nickname: playerData.nickname.trim(),
    id: 'p_' + Math.random().toString(36).substring(2, 9),
    createdAt: now,
    updatedAt: now,
    status: 'searching',
  };

  globalLfgState.queuePlayers.unshift(newPlayer);
  globalLfgState.lastUpdated = now;
  persistState();
  return { success: true, player: newPlayer };
}

export function removeQueuePlayer(
  id: string,
  requestorId: string,
  isAdmin: boolean = false
): { success: boolean; error?: string } {
  const player = globalLfgState.queuePlayers.find((p) => p.id === id);
  if (!player) {
    return { success: false, error: 'Игрок не найден в очереди' };
  }

  if (!isAdmin && player.ownerId !== requestorId && !player.ownerId.startsWith('demo_')) {
    return { success: false, error: 'Вы можете удалить только свою карточку' };
  }

  globalLfgState.queuePlayers = globalLfgState.queuePlayers.filter((p) => p.id !== id);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function refreshQueuePlayer(
  id: string,
  requestorId: string,
  isAdmin: boolean = false
): { success: boolean; error?: string } {
  const player = globalLfgState.queuePlayers.find((p) => p.id === id);
  if (!player) {
    return { success: false, error: 'Игрок не найден' };
  }

  if (!isAdmin && player.ownerId !== requestorId && !player.ownerId.startsWith('demo_')) {
    return { success: false, error: 'Вы можете обновить только свою карточку' };
  }

  player.updatedAt = Date.now();
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

// ---------------- ACTIVE GROUPS (9-MAN PARTY) ----------------

export function createGroup(
  ownerId: string,
  rlNickname: string,
  rlClan: string,
  rlClass: L2ClassId,
  rlLevel: number,
  title: string,
  goal: Goal,
  maxMembers: number = 9,
  discordVoice: string = 'Channel #PACK-1',
  initialMemberId?: string,
  queuePlayerToLeaderId?: string
): { success: boolean; group?: ActiveGroup; error?: string } {
  const targetPlNickLower = rlNickname.trim().toLowerCase();

  // Check PL duplicate
  const existsAsPlOrMember = globalLfgState.activeGroups.some(
    (g) =>
      g.rlNickname.trim().toLowerCase() === targetPlNickLower ||
      g.members.some((m) => m.nickname.trim().toLowerCase() === targetPlNickLower)
  );
  if (existsAsPlOrMember) {
    return {
      success: false,
      error: `Персонаж "${rlNickname}" уже находится в активной группе (как ПЛ или участник)!`,
    };
  }

  const now = Date.now();
  const groupId = 'grp_' + Math.random().toString(36).substring(2, 9);
  const cappedLevel = Math.min(Math.max(Number(rlLevel) || 75, 1), 75);

  let convertedPlayer: QueuePlayer | undefined;
  if (queuePlayerToLeaderId) {
    const playerInQueueIndex = globalLfgState.queuePlayers.findIndex(
      (p) => p.id === queuePlayerToLeaderId
    );
    if (playerInQueueIndex !== -1) {
      [convertedPlayer] = globalLfgState.queuePlayers.splice(playerInQueueIndex, 1);
    }
  }

  const initialMembers: QueuePlayer[] = [];

  const plAsMember: QueuePlayer = {
    id: convertedPlayer?.id || 'pl_' + Math.random().toString(36).substring(2, 9),
    ownerId: ownerId,
    nickname: rlNickname.trim(),
    clan: rlClan || convertedPlayer?.clan || 'Pay2KILL',
    role: L2_CLASSES_LIST.find((c) => c.id === rlClass)?.role || 'DD',
    l2Class: rlClass,
    level: cappedLevel,
    equipGrade: convertedPlayer?.equipGrade || 'A-Grade',
    goal: goal,
    notes: 'Party Leader (PL)',
    createdAt: convertedPlayer?.createdAt || now,
    updatedAt: now,
    status: 'in_group',
    assignedGroupId: groupId,
    rlName: rlNickname.trim(),
  };

  initialMembers.push(plAsMember);

  if (initialMemberId && initialMemberId !== queuePlayerToLeaderId) {
    const otherPlayerIndex = globalLfgState.queuePlayers.findIndex((p) => p.id === initialMemberId);
    if (otherPlayerIndex !== -1) {
      const [takenPlayer] = globalLfgState.queuePlayers.splice(otherPlayerIndex, 1);
      takenPlayer.status = 'in_group';
      takenPlayer.assignedGroupId = groupId;
      takenPlayer.rlName = rlNickname.trim();
      initialMembers.push(takenPlayer);
    }
  }

  const newGroup: ActiveGroup = {
    id: groupId,
    ownerId,
    rlNickname: rlNickname.trim(),
    rlClan: rlClan || convertedPlayer?.clan || 'Pay2KILL',
    rlClass: rlClass || convertedPlayer?.l2Class || 'Warcryer',
    rlLevel: cappedLevel,
    title: title || `Party PL ${rlNickname.trim()}`,
    goal,
    maxMembers,
    discordVoice,
    createdAt: now,
    members: initialMembers,
  };

  globalLfgState.activeGroups.unshift(newGroup);
  globalLfgState.lastUpdated = now;
  persistState();
  return { success: true, group: newGroup };
}

export function takePlayerToGroup(
  groupId: string,
  playerId: string,
  requestorId: string,
  isAdmin: boolean = false
): { success: boolean; error?: string } {
  const group = globalLfgState.activeGroups.find((g) => g.id === groupId);
  if (!group) return { success: false, error: 'Group not found' };

  if (!isAdmin && group.ownerId && group.ownerId !== requestorId && !group.ownerId.startsWith('demo_')) {
    return { success: false, error: 'Только Пати Лидер (ПЛ) этой группы может добавлять игроков!' };
  }

  const playerIndex = globalLfgState.queuePlayers.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { success: false, error: 'Игрок не найден в очереди' };

  const [player] = globalLfgState.queuePlayers.splice(playerIndex, 1);
  player.status = 'in_group';
  player.assignedGroupId = groupId;
  player.rlName = group.rlNickname;

  group.members.push(player);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function returnPlayerToQueue(
  groupId: string,
  playerId: string,
  requestorId: string,
  isAdmin: boolean = false
): { success: boolean; error?: string } {
  const group = globalLfgState.activeGroups.find((g) => g.id === groupId);
  if (!group) return { success: false, error: 'Group not found' };

  const memberIndex = group.members.findIndex((m) => m.id === playerId);
  if (memberIndex === -1) return { success: false, error: 'Игрок не найден в составе пати' };

  const member = group.members[memberIndex];

  if (!isAdmin && group.ownerId !== requestorId && member.ownerId !== requestorId && !group.ownerId.startsWith('demo_')) {
    return { success: false, error: 'У вас нет прав для исключения этого игрока!' };
  }

  const [player] = group.members.splice(memberIndex, 1);
  player.status = 'searching';
  player.assignedGroupId = undefined;
  player.rlName = undefined;
  player.updatedAt = Date.now();

  globalLfgState.queuePlayers.unshift(player);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function disbandGroup(
  groupId: string,
  requestorId: string,
  isAdmin: boolean = false
): { success: boolean; error?: string } {
  const groupIndex = globalLfgState.activeGroups.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) return { success: false, error: 'Group not found' };

  const group = globalLfgState.activeGroups[groupIndex];

  if (!isAdmin && group.ownerId && group.ownerId !== requestorId && !group.ownerId.startsWith('demo_')) {
    return { success: false, error: 'Только Пати Лидер (ПЛ) или Администратор может распустить группу!' };
  }

  globalLfgState.activeGroups.splice(groupIndex, 1);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

// ---------------- CLAN MANAGEMENT ----------------

export function addClan(name: string): { success: boolean; clan?: ClanInfo; error?: string } {
  const cleanName = name.trim();
  if (!cleanName) return { success: false, error: 'Укажите название клана' };

  const exists = globalLfgState.clans.some((c) => c.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) return { success: false, error: 'Клан с таким названием уже существует' };

  const newClan: ClanInfo = {
    id: 'clan_' + Math.random().toString(36).substring(2, 7),
    name: cleanName,
  };
  globalLfgState.clans.push(newClan);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true, clan: newClan };
}

export function deleteClan(id: string): { success: boolean; error?: string } {
  globalLfgState.clans = globalLfgState.clans.filter((c) => c.id !== id);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

// ---------------- KNOWLEDGE BASE MANAGEMENT ----------------

export function addKbTopic(title: string, subtitle: string, category: 'party_comp' | 'epics' | 'aoe_spots' | 'pl_commands', content: string): KbTopic {
  const newTopic: KbTopic = {
    id: 'kb_' + Math.random().toString(36).substring(2, 7),
    title,
    subtitle,
    category,
    content,
  };
  globalLfgState.kbTopics.push(newTopic);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return newTopic;
}

export function updateKbTopic(id: string, title: string, subtitle: string, content: string): { success: boolean; error?: string } {
  const topic = globalLfgState.kbTopics.find((t) => t.id === id);
  if (!topic) return { success: false, error: 'Topic not found' };

  topic.title = title;
  topic.subtitle = subtitle;
  topic.content = content;
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function deleteKbTopic(id: string): { success: boolean } {
  globalLfgState.kbTopics = globalLfgState.kbTopics.filter((t) => t.id !== id);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

// ---------------- CHARTER RULES MANAGEMENT ----------------

export function addCharterRule(title: string, desc: string): CharterRule {
  const newRule: CharterRule = {
    id: 'r_' + Math.random().toString(36).substring(2, 7),
    num: globalLfgState.charterRules.length + 1,
    title,
    desc,
  };
  globalLfgState.charterRules.push(newRule);
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return newRule;
}

export function updateCharterRule(id: string, title: string, desc: string): { success: boolean; error?: string } {
  const rule = globalLfgState.charterRules.find((r) => r.id === id);
  if (!rule) return { success: false, error: 'Rule not found' };

  rule.title = title;
  rule.desc = desc;
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function deleteCharterRule(id: string): { success: boolean } {
  globalLfgState.charterRules = globalLfgState.charterRules.filter((r) => r.id !== id);
  // Re-number
  globalLfgState.charterRules.forEach((r, idx) => {
    r.num = idx + 1;
  });
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return { success: true };
}

export function updatePinCode(newPin: string): void {
  globalLfgState.pinCode = newPin;
  globalLfgState.pinVersion = (globalLfgState.pinVersion || 1) + 1;
  globalLfgState.lastUpdated = Date.now();
  persistState();
}

export function updateAllPins(
  memberPin?: string,
  scoutPin?: string,
  adminPin?: string
): void {
  if (memberPin) {
    globalLfgState.pinCode = memberPin.trim();
    globalLfgState.bossViewerPin = memberPin.trim();
  }
  if (scoutPin) {
    globalLfgState.bossScoutPin = scoutPin.trim();
  }
  if (adminPin) {
    globalLfgState.adminPinCode = adminPin.trim();
    globalLfgState.bossAdminPin = adminPin.trim();
  }

  globalLfgState.pinVersion = (globalLfgState.pinVersion || 1) + 1;
  globalLfgState.lastUpdated = Date.now();
  persistState();
}

export function forceLogoutSessions(): void {
  globalLfgState.pinVersion = (globalLfgState.pinVersion || 1) + 1;
  globalLfgState.lastUpdated = Date.now();
  persistState();
}

export function resetToDemo(): LfgState {
  globalLfgState.clans = [...INITIAL_CLANS_LIST];
  globalLfgState.queuePlayers = [];
  globalLfgState.activeGroups = [];
  globalLfgState.lastUpdated = Date.now();
  persistState();
  return globalLfgState;
}
