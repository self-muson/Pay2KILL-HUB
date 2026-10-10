import { UserCharacter } from './l2-spot-types';

export type UserRole = 'admin' | 'scout' | 'member';

export interface UserPermissions {
  canViewBosses: boolean;   // Просмотр таблицы/радара боссов
  canEditBosses: boolean;   // Редактирование боссов (TOD, статус, респаун)
  canViewLfg: boolean;      // Просмотр LFG групп и очереди
  canManageLfg: boolean;    // Создание/управление группами LFG
  canManageUsers: boolean;  // Администрирование пользователей и прав
}

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'admin') {
    return {
      canViewBosses: true,
      canEditBosses: true,
      canViewLfg: true,
      canManageLfg: true,
      canManageUsers: true,
    };
  }
  if (role === 'scout') {
    return {
      canViewBosses: true,
      canEditBosses: true,
      canViewLfg: true,
      canManageLfg: true,
      canManageUsers: false,
    };
  }
  return {
    canViewBosses: true,
    canEditBosses: false,
    canViewLfg: true,
    canManageLfg: false,
    canManageUsers: false,
  };
}

export interface AppUser {
  id: string;
  username: string; // unique lowercase or normalized
  displayName: string;
  passwordHash: string; // sha256 with salt
  salt: string;
  role: UserRole;
  permissions: UserPermissions;
  clanName: string;
  discordTag?: string;
  characters: UserCharacter[];
  activeCharacterId?: string;
  createdAt: number;
  lastActiveAt: number;
}

export interface UserSessionData {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  permissions: UserPermissions;
  clanName: string;
  discordTag?: string;
  characters: UserCharacter[];
  activeCharacterId?: string;
  token: string;
}

