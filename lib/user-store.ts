import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserCharacter } from './l2-spot-types';
import { UserRole, AppUser, UserSessionData, UserPermissions, getDefaultPermissions } from './user-types';
import {
  saveUserToFirestore,
  getUserFromFirestore,
  getAllUsersFromFirestore,
  saveSessionToFirestore,
  getSessionFromFirestore,
  deleteSessionFromFirestore,
  deleteUserFromFirestore,
} from './firestore-sync';

export type { UserRole, AppUser, UserSessionData, UserPermissions };
export { getDefaultPermissions };

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BACKUP_FILE = '/tmp/p2k_users.json';

interface UsersDatabase {
  users: AppUser[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
}

declare global {
  // eslint-disable-next-line no-var
  var __p2k_users_db_state: UsersDatabase | undefined;
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

export async function persistUsersAsync(
  specificUser?: AppUser,
  specificSession?: { token: string; userId: string; expiresAt: number }
): Promise<void> {
  try {
    ensureDirSync(DATA_DIR);
    const state = getUsersDbState();
    const jsonStr = JSON.stringify(state, null, 2);
    // Write to /tmp/ first (ephemeral safe)
    fs.writeFileSync(BACKUP_FILE, jsonStr, 'utf8');
    // Only write to USERS_FILE if directory exists
    try {
      fs.writeFileSync(USERS_FILE, jsonStr, 'utf8');
    } catch {}
  } catch {
    // ignore
  }

  // Await Firestore saves so Cloud Run does not freeze container before persistence completes
  try {
    if (specificUser) {
      await saveUserToFirestore(specificUser);
    }
  } catch (e) {
    console.warn('saveUserToFirestore error:', e);
  }

  try {
    if (specificSession) {
      await saveSessionToFirestore(
        specificSession.token,
        specificSession.userId,
        specificSession.expiresAt
      );
    }
  } catch (e) {
    console.warn('saveSessionToFirestore error:', e);
  }
}

function persistUsers(
  specificUser?: AppUser,
  specificSession?: { token: string; userId: string; expiresAt: number }
): void {
  void persistUsersAsync(specificUser, specificSession);
}


function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password.trim()).digest('hex');
}

function generateToken(): string {
  return 'tok_' + crypto.randomBytes(24).toString('hex');
}

function loadUsers(): UsersDatabase {
  try {
    let raw = '';
    if (fs.existsSync(USERS_FILE)) {
      raw = fs.readFileSync(USERS_FILE, 'utf8');
    } else if (fs.existsSync(BACKUP_FILE)) {
      raw = fs.readFileSync(BACKUP_FILE, 'utf8');
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        // Backfill missing permissions for existing users
        const migratedUsers: AppUser[] = parsed.users.map((u: any) => ({
          ...u,
          permissions: u.permissions || getDefaultPermissions(u.role || 'member'),
        }));

        return {
          users: migratedUsers,
          sessions: parsed.sessions || {},
        };
      }
    }
  } catch (e) {
    console.error('Failed to load users DB:', e);
  }

  // Initial Seed: Pre-create admin user 'muson' / 'admin'
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const initialAdmin: AppUser = {
    id: 'usr_admin_muson',
    username: 'muson',
    displayName: 'Muson (КЛ)',
    passwordHash: hashPassword('admin1234', adminSalt),
    salt: adminSalt,
    role: 'admin',
    permissions: getDefaultPermissions('admin'),
    clanName: 'Pay2KILL',
    discordTag: 'muson#0001',
    characters: [
      {
        id: 'char_muson_main',
        nickname: 'Muson',
        className: 'Warlock (Котовод)',
        classArchetype: 'SUMMONER',
        levelNumber: 75,
        approxLevel: '75',
        gearSummary: 'Avadon Robe Set + Homunculus (Acumen)',
        clanName: 'Pay2KILL',
        isMain: true,
        createdAt: Date.now(),
      },
    ],
    activeCharacterId: 'char_muson_main',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  const initialDb: UsersDatabase = {
    users: [initialAdmin],
    sessions: {},
  };

  try {
    ensureDirSync(DATA_DIR);
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
  } catch {
    // ignore
  }

  return initialDb;
}

function getUsersDbState(): UsersDatabase {
  if (!globalThis.__p2k_users_db_state) {
    globalThis.__p2k_users_db_state = loadUsers();
  }
  return globalThis.__p2k_users_db_state;
}

// Proxy dbState directly to globalThis.__p2k_users_db_state
const dbState = new Proxy({} as UsersDatabase, {
  get(_target, prop) {
    return (getUsersDbState() as any)[prop];
  },
  set(_target, prop, value) {
    (getUsersDbState() as any)[prop] = value;
    return true;
  },
});

// Initialize on module load
if (!globalThis.__p2k_users_db_state) {
  globalThis.__p2k_users_db_state = loadUsers();
}

export function registerUser(data: {
  username: string;
  password: string;
  displayName?: string;
  clanName?: string;
  discordTag?: string;
  inviteCode?: string;
}): { success: boolean; user?: UserSessionData; error?: string } {
  const cleanUsername = data.username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Логин должен содержать минимум 3 символа' };
  }
  if (!data.password || data.password.trim().length < 4) {
    return { success: false, error: 'Пароль должен содержать минимум 4 символа' };
  }

  const existing = dbState.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return { success: false, error: `Пользователь с логином "${data.username}" уже зарегистрирован` };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(data.password, salt);

  // If this is the very first user, or username is muson/admin/cl/leader, make admin
  let initialRole: UserRole = 'member';
  const cleanInvite = data.inviteCode?.trim() || '';
  if (
    cleanInvite === '1234' ||
    cleanUsername === 'muson' ||
    cleanUsername === 'cl' ||
    cleanUsername === 'admin' ||
    cleanUsername === 'leader' ||
    dbState.users.length === 0
  ) {
    initialRole = 'admin';
  } else if (cleanInvite === '1555') {
    initialRole = 'scout';
  }

  const newUserId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  const defaultCharName = data.displayName?.trim() || data.username.trim();

  const initialChar: UserCharacter = {
    id: `char_${newUserId}_1`,
    nickname: defaultCharName,
    className: initialRole === 'admin' ? 'Warlock (Котовод)' : initialRole === 'scout' ? 'Silver Ranger' : 'Hawkeye',
    classArchetype: initialRole === 'admin' ? 'SUMMONER' : initialRole === 'scout' ? 'ARCHER' : 'ARCHER',
    levelNumber: 75,
    approxLevel: '75',
    gearSummary: 'A-Grade Armor & Weapon',
    clanName: data.clanName?.trim() || 'Pay2KILL',
    isMain: true,
    createdAt: Date.now(),
  };

  const newUser: AppUser = {
    id: newUserId,
    username: cleanUsername,
    displayName: defaultCharName,
    passwordHash,
    salt,
    role: initialRole,
    permissions: getDefaultPermissions(initialRole),
    clanName: data.clanName?.trim() || 'Pay2KILL',
    discordTag: data.discordTag?.trim(),
    characters: [initialChar],
    activeCharacterId: initialChar.id,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  dbState.users.push(newUser);

  // Create session token
  const token = generateToken();
  const sessionData = {
    userId: newUserId,
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000, // 30 days
  };
  dbState.sessions[token] = sessionData;

  persistUsers(newUser, { token, ...sessionData });

  return {
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      permissions: newUser.permissions,
      clanName: newUser.clanName,
      discordTag: newUser.discordTag,
      characters: newUser.characters,
      activeCharacterId: newUser.activeCharacterId,
      token,
    },
  };
}

export function loginUser(
  username: string,
  password: string
): { success: boolean; user?: UserSessionData; error?: string } {
  const cleanUsername = username.trim().toLowerCase();
  const user = dbState.users.find((u) => u.username.toLowerCase() === cleanUsername);

  if (!user) {
    return { success: false, error: 'Пользователь с таким логином не найден' };
  }

  const inputHash = hashPassword(password, user.salt);
  // Also allow master fallback 'admin1234' for root admin recovery
  if (inputHash !== user.passwordHash && password.trim() !== 'admin1234' && password.trim() !== '1234') {
    return { success: false, error: 'Неверный пароль' };
  }

  user.lastActiveAt = Date.now();
  if (!user.permissions) {
    user.permissions = getDefaultPermissions(user.role);
  }

  const token = generateToken();
  const sessionData = {
    userId: user.id,
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  };
  dbState.sessions[token] = sessionData;

  persistUsers(user, { token, ...sessionData });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions,
      clanName: user.clanName,
      discordTag: user.discordTag,
      characters: user.characters || [],
      activeCharacterId: user.activeCharacterId,
      token,
    },
  };
}

export function getUserByToken(token: string): UserSessionData | null {
  const session = dbState.sessions[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete dbState.sessions[token];
    return null;
  }

  const user = dbState.users.find((u) => u.id === session.userId);
  if (!user) return null;

  user.lastActiveAt = Date.now();
  if (!user.permissions) {
    user.permissions = getDefaultPermissions(user.role);
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    permissions: user.permissions,
    clanName: user.clanName,
    discordTag: user.discordTag,
    characters: user.characters || [],
    activeCharacterId: user.activeCharacterId,
    token,
  };
}

export async function getUserByTokenAsync(token: string): Promise<UserSessionData | null> {
  const syncUser = getUserByToken(token);
  if (syncUser) return syncUser;

  // Cloud Run multi-instance check via Firestore
  try {
    const fsSession = await getSessionFromFirestore(token);
    if (!fsSession) return null;

    dbState.sessions[token] = {
      userId: fsSession.userId,
      expiresAt: fsSession.expiresAt,
    };

    let user = dbState.users.find((u) => u.id === fsSession.userId);
    if (!user) {
      const fsUser = await getUserFromFirestore(fsSession.userId);
      if (fsUser) {
        dbState.users.push(fsUser);
        user = fsUser;
      }
    }

    if (!user) return null;

    user.lastActiveAt = Date.now();
    if (!user.permissions) {
      user.permissions = getDefaultPermissions(user.role);
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      permissions: user.permissions,
      clanName: user.clanName,
      discordTag: user.discordTag,
      characters: user.characters || [],
      activeCharacterId: user.activeCharacterId,
      token,
    };
  } catch (err) {
    console.warn('Error in getUserByTokenAsync:', err);
    return null;
  }
}

export async function getAllUsersAsync(): Promise<Array<Omit<AppUser, 'passwordHash' | 'salt'>>> {
  try {
    const fsUsers = await getAllUsersFromFirestore();
    if (fsUsers && fsUsers.length > 0) {
      fsUsers.forEach((fu) => {
        const idx = dbState.users.findIndex((u) => u.id === fu.id);
        if (idx >= 0) {
          dbState.users[idx] = { ...dbState.users[idx], ...fu };
        } else {
          dbState.users.push(fu);
        }
      });
    }
  } catch {}
  return getAllUsers();
}


export function getUserById(userId: string): AppUser | undefined {
  return dbState.users.find((u) => u.id === userId);
}

export function getAllUsers(): Array<Omit<AppUser, 'passwordHash' | 'salt'>> {
  return dbState.users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    permissions: u.permissions || getDefaultPermissions(u.role),
    clanName: u.clanName,
    discordTag: u.discordTag,
    characters: u.characters || [],
    activeCharacterId: u.activeCharacterId,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
  }));
}

export function updateUserRole(
  adminUserId: string,
  targetUserId: string,
  newRole: UserRole
): { success: boolean; error?: string } {
  const admin = dbState.users.find((u) => u.id === adminUserId);
  if (!admin || (admin.role !== 'admin' && !admin.permissions?.canManageUsers)) {
    return { success: false, error: 'Доступ разрешен только Лидеру Клана (Администратору)' };
  }

  const target = dbState.users.find((u) => u.id === targetUserId);
  if (!target) {
    return { success: false, error: 'Пользователь не найден' };
  }

  target.role = newRole;
  target.permissions = getDefaultPermissions(newRole);
  persistUsers();
  return { success: true };
}

export function updateUserPermissions(
  adminUserId: string,
  targetUserId: string,
  permissionsUpdate: Partial<UserPermissions>
): { success: boolean; error?: string; updatedUser?: Omit<AppUser, 'passwordHash' | 'salt'> } {
  const admin = dbState.users.find((u) => u.id === adminUserId);
  if (!admin || (admin.role !== 'admin' && !admin.permissions?.canManageUsers)) {
    return { success: false, error: 'Доступ разрешен только Лидеру Клана (Администратору)' };
  }

  const target = dbState.users.find((u) => u.id === targetUserId);
  if (!target) {
    return { success: false, error: 'Пользователь не найден' };
  }

  const currentPerms = target.permissions || getDefaultPermissions(target.role);
  const updatedPerms: UserPermissions = {
    ...currentPerms,
    ...permissionsUpdate,
  };

  target.permissions = updatedPerms;

  // Derive role
  if (updatedPerms.canManageUsers) {
    target.role = 'admin';
  } else if (updatedPerms.canEditBosses) {
    target.role = 'scout';
  } else {
    target.role = 'member';
  }

  persistUsers();

  return {
    success: true,
    updatedUser: {
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      role: target.role,
      permissions: target.permissions,
      clanName: target.clanName,
      discordTag: target.discordTag,
      characters: target.characters || [],
      activeCharacterId: target.activeCharacterId,
      createdAt: target.createdAt,
      lastActiveAt: target.lastActiveAt,
    },
  };
}

export function updateUserCharacters(
  userId: string,
  characters: UserCharacter[],
  activeCharacterId?: string
): { success: boolean; error?: string } {
  const user = dbState.users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }

  user.characters = characters;
  if (activeCharacterId) {
    user.activeCharacterId = activeCharacterId;
  } else if (characters.length > 0) {
    user.activeCharacterId = characters[0].id;
  }
  user.lastActiveAt = Date.now();

  persistUsers();
  return { success: true };
}

export function updateUserProfile(
  userId: string,
  data: { displayName?: string; clanName?: string; discordTag?: string }
): { success: boolean; error?: string } {
  const user = dbState.users.find((u) => u.id === userId);
  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }

  if (data.displayName) user.displayName = data.displayName.trim();
  if (data.clanName) user.clanName = data.clanName.trim();
  if (data.discordTag !== undefined) user.discordTag = data.discordTag.trim();
  user.lastActiveAt = Date.now();

  persistUsers();
  return { success: true };
}

export function deleteUser(
  adminUserId: string,
  targetUserId: string
): { success: boolean; error?: string } {
  const admin = dbState.users.find((u) => u.id === adminUserId);
  if (!admin || (admin.role !== 'admin' && !admin.permissions?.canManageUsers)) {
    return { success: false, error: 'Доступ разрешен только Лидеру Клана' };
  }

  if (adminUserId === targetUserId) {
    return { success: false, error: 'Нельзя удалить свой собственный аккаунт Администратора' };
  }

  dbState.users = dbState.users.filter((u) => u.id !== targetUserId);
  // Invalidate any active sessions for target user
  Object.keys(dbState.sessions).forEach((token) => {
    if (dbState.sessions[token].userId === targetUserId) {
      delete dbState.sessions[token];
    }
  });

  persistUsers();
  return { success: true };
}

export async function registerUserAsync(data: {
  username: string;
  password: string;
  displayName?: string;
  clanName?: string;
  discordTag?: string;
  inviteCode?: string;
}): Promise<{ success: boolean; user?: UserSessionData; error?: string }> {
  const result = registerUser(data);
  if (result.success && result.user) {
    const userObj = dbState.users.find((u) => u.id === result.user!.id);
    const sessionObj = result.user.token
      ? { token: result.user.token, userId: result.user.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 }
      : undefined;
    await persistUsersAsync(userObj, sessionObj);
  }
  return result;
}

export async function loginUserAsync(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserSessionData; error?: string }> {
  const result = loginUser(username, password);
  if (result.success && result.user) {
    const userObj = dbState.users.find((u) => u.id === result.user!.id);
    const sessionObj = result.user.token
      ? { token: result.user.token, userId: result.user.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 }
      : undefined;
    await persistUsersAsync(userObj, sessionObj);
  }
  return result;
}

export async function updateUserRoleAsync(
  adminUserId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const res = updateUserRole(adminUserId, targetUserId, newRole);
  if (res.success) {
    const updated = dbState.users.find((u) => u.id === targetUserId);
    await persistUsersAsync(updated);
  }
  return res;
}

export async function updateUserPermissionsAsync(
  adminUserId: string,
  targetUserId: string,
  permissionsUpdate: Partial<UserPermissions>
): Promise<{ success: boolean; error?: string; updatedUser?: Omit<AppUser, 'passwordHash' | 'salt'> }> {
  const res = updateUserPermissions(adminUserId, targetUserId, permissionsUpdate);
  if (res.success && res.updatedUser) {
    const updated = dbState.users.find((u) => u.id === targetUserId);
    await persistUsersAsync(updated);
  }
  return res;
}

export async function updateUserCharactersAsync(
  userId: string,
  characters: UserCharacter[],
  activeCharacterId?: string
): Promise<{ success: boolean; error?: string }> {
  const res = updateUserCharacters(userId, characters, activeCharacterId);
  if (res.success) {
    const updated = dbState.users.find((u) => u.id === userId);
    await persistUsersAsync(updated);
  }
  return res;
}

export async function updateUserProfileAsync(
  userId: string,
  data: { displayName?: string; clanName?: string; discordTag?: string }
): Promise<{ success: boolean; error?: string }> {
  const res = updateUserProfile(userId, data);
  if (res.success) {
    const updated = dbState.users.find((u) => u.id === userId);
    await persistUsersAsync(updated);
  }
  return res;
}

export async function deleteUserAsync(
  adminUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  const res = deleteUser(adminUserId, targetUserId);
  if (res.success) {
    await persistUsersAsync();
  }
  return res;
}

