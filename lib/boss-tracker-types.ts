export type BossPhase = 'WINDOW_OPEN' | 'WAITING_WINDOW' | 'WINDOW_EXPIRED' | 'NO_DATA';

export type TrackerRole = 'viewer' | 'scout' | 'admin';

export interface BossSpotterInfo {
  nickname: string;
  className: string;
  level: number;
  clanName: string;
  isMe?: boolean;
  assignedAt: number;
}

export interface CameraAccountCharacter {
  id: string;
  characterName: string;
  bossId: string;
  bossName?: string;
  camCode?: string;
}

export interface TrackerBoss {
  id: string;
  name: string;
  level: number;
  camCode?: string;
  timeOfDeath?: string; // "HH:MM:SS" or "HH:MM"
  timeOfDeathTimestamp?: number;
  windowStart?: string; // "HH:MM"
  windowEnd?: string;   // "HH:MM"
  windowStartTimestamp?: number;
  windowEndTimestamp?: number;
  minCooldownHours: number;
  maxCooldownHours: number;
  phase: BossPhase;
  secondsUntilWindow?: number;
  secondsRemainingInWindow?: number;
  notes?: string;
  link?: string;
  assignedSpotter?: BossSpotterInfo | null;
  spawnAlertUntil?: number; // timestamp when 10 min spawn alert ends
  readyCheckUntil?: number; // timestamp when 10 min ready check ends
  readyCheckBy?: string;    // nickname of initiator
  lastReadyCheckTimestamp?: number; // timestamp when ready check was last triggered (for 10 min cooldown)
  selectedAuthorGroup?: string; // selected camera group specifically for this boss (e.g. 'Qox', 'Кекс', 'Snoop')
  selectedAccountId?: number; // selected camera account for this boss
  selectedCharacterName?: string; // character name standing on this boss's camera
  selectedCamCode?: string; // camera code belonging to the chosen group for this boss
}

export interface SpawnAlertLogEntry {
  id: string;
  bossId: string;
  bossName: string;
  bossLevel: number;
  pressedBy: {
    nickname: string;
    className: string;
    level: number;
    clanName: string;
    role: TrackerRole;
  };
  timestamp: number;
  timeFormatted: string; // "15:42:08"
  dateFormatted: string; // "06.10"
  status: 'ACTIVE' | 'CANCELLED';
  cancelledBy?: {
    nickname: string;
    role: TrackerRole;
  };
  cancelledAt?: number;
}

export interface SpectatorUser {
  id: string;
  nickname: string;
  className: string;
  level: number;
  clanName: string;
  role: 'VIEWER' | 'SPOTTER' | 'LEADER';
  isMe?: boolean;
  lastActive: number;
}
