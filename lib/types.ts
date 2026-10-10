export type Role = 'Tank' | 'Heal' | 'Buffer' | 'DD' | 'Summoner';

export type L2ClassId =
  // Tanks
  | 'Paladin'
  | 'DarkAvenger'
  | 'TempleKnight'
  | 'ShillienKnight'
  // Healers
  | 'Bishop'
  | 'ElvenElder'
  | 'ShillienElder'
  // Buffers & Enchanters
  | 'Prophet'
  | 'Warcryer'
  | 'Overlord'
  | 'Swordsinger'
  | 'Bladedancer'
  // Daggers
  | 'AbyssWalker'
  | 'PlainsWalker'
  | 'TreasureHunter'
  // Archers
  | 'Hawkeye'
  | 'SilverRanger'
  | 'PhantomRanger'
  // Mages
  | 'Spellhowler'
  | 'Spellsinger'
  | 'Sorcerer'
  | 'Necromancer'
  // Summoners (Саммонеры)
  | 'Warlock'
  | 'ElementalSummoner'
  | 'PhantomSummoner'
  | 'ArcanaLord'
  | 'ElementalMaster'
  | 'SpectralMaster'
  // Melee & Warriors
  | 'Destroyer'
  | 'Tyrant'
  | 'Gladiator'
  | 'Warlord'
  | 'BountyHunter'
  | 'Warsmith';

export type Goal = 'Raid' | 'Siege' | 'AoE' | 'Exp' | 'PvP' | 'Spoil';

export type EquipGrade = 'A-Grade' | 'B-Grade' | 'C-Grade' | 'D-Grade';

export interface L2ClassInfo {
  id: L2ClassId;
  nameEn: string;
  shortCode: string;
  role: Role;
  category: 'Tank' | 'Healer' | 'Support' | 'Dagger' | 'Archer' | 'Mage' | 'Summoner' | 'Warrior';
}

export const L2_CLASSES_LIST: L2ClassInfo[] = [
  // Tanks
  { id: 'Paladin', nameEn: 'Paladin (PAL)', shortCode: 'PAL', role: 'Tank', category: 'Tank' },
  { id: 'DarkAvenger', nameEn: 'Dark Avenger (DA)', shortCode: 'DA', role: 'Tank', category: 'Tank' },
  { id: 'TempleKnight', nameEn: 'Temple Knight (TK)', shortCode: 'TK', role: 'Tank', category: 'Tank' },
  { id: 'ShillienKnight', nameEn: 'Shillien Knight (SK)', shortCode: 'SK', role: 'Tank', category: 'Tank' },

  // Healers
  { id: 'Bishop', nameEn: 'Bishop (BP)', shortCode: 'BP', role: 'Heal', category: 'Healer' },
  { id: 'ElvenElder', nameEn: 'Elven Elder (EE)', shortCode: 'EE', role: 'Heal', category: 'Healer' },
  { id: 'ShillienElder', nameEn: 'Shillien Elder (SE)', shortCode: 'SE', role: 'Heal', category: 'Healer' },

  // Buffers & Enchanters
  { id: 'Prophet', nameEn: 'Prophet (PP)', shortCode: 'PP', role: 'Buffer', category: 'Support' },
  { id: 'Warcryer', nameEn: 'Warcryer (WC)', shortCode: 'WC', role: 'Buffer', category: 'Support' },
  { id: 'Overlord', nameEn: 'Overlord (OL)', shortCode: 'OL', role: 'Buffer', category: 'Support' },
  { id: 'Swordsinger', nameEn: 'Swordsinger (SWS)', shortCode: 'SWS', role: 'Buffer', category: 'Support' },
  { id: 'Bladedancer', nameEn: 'Bladedancer (BD)', shortCode: 'BD', role: 'Buffer', category: 'Support' },

  // Daggers
  { id: 'AbyssWalker', nameEn: 'Abyss Walker (AW)', shortCode: 'AW', role: 'DD', category: 'Dagger' },
  { id: 'PlainsWalker', nameEn: 'Plains Walker (PW)', shortCode: 'PW', role: 'DD', category: 'Dagger' },
  { id: 'TreasureHunter', nameEn: 'Treasure Hunter (TH)', shortCode: 'TH', role: 'DD', category: 'Dagger' },

  // Archers
  { id: 'Hawkeye', nameEn: 'Hawkeye (HE)', shortCode: 'HE', role: 'DD', category: 'Archer' },
  { id: 'SilverRanger', nameEn: 'Silver Ranger (SR)', shortCode: 'SR', role: 'DD', category: 'Archer' },
  { id: 'PhantomRanger', nameEn: 'Phantom Ranger (PR)', shortCode: 'PR', role: 'DD', category: 'Archer' },

  // Mages
  { id: 'Spellhowler', nameEn: 'Spellhowler (SH)', shortCode: 'SH', role: 'DD', category: 'Mage' },
  { id: 'Spellsinger', nameEn: 'Spellsinger (SPS)', shortCode: 'SPS', role: 'DD', category: 'Mage' },
  { id: 'Sorcerer', nameEn: 'Sorcerer (Sorc)', shortCode: 'SORC', role: 'DD', category: 'Mage' },
  { id: 'Necromancer', nameEn: 'Necromancer (Necro)', shortCode: 'NECRO', role: 'DD', category: 'Mage' },

  // Summoners (Саммонеры)
  { id: 'Warlock', nameEn: 'Warlock / Котовод (WK)', shortCode: 'WK', role: 'Summoner', category: 'Summoner' },
  { id: 'ElementalSummoner', nameEn: 'Elemental Summoner / Коневод (ES)', shortCode: 'ES', role: 'Summoner', category: 'Summoner' },
  { id: 'PhantomSummoner', nameEn: 'Phantom Summoner / Теневод (PS)', shortCode: 'PS', role: 'Summoner', category: 'Summoner' },
  { id: 'ArcanaLord', nameEn: 'Arcana Lord / Аркана Лорд (AL)', shortCode: 'AL', role: 'Summoner', category: 'Summoner' },
  { id: 'ElementalMaster', nameEn: 'Elemental Master / Элементал Мастер (EM)', shortCode: 'EM', role: 'Summoner', category: 'Summoner' },
  { id: 'SpectralMaster', nameEn: 'Spectral Master / Спектрал Мастер (SM)', shortCode: 'SM', role: 'Summoner', category: 'Summoner' },

  // Warriors / Melee
  { id: 'Destroyer', nameEn: 'Destroyer (Destro)', shortCode: 'DESTRO', role: 'DD', category: 'Warrior' },
  { id: 'Tyrant', nameEn: 'Tyrant (Tyr)', shortCode: 'TYR', role: 'DD', category: 'Warrior' },
  { id: 'Gladiator', nameEn: 'Gladiator (Glad)', shortCode: 'GLAD', role: 'DD', category: 'Warrior' },
  { id: 'Warlord', nameEn: 'Warlord (WL)', shortCode: 'WL', role: 'DD', category: 'Warrior' },
  { id: 'BountyHunter', nameEn: 'Bounty Hunter (Spoil)', shortCode: 'SPOIL', role: 'DD', category: 'Warrior' },
  { id: 'Warsmith', nameEn: 'Warsmith (Craft)', shortCode: 'CRAFT', role: 'DD', category: 'Warrior' },
];

export const GOALS_LIST: { id: Goal; key: string }[] = [
  { id: 'Raid', key: 'goalRaid' },
  { id: 'Siege', key: 'goalSiege' },
  { id: 'AoE', key: 'goalAoe' },
  { id: 'Exp', key: 'goalExp' },
  { id: 'PvP', key: 'goalPvp' },
  { id: 'Spoil', key: 'goalSpoil' },
];

export interface ClanInfo {
  id: string;
  name: string;
}

export const INITIAL_CLANS_LIST: ClanInfo[] = [
  { id: 'PAY2KILL', name: 'Pay2KILL' },
  { id: 'P2K_ACADEMY', name: 'P2K_Academy' },
  { id: 'P2K_FRIENDS', name: 'P2K_Friends' },
  { id: 'BLOODLINE', name: 'Bloodline Alliance' },
];

export interface QueuePlayer {
  id: string;
  ownerId: string;
  nickname: string;
  clan: string;
  role: Role;
  l2Class: L2ClassId;
  subClass?: string;
  level: number;
  equipGrade: EquipGrade;
  goal: Goal;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  status: 'searching' | 'in_group';
  assignedGroupId?: string;
  rlName?: string;
}

export interface ActiveGroup {
  id: string;
  ownerId: string;
  rlNickname: string;
  rlClan: string;
  rlClass?: L2ClassId;
  rlLevel?: number;
  title: string;
  goal: Goal;
  maxMembers: number;
  discordVoice?: string;
  createdAt: number;
  members: QueuePlayer[];
}

export interface KbTopic {
  id: string;
  title: string;
  subtitle: string;
  category: 'party_comp' | 'epics' | 'aoe_spots' | 'pl_commands';
  content: string;
}

export interface CharterRule {
  id: string;
  num: number;
  title: string;
  desc: string;
}

export interface LfgState {
  queuePlayers: QueuePlayer[];
  activeGroups: ActiveGroup[];
  clans: ClanInfo[];
  kbTopics: KbTopic[];
  charterRules: CharterRule[];
  pinCode: string;
  adminPinCode: string;
  bossViewerPin?: string;
  bossScoutPin?: string;
  bossAdminPin?: string;
  pinVersion?: number;
  lastUpdated: number;
}
