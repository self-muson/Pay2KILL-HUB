'use client';

import { create } from 'zustand';
import {
  L2Boss,
  L2Spotter,
  BossState,
  RaidRallyAlert,
  MyCharacterProfile,
  UserCharacter,
  L2ClassArchetype,
} from './l2-spot-types';
import { l2Audio } from './l2-audio';
import { fetchDriveFileContent, parseBossDatabaseContent, fetchSpreadsheetByUrl } from './google-drive';

const STORAGE_KEY = 'l2_boss_spots_data_v2_early';
const MY_CHAR_KEY = 'l2_my_char_profile_v2';
const CHARACTERS_STORAGE_KEY = 'l2_characters_roster_v1';

// Default initial roster of characters for the user's personal profile
const DEFAULT_CHARACTERS: UserCharacter[] = [
  {
    id: 'char_sr_1',
    nickname: 'Spectre_SR',
    approxLevel: '20-24',
    levelNumber: 23,
    className: 'Silver Ranger',
    classArchetype: 'ARCHER',
    gearSummary: 'Brigandine Set + Gastraphetes Bow',
    clanName: 'Pay2KILL',
    isMain: true,
    createdAt: 1728000000000,
  },
  {
    id: 'char_rogue_2',
    nickname: 'ShadowBlade',
    approxLevel: '20-22',
    levelNumber: 21,
    className: 'Rogue',
    classArchetype: 'DAGGER',
    gearSummary: 'Manticore Set + Dark Elven Dagger',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
  {
    id: 'char_cleric_3',
    nickname: 'SaintCleric',
    approxLevel: '20-24',
    levelNumber: 22,
    className: 'Cleric',
    classArchetype: 'SUPPORT',
    gearSummary: 'Devotion Set + Crucifix of Blessing',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
  {
    id: 'char_knight_4',
    nickname: 'IronWall',
    approxLevel: '22-25',
    levelNumber: 23,
    className: 'Elven Knight',
    classArchetype: 'TANK',
    gearSummary: 'Plate Armor + Bastard Sword & Shield',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
  {
    id: 'char_summoner_5',
    nickname: 'CatMaster',
    approxLevel: '75',
    levelNumber: 75,
    className: 'Warlock (Котовод)',
    classArchetype: 'SUMMONER',
    gearSummary: 'Avadon Robe Set + Homunculus Sword (Acumen)',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
  {
    id: 'char_summoner_6',
    nickname: 'PonyLord',
    approxLevel: '75',
    levelNumber: 75,
    className: 'Elemental Summoner (Коневод)',
    classArchetype: 'SUMMONER',
    gearSummary: 'Blue Wolf Robe Set + Sword of Valhalla',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
  {
    id: 'char_summoner_7',
    nickname: 'ShadowSummon',
    approxLevel: '75',
    levelNumber: 75,
    className: 'Phantom Summoner (Теневод)',
    classArchetype: 'SUMMONER',
    gearSummary: 'Doom Robe Set + Wizard Tear',
    clanName: 'Pay2KILL',
    isMain: false,
    createdAt: 1728000000000,
  },
];

// Accurate Lineage 2 Raid Boss Roster: Up to Level 23
const EARLY_LINEAGE2_BOSSES: L2Boss[] = [
  {
    id: 'calibus',
    name: 'Revenant of Sir Calibus',
    title: 'Рыцарь Нежити (Undead Knight)',
    level: 21,
    location: 'Ruins of Despair (Gludio)',
    territory: 'Gludio',
    image: '/images/bosses/calibus.jpg',
    status: 'ALIVE',
    timeOfDeath: '00:00',
    windowStart: '18:00',
    windowEnd: '21:00',
    respawnCooldownHours: 18,
    spotter: {
      id: 'scout_calibus',
      nickname: 'Spectre_SR',
      className: 'Silver Ranger',
      classArchetype: 'ARCHER',
      clanName: 'Pay2KILL',
      level: 23,
      approxLevel: '20-24',
      gearSummary: 'Brigandine Set + Gastraphetes Bow',
      sinceTimestamp: 1728000000000,
      note: 'На руинах отчаяния, калибус стоит со свитой!',
      isMe: true,
    },
    targetMacro: '/target Revenant of Sir Calibus',
    dropHighlights: ['Brigandine Armor', 'Bastard Sword', 'D-Grade Enchants', 'Life Stone Lv 20'],
  },
  {
    id: 'ferkel',
    name: 'Zombie Lord Ferkel',
    title: 'Повелитель Зомби (Execution Grounds)',
    level: 20,
    location: 'Execution Grounds (Dion/Gludio Border)',
    territory: 'Dion',
    image: '/images/bosses/ferkel.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '01:30',
    windowStart: '17:30',
    windowEnd: '20:30',
    respawnCooldownHours: 16,
    spotter: {
      id: 'scout_ferkel',
      nickname: 'ShadowBlade',
      className: 'Rogue',
      classArchetype: 'DAGGER',
      clanName: 'Pay2KILL',
      level: 21,
      approxLevel: '20-22',
      gearSummary: 'Manticore Set + Dark Elven Dagger',
      sinceTimestamp: 1728000000000,
      note: 'На поляне виселиц, жду респа',
      isMe: true,
    },
    targetMacro: '/target Zombie Lord Ferkel',
    dropHighlights: ['Manticore Skin Gaiters', 'Bones of Ferkel', 'D-Grade Weapons'],
  },
  {
    id: 'madness_beast',
    name: 'Madness Beast',
    title: 'Кристальный Зверь Безумия (Beast)',
    level: 20,
    location: 'Ruins of Despair (Gludio)',
    territory: 'Gludio',
    image: '/images/bosses/madness_beast.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '01:00',
    windowStart: '19:00',
    windowEnd: '22:00',
    respawnCooldownHours: 18,
    spotter: null, // EMPTY - needs scout!
    targetMacro: '/target Madness Beast',
    dropHighlights: ['Ring of Knowledge', 'D-Grade Armor Set', 'Animal Bone Packs'],
  },
  {
    id: 'bifrons',
    name: 'Serpent Demon Bifrons',
    title: 'Демон-Змея Пустоши (Serpent Demon)',
    level: 21,
    location: 'Wasteland (Gludio Territory)',
    territory: 'Gludio',
    image: '/images/bosses/bifrons.jpg',
    status: 'PVP_ENGAGED',
    timeOfDeath: '00:00',
    windowStart: '20:00',
    windowEnd: '23:00',
    respawnCooldownHours: 20,
    spotter: {
      id: 'scout_bifrons',
      nickname: 'VenomShot',
      className: 'Elven Scout',
      classArchetype: 'ARCHER',
      clanName: 'Pay2KILL',
      level: 22,
      approxLevel: '20-24',
      sinceTimestamp: 1728000000000,
      note: 'Вар-пак зашел в арену Пустоши!',
    },
    targetMacro: '/target Serpent Demon Bifrons',
    dropHighlights: ['Fang of Bifrons', 'D-Grade Daggers', 'Scroll: Enchant Weapon (D)'],
  },
  {
    id: 'wererat',
    name: 'Sukar Wererat Chief',
    title: 'Вождь Крысолюдов (Wererat Chief)',
    level: 21,
    location: 'Windmill Hill (Gludio)',
    territory: 'Gludio',
    image: '/images/bosses/wererat.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '00:00',
    windowStart: '16:00',
    windowEnd: '19:00',
    respawnCooldownHours: 16,
    spotter: null, // EMPTY - needs scout!
    targetMacro: '/target Sukar Wererat Chief',
    dropHighlights: ['Hard Leather Armor', 'Iron Boots', 'D-Grade Enchants'],
  },
  {
    id: 'malex',
    name: 'Malex Herald of Dagoniel',
    title: 'Вестник Дагониэля (Gargoyle Archdemon)',
    level: 21,
    location: 'Neutral Zone (Elven/Dark Elven Border)',
    territory: 'Elven',
    image: '/images/bosses/malex.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '21:30',
    windowStart: '15:30',
    windowEnd: '18:30',
    respawnCooldownHours: 18,
    spotter: null, // EMPTY - needs scout!
    targetMacro: '/target Malex Herald of Dagoniel',
    dropHighlights: ['Demon Fangs', 'Ghost Claymore', 'Scroll: Enchant Armor (D)'],
  },
  {
    id: 'kaysha',
    name: 'Kaysha Herald of Icarus',
    title: 'Крылатая Вестница (Succubus)',
    level: 21,
    location: 'Neutral Zone (Dungeon Hall)',
    territory: 'Elven',
    image: '/images/bosses/kaysha.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '00:45',
    windowStart: '18:45',
    windowEnd: '21:45',
    respawnCooldownHours: 18,
    spotter: null,
    targetMacro: '/target Kaysha Herald of Icarus',
    dropHighlights: ['Tunic of Magic', 'Stockings of Magic', 'Mystic Staff'],
  },
  {
    id: 'kutus',
    name: 'Greyclaw Kutus',
    title: 'Вождь Серых Когтей (Gnoll Chieftain)',
    level: 23,
    location: 'Fellmere Harvesting Grounds (Gludin)',
    territory: 'Gludin',
    image: '/images/bosses/kutus.jpg',
    status: 'DEAD',
    timeOfDeath: '02:00',
    windowStart: '22:00',
    windowEnd: '01:00',
    respawnCooldownHours: 20,
    lastKilledAt: 1728000000000,
    spotter: null,
    targetMacro: '/target Greyclaw Kutus',
    dropHighlights: ['Heavy Falchion', 'Kutus Shield', 'Reinforced Mithril Boots'],
  },
  {
    id: 'sharuk',
    name: 'Tracker Leader Sharuk',
    title: 'Лидер Следопытов Ящеров (Lizardman)',
    level: 23,
    location: 'Langk Lizardman Dwellings (Gludio)',
    territory: 'Gludio',
    image: '/images/bosses/sharuk.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '23:00',
    windowStart: '17:00',
    windowEnd: '20:00',
    respawnCooldownHours: 18,
    spotter: null,
    targetMacro: '/target Tracker Leader Sharuk',
    dropHighlights: ['Pike of Sharuk', 'Lizard Chitin Mail', 'EWD Enchants'],
  },
  {
    id: 'kuroboros',
    name: "Kuroboros' Priest",
    title: 'Жрец Куробороса (Lizardman Shaman)',
    level: 23,
    location: 'Langk Lizardman Dwellings (Gludio)',
    territory: 'Gludio',
    image: '/images/bosses/kuroboros.jpg',
    status: 'WINDOW_OPEN',
    timeOfDeath: '01:30',
    windowStart: '19:30',
    windowEnd: '22:30',
    respawnCooldownHours: 18,
    spotter: null,
    targetMacro: "/target Kuroboros' Priest",
    dropHighlights: ['Shaman Bone Robe', 'Ritual Rapier', 'Earring of Kuroboros'],
  },
];

interface L2SpotStore {
  bosses: L2Boss[];
  activeRally: RaidRallyAlert | null;
  characters: UserCharacter[];
  activeCharacterId: string;
  isRaidLeader: boolean;
  filterStatus: 'ALL' | 'WINDOW_OPEN' | 'NEED_SCOUT' | 'ON_DUTY' | 'ALIVE';
  searchQuery: string;

  // Time Gate Timeline offset (for simulation/scrub, 0 = real live time)
  timeGateOffsetMinutes: number;

  // Google Drive state
  isDriveConnected: boolean;
  driveUserEmail: string | null;
  isSyncingDrive: boolean;
  lastDriveSyncTime: string | null;
  driveSyncMessage: string | null;

  // Actions
  getActiveCharacter: () => UserCharacter;
  takeSpot: (bossId: string, customChar?: Partial<MyCharacterProfile>, note?: string) => void;
  takeSpotWithCharacter: (bossId: string, characterId: string, note?: string) => void;
  leaveSpot: (bossId: string) => void;
  reportSpawn: (bossId: string) => void;
  reportPvp: (bossId: string) => void;
  declareRaid: (bossId: string) => void;
  dismissRally: () => void;
  markBossKilled: (bossId: string) => void;
  setBossState: (bossId: string, state: BossState) => void;

  // Character Management (Личный кабинет)
  addCharacter: (char: Omit<UserCharacter, 'id' | 'createdAt'>) => UserCharacter;
  updateCharacter: (id: string, char: Partial<UserCharacter>) => void;
  deleteCharacter: (id: string) => void;
  setActiveCharacter: (id: string) => void;

  // Legacy single char support
  myCharacter: MyCharacterProfile;
  updateMyCharacter: (char: Partial<MyCharacterProfile>) => void;

  setIsRaidLeader: (isRL: boolean) => void;
  setFilterStatus: (filter: 'ALL' | 'WINDOW_OPEN' | 'NEED_SCOUT' | 'ON_DUTY' | 'ALIVE') => void;
  setSearchQuery: (q: string) => void;
  setTimeGateOffsetMinutes: (offset: number) => void;
  resetToDefaults: () => void;

  // Time of Death (TOD) Actions
  setBossTimeOfDeath: (bossId: string, tod: string) => void;

  // Google Drive Actions
  setDriveStatus: (connected: boolean, email?: string | null) => void;
  syncFromDriveFile: (fileId: string, mimeType?: string) => Promise<void>;
  syncFromSpreadsheetUrl: (urlOrId: string) => Promise<void>;
  clearDriveSyncMessage: () => void;
  hydrateFromStorage: () => void;
}

export const useL2SpotStore = create<L2SpotStore>((set, get) => {
  const persistBosses = (bosses: L2Boss[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bosses));
      } catch {
        // ignore
      }
    }
  };

  const persistCharacters = (chars: UserCharacter[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(chars));
      } catch {
        // ignore
      }
    }
  };

  const initialBosses = EARLY_LINEAGE2_BOSSES;
  const initialCharacters = DEFAULT_CHARACTERS;
  const initialActiveCharId = DEFAULT_CHARACTERS[0].id;

  // Active rally if any boss is ALIVE
  const initialAlive = initialBosses.find((b) => b.status === 'ALIVE');
  const initialRally: RaidRallyAlert | null = initialAlive
    ? {
        bossId: initialAlive.id,
        bossName: initialAlive.name,
        scoutNickname: initialAlive.spotter?.nickname || 'Spectre_SR',
        timestamp: 1728000000000,
        type: 'SPAWN',
        commandChannelCall: true,
        message: `ВНИМАНИЕ! БОСС ${initialAlive.name.toUpperCase()} РЕСНУЛСЯ! СКАУТ НА МЕСТЕ! РЕЙД-ЛИДЕР ОБЪЯВЛЯЕТ СБОР КК!`,
      }
    : null;

  const currentActiveChar =
    initialCharacters.find((c) => c.id === initialActiveCharId) || initialCharacters[0];

  const defaultProfile: MyCharacterProfile = {
    nickname: currentActiveChar.nickname,
    className: currentActiveChar.className,
    classArchetype: currentActiveChar.classArchetype,
    clanName: currentActiveChar.clanName,
    level: currentActiveChar.levelNumber,
    approxLevel: currentActiveChar.approxLevel,
    gearSummary: currentActiveChar.gearSummary,
  };

  return {
    bosses: initialBosses,
    activeRally: initialRally,
    characters: initialCharacters,
    activeCharacterId: initialActiveCharId,
    myCharacter: defaultProfile,

    hydrateFromStorage: () => {
      if (typeof window === 'undefined') return;
      try {
        let loadedBosses = EARLY_LINEAGE2_BOSSES;
        let loadedChars = DEFAULT_CHARACTERS;
        let loadedActiveId = DEFAULT_CHARACTERS[0].id;

        const savedBosses = localStorage.getItem(STORAGE_KEY);
        if (savedBosses) {
          loadedBosses = JSON.parse(savedBosses);
        }
        const savedChars = localStorage.getItem(CHARACTERS_STORAGE_KEY);
        if (savedChars) {
          loadedChars = JSON.parse(savedChars);
          if (loadedChars.length > 0) {
            const main = loadedChars.find((c) => c.isMain) || loadedChars[0];
            loadedActiveId = main.id;
          }
        }

        const activeChar = loadedChars.find((c) => c.id === loadedActiveId) || loadedChars[0];
        const profile: MyCharacterProfile = {
          nickname: activeChar.nickname,
          className: activeChar.className,
          classArchetype: activeChar.classArchetype,
          clanName: activeChar.clanName,
          level: activeChar.levelNumber,
          approxLevel: activeChar.approxLevel,
          gearSummary: activeChar.gearSummary,
        };

        set({
          bosses: loadedBosses,
          characters: loadedChars,
          activeCharacterId: loadedActiveId,
          myCharacter: profile,
        });
      } catch {
        // ignore
      }
    },
    isRaidLeader: true,
    filterStatus: 'ALL',
    searchQuery: '',
    timeGateOffsetMinutes: 0,

    isDriveConnected: false,
    driveUserEmail: null,
    isSyncingDrive: false,
    lastDriveSyncTime: null,
    driveSyncMessage: null,

    getActiveCharacter: () => {
      const { characters, activeCharacterId } = get();
      return characters.find((c) => c.id === activeCharacterId) || characters[0];
    },

    takeSpot: (bossId, customChar, note) => {
      const activeChar = get().getActiveCharacter();
      const nickname = customChar?.nickname || activeChar.nickname;
      const className = customChar?.className || activeChar.className;
      const classArchetype = customChar?.classArchetype || activeChar.classArchetype;
      const clanName = customChar?.clanName || activeChar.clanName;
      const level = customChar?.level || activeChar.levelNumber;
      const approxLevel = customChar?.approxLevel || activeChar.approxLevel;
      const gearSummary = customChar?.gearSummary || activeChar.gearSummary;

      const newSpotter: L2Spotter = {
        id: 'spotter_' + Math.random().toString(36).substring(2, 8),
        nickname,
        className,
        classArchetype,
        clanName,
        level,
        approxLevel,
        gearSummary,
        sinceTimestamp: Date.now(),
        note: note || 'На споте, мониторю появление босса',
        isMe: true,
      };

      const updated = get().bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          spotter: newSpotter,
        };
      });

      persistBosses(updated);
      l2Audio.playEquipClick();
      set({ bosses: updated });
    },

    takeSpotWithCharacter: (bossId, characterId, note) => {
      const { characters, bosses } = get();
      const targetChar = characters.find((c) => c.id === characterId) || characters[0];

      const newSpotter: L2Spotter = {
        id: 'spotter_' + Math.random().toString(36).substring(2, 8),
        nickname: targetChar.nickname,
        className: targetChar.className,
        classArchetype: targetChar.classArchetype,
        clanName: targetChar.clanName,
        level: targetChar.levelNumber,
        approxLevel: targetChar.approxLevel,
        gearSummary: targetChar.gearSummary,
        sinceTimestamp: Date.now(),
        note: note || `На споте персонажем ${targetChar.nickname}`,
        isMe: true,
      };

      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          spotter: newSpotter,
        };
      });

      persistBosses(updated);
      l2Audio.playEquipClick();
      set({ bosses: updated, activeCharacterId: characterId });
    },

    leaveSpot: (bossId) => {
      const { bosses } = get();
      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          spotter: null,
        };
      });

      persistBosses(updated);
      l2Audio.playEquipClick();
      set({ bosses: updated });
    },

    reportSpawn: (bossId) => {
      const { bosses } = get();
      const activeChar = get().getActiveCharacter();
      const boss = bosses.find((b) => b.id === bossId);
      if (!boss) return;

      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          status: 'ALIVE' as BossState,
        };
      });

      const alert: RaidRallyAlert = {
        bossId,
        bossName: boss.name,
        scoutNickname: boss.spotter?.nickname || activeChar.nickname,
        timestamp: Date.now(),
        type: 'SPAWN',
        commandChannelCall: true,
        message: `🔥 СКАУТ ${boss.spotter?.nickname || activeChar.nickname}: БОСС ${boss.name.toUpperCase()} РЕСНУЛСЯ! СБОР ПАКОВ / КОМАНДНОГО КАНАЛА!`,
      };

      persistBosses(updated);
      l2Audio.playWarHorn();
      set({ bosses: updated, activeRally: alert });
    },

    reportPvp: (bossId) => {
      const { bosses } = get();
      const activeChar = get().getActiveCharacter();
      const boss = bosses.find((b) => b.id === bossId);
      if (!boss) return;

      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          status: 'PVP_ENGAGED' as BossState,
        };
      });

      const alert: RaidRallyAlert = {
        bossId,
        bossName: boss.name,
        scoutNickname: boss.spotter?.nickname || activeChar.nickname,
        timestamp: Date.now(),
        type: 'PVP',
        commandChannelCall: true,
        message: `⚔️ ТРЕВОГА! ВРАЖЕСКИЙ КЛАН НА СПОТЕ ${boss.name.toUpperCase()}! СРОЧНЫЙ СБОР ПВП-ПАКОВ!`,
      };

      persistBosses(updated);
      l2Audio.playPvpAlert();
      set({ bosses: updated, activeRally: alert });
    },

    declareRaid: (bossId) => {
      const { bosses } = get();
      const activeChar = get().getActiveCharacter();
      const boss = bosses.find((b) => b.id === bossId);
      if (!boss) return;

      const alert: RaidRallyAlert = {
        bossId,
        bossName: boss.name,
        scoutNickname: boss.spotter?.nickname || 'Рейд-Лидер',
        timestamp: Date.now(),
        type: 'SPAWN',
        commandChannelCall: true,
        message: `👑 РЕЙД-ЛИДЕР ${activeChar.nickname} ОБЪЯВИЛ СБОР КК НА ${boss.name.toUpperCase()}! ВСЕМ В ГОЛОС ДИСКОРДА!`,
      };

      l2Audio.playWarHorn();
      set({ activeRally: alert });
    },

    dismissRally: () => {
      l2Audio.playEquipClick();
      set({ activeRally: null });
    },

    markBossKilled: (bossId) => {
      const { bosses } = get();
      const boss = bosses.find((b) => b.id === bossId);
      if (!boss) return;

      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          status: 'DEAD' as BossState,
          lastKilledAt: Date.now(),
          spotter: null,
        };
      });

      persistBosses(updated);
      l2Audio.playRaidGong();

      set({
        bosses: updated,
        activeRally: null,
      });
    },

    setBossState: (bossId, status) => {
      const { bosses } = get();
      const updated = bosses.map((b) => (b.id === bossId ? { ...b, status } : b));
      persistBosses(updated);
      set({ bosses: updated });
    },

    // -------------------------------------------------------------
    // Personal Cabinet Character Management
    // -------------------------------------------------------------
    addCharacter: (newCharData) => {
      const newChar: UserCharacter = {
        ...newCharData,
        id: 'char_' + Math.random().toString(36).substring(2, 9),
        createdAt: Date.now(),
      };

      const updated = [...get().characters, newChar];
      persistCharacters(updated);
      l2Audio.playEquipClick();

      set({ characters: updated, activeCharacterId: newChar.id });
      return newChar;
    },

    updateCharacter: (id, updates) => {
      const updated = get().characters.map((c) => (c.id === id ? { ...c, ...updates } : c));
      persistCharacters(updated);
      l2Audio.playEquipClick();
      set({ characters: updated });
    },

    deleteCharacter: (id) => {
      const { characters, activeCharacterId } = get();
      if (characters.length <= 1) {
        return; // Keep at least one character
      }
      const updated = characters.filter((c) => c.id !== id);
      const newActiveId = activeCharacterId === id ? updated[0].id : activeCharacterId;
      persistCharacters(updated);
      l2Audio.playEquipClick();
      set({ characters: updated, activeCharacterId: newActiveId });
    },

    setActiveCharacter: (id) => {
      const found = get().characters.find((c) => c.id === id);
      if (!found) return;

      l2Audio.playEquipClick();
      set({
        activeCharacterId: id,
        myCharacter: {
          nickname: found.nickname,
          className: found.className,
          classArchetype: found.classArchetype,
          clanName: found.clanName,
          level: found.levelNumber,
          approxLevel: found.approxLevel,
          gearSummary: found.gearSummary,
        },
      });
    },

    updateMyCharacter: (charUpdate) => {
      const { activeCharacterId } = get();
      get().updateCharacter(activeCharacterId, {
        nickname: charUpdate.nickname,
        className: charUpdate.className,
        classArchetype: charUpdate.classArchetype,
        clanName: charUpdate.clanName,
        levelNumber: charUpdate.level,
        approxLevel: charUpdate.approxLevel,
        gearSummary: charUpdate.gearSummary,
      });

      set((state) => {
        const updated = { ...state.myCharacter, ...charUpdate };
        return { myCharacter: updated };
      });
    },

    setIsRaidLeader: (isRL) => {
      l2Audio.playEquipClick();
      set({ isRaidLeader: isRL });
    },

    setFilterStatus: (filterStatus) => {
      set({ filterStatus });
    },

    setSearchQuery: (searchQuery) => {
      set({ searchQuery });
    },

    setTimeGateOffsetMinutes: (offset) => {
      set({ timeGateOffsetMinutes: offset });
    },

    resetToDefaults: () => {
      persistBosses(EARLY_LINEAGE2_BOSSES);
      persistCharacters(DEFAULT_CHARACTERS);
      set({
        bosses: EARLY_LINEAGE2_BOSSES,
        characters: DEFAULT_CHARACTERS,
        activeCharacterId: DEFAULT_CHARACTERS[0].id,
        activeRally: null,
        filterStatus: 'ALL',
        searchQuery: '',
        timeGateOffsetMinutes: 0,
      });
      l2Audio.playEquipClick();
    },

    setBossTimeOfDeath: (bossId, tod) => {
      const { bosses } = get();
      const updated = bosses.map((b) => {
        if (b.id !== bossId) return b;
        return {
          ...b,
          timeOfDeath: tod,
        };
      });
      persistBosses(updated);
      l2Audio.playEquipClick();
      set({ bosses: updated });
    },

    setDriveStatus: (connected, email) => {
      set({
        isDriveConnected: connected,
        driveUserEmail: email || null,
      });
    },

    syncFromDriveFile: async (fileId, mimeType) => {
      set({ isSyncingDrive: true, driveSyncMessage: 'Загрузка базы данных из Google Диска...' });
      try {
        const content = await fetchDriveFileContent(fileId, mimeType);
        const { updatedBosses, importedCount, message } = parseBossDatabaseContent(
          content,
          get().bosses
        );

        persistBosses(updatedBosses);
        l2Audio.playEquipClick();

        set({
          bosses: updatedBosses,
          isSyncingDrive: false,
          lastDriveSyncTime: new Date().toLocaleTimeString(),
          driveSyncMessage: message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка Google Drive';
        set({
          isSyncingDrive: false,
          driveSyncMessage: `Ошибка: ${msg}`,
        });
      }
    },

    syncFromSpreadsheetUrl: async (urlOrId) => {
      set({ isSyncingDrive: true, driveSyncMessage: 'Загрузка данных из Google Таблицы...' });
      try {
        const content = await fetchSpreadsheetByUrl(urlOrId);
        const { updatedBosses, importedCount, message } = parseBossDatabaseContent(
          content,
          get().bosses
        );

        persistBosses(updatedBosses);
        l2Audio.playEquipClick();

        set({
          bosses: updatedBosses,
          isSyncingDrive: false,
          lastDriveSyncTime: new Date().toLocaleTimeString(),
          driveSyncMessage: message,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Не удалось загрузить Google Таблицу';
        set({
          isSyncingDrive: false,
          driveSyncMessage: `Ошибка: ${msg}`,
        });
      }
    },

    clearDriveSyncMessage: () => {
      set({ driveSyncMessage: null });
    },
  };
});
