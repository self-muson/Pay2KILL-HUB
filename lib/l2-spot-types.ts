export type BossState = 'ALIVE' | 'WINDOW_OPEN' | 'DEAD' | 'PVP_ENGAGED';

export type L2ClassArchetype = 'ARCHER' | 'DAGGER' | 'SUPPORT' | 'WARRIOR' | 'MAGE' | 'TANK' | 'SUMMONER';

export interface L2Spotter {
  id: string;
  nickname: string;
  className: string;
  classArchetype: L2ClassArchetype;
  clanName: string;
  level: number;
  approxLevel?: string;
  gearSummary?: string;
  sinceTimestamp: number;
  note?: string;
  isMe?: boolean;
}

export interface RaidRallyAlert {
  bossId: string;
  bossName: string;
  scoutNickname: string;
  timestamp: number;
  type: 'SPAWN' | 'PVP';
  commandChannelCall: boolean;
  message: string;
}

export interface L2Boss {
  id: string;
  name: string;
  title: string;
  level: number;
  location: string;
  territory: string;
  image: string;
  status: BossState;
  windowStart: string; // e.g. "18:00"
  windowEnd: string;   // e.g. "21:00"
  respawnCooldownHours: number;
  timeOfDeath?: string; // Actual Time of Death from Google Sheets, e.g. "14:20" or "02:15"
  timeOfDeathTimestamp?: number;
  lastKilledAt?: number;
  respawnTimeRemainingSec?: number;
  spotter: L2Spotter | null;
  targetMacro: string;
  dropHighlights: string[];
}

export interface UserCharacter {
  id: string;
  nickname: string;
  approxLevel: string; // e.g. "20-24" or "~23"
  levelNumber: number; // numeric approximation for calculations
  className: string;
  classArchetype: L2ClassArchetype;
  gearSummary: string; // e.g. "Brigandine Set + Bastard Sword"
  clanName: string;
  isMain?: boolean;
  createdAt: number;
}

export interface MyCharacterProfile {
  nickname: string;
  className: string;
  classArchetype: L2ClassArchetype;
  clanName: string;
  level: number;
  approxLevel?: string;
  gearSummary?: string;
}
