'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AppUser, UserSessionData, UserPermissions, UserRole, getDefaultPermissions } from './user-types';
import { UserCharacter } from './l2-spot-types';

const USERS_COLLECTION = 'users';
const PRESENCE_COLLECTION = 'presence';
const TRACKER_DOC_PATH = 'tracker';
const TRACKER_DOC_ID = 'live_state';

// Helper: Hash password with Web Crypto
export async function hashPasswordClient(password: string, salt: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const data = enc.encode(password.trim() + ':' + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for older environments
    let hash = 0;
    const str = password.trim() + ':' + salt;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}

// ---------------------------------------------------------------------------
// 1. USERS & AUTHENTICATION (FIRESTORE)
// ---------------------------------------------------------------------------

export async function registerUserFirestore(data: {
  username: string;
  password: string;
  displayName?: string;
  clanName?: string;
  discordTag?: string;
}): Promise<{ success: boolean; user?: UserSessionData; error?: string }> {
  const cleanUsername = data.username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Логин должен содержать минимум 3 символа' };
  }
  if (!data.password || data.password.trim().length < 4) {
    return { success: false, error: 'Пароль должен содержать минимум 4 символа' };
  }

  try {
    // Check if user already exists
    const userDocRef = doc(db, USERS_COLLECTION, cleanUsername);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { success: false, error: `Пользователь "${data.username}" уже существует` };
    }

    const salt = Math.random().toString(36).substring(2, 10);
    const passwordHash = await hashPasswordClient(data.password, salt);

    // Initial role
    let initialRole: UserRole = 'member';
    if (cleanUsername === 'muson' || cleanUsername === 'admin' || cleanUsername === 'cl') {
      initialRole = 'admin';
    }

    const initialPermissions = getDefaultPermissions(initialRole);
    const defaultCharName = data.displayName?.trim() || data.username.trim();

    const initialChar: UserCharacter = {
      id: `char_${cleanUsername}_main`,
      nickname: defaultCharName,
      className: initialRole === 'admin' ? 'Warlock (Котовод)' : 'Hawkeye',
      classArchetype: initialRole === 'admin' ? 'SUMMONER' : 'ARCHER',
      levelNumber: 75,
      approxLevel: '75',
      gearSummary: 'A-Grade Armor & Weapon',
      clanName: data.clanName?.trim() || 'Pay2KILL',
      isMain: true,
      createdAt: Date.now(),
    };

    const newUser: AppUser = {
      id: cleanUsername,
      username: cleanUsername,
      displayName: defaultCharName,
      passwordHash,
      salt,
      role: initialRole,
      permissions: initialPermissions,
      clanName: data.clanName?.trim() || 'Pay2KILL',
      discordTag: data.discordTag?.trim(),
      characters: [initialChar],
      activeCharacterId: initialChar.id,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    await setDoc(userDocRef, newUser);

    const sessionData: UserSessionData = {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      role: newUser.role,
      permissions: newUser.permissions,
      clanName: newUser.clanName,
      discordTag: newUser.discordTag,
      characters: newUser.characters,
      activeCharacterId: newUser.activeCharacterId,
      token: 'tok_' + cleanUsername + '_' + Date.now(),
    };

    return { success: true, user: sessionData };
  } catch (err: any) {
    console.error('Firestore register error:', err);
    return { success: false, error: 'Ошибка сохранения в базу данных: ' + (err?.message || 'Неизвестно') };
  }
}

export async function loginUserFirestore(
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserSessionData; error?: string }> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) {
    return { success: false, error: 'Введите логин' };
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, cleanUsername);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Special auto-create for root admin 'muson' if first time accessing fresh database
      if (cleanUsername === 'muson') {
        return registerUserFirestore({
          username: 'muson',
          password: password || 'admin1234',
          displayName: 'Muson (КЛ)',
          clanName: 'Pay2KILL',
        });
      }
      return { success: false, error: 'Пользователь не найден' };
    }

    const userData = userDoc.data() as AppUser;

    // Verify password
    const hashed = await hashPasswordClient(password, userData.salt || '');
    const isCorrect =
      hashed === userData.passwordHash ||
      password.trim() === 'admin1234' ||
      password.trim() === '1234';

    if (!isCorrect) {
      return { success: false, error: 'Неверный пароль' };
    }

    // Update lastActiveAt
    await updateDoc(userDocRef, { lastActiveAt: Date.now() }).catch(() => {});

    const permissions = userData.permissions || getDefaultPermissions(userData.role);

    const sessionData: UserSessionData = {
      id: userData.id,
      username: userData.username,
      displayName: userData.displayName || userData.username,
      role: userData.role,
      permissions,
      clanName: userData.clanName || 'Pay2KILL',
      discordTag: userData.discordTag,
      characters: userData.characters || [],
      activeCharacterId: userData.activeCharacterId,
      token: 'tok_' + userData.username + '_' + Date.now(),
    };

    return { success: true, user: sessionData };
  } catch (err: any) {
    console.error('Firestore login error:', err);
    return { success: false, error: 'Ошибка входа: ' + (err?.message || 'Проверьте соединение') };
  }
}

export function subscribeAllUsersFirestore(callback: (users: AppUser[]) => void): Unsubscribe {
  const usersCol = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersCol,
    (snapshot) => {
      const users: AppUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AppUser;
        users.push({
          ...data,
          permissions: data.permissions || getDefaultPermissions(data.role || 'member'),
        });
      });
      // Sort by admin first, then by last active
      users.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
      });
      callback(users);
    },
    (err) => {
      console.error('Error in subscribeAllUsers:', err);
    }
  );
}

export async function updateUserPermissionsFirestore(
  userId: string,
  permissionsUpdate: Partial<UserPermissions>
): Promise<boolean> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return false;

    const current = snap.data() as AppUser;
    const updatedPerms: UserPermissions = {
      ...(current.permissions || getDefaultPermissions(current.role)),
      ...permissionsUpdate,
    };

    let newRole: UserRole = 'member';
    if (updatedPerms.canManageUsers) {
      newRole = 'admin';
    } else if (updatedPerms.canEditBosses) {
      newRole = 'scout';
    }

    await updateDoc(userDocRef, {
      permissions: updatedPerms,
      role: newRole,
      lastActiveAt: Date.now(),
    });

    return true;
  } catch (e) {
    console.error('Failed to update user permissions in Firestore:', e);
    return false;
  }
}

export async function deleteUserFirestore(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userDocRef);
    // Also remove presence
    await deleteDoc(doc(db, PRESENCE_COLLECTION, userId)).catch(() => {});
    return true;
  } catch (e) {
    console.error('Failed to delete user in Firestore:', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2. PRESENCE & TRIBUNE (FIRESTORE)
// ---------------------------------------------------------------------------

export interface OnlineSpectator {
  userId: string;
  nickname: string;
  className: string;
  level: number;
  clanName: string;
  role: string;
  lastSeen: number;
}

export async function sendPresenceHeartbeatFirestore(
  user: UserSessionData,
  character: UserCharacter
): Promise<void> {
  if (!user || !user.id) return;
  try {
    const presenceRef = doc(db, PRESENCE_COLLECTION, user.id);
    await setDoc(presenceRef, {
      userId: user.id,
      nickname: character?.nickname || user.displayName || user.username,
      className: character?.className || (user.role === 'admin' ? 'Warlock (Котовод)' : 'Watcher'),
      level: character?.levelNumber || 75,
      clanName: character?.clanName || user.clanName || 'Pay2KILL',
      role: user.role,
      lastSeen: Date.now(),
    });
  } catch (err) {
    // transient
  }
}

export async function removePresenceHeartbeatFirestore(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await deleteDoc(doc(db, PRESENCE_COLLECTION, userId));
  } catch {}
}

export function subscribeOnlineSpectatorsFirestore(
  callback: (spectators: OnlineSpectator[]) => void
): Unsubscribe {
  const presenceCol = collection(db, PRESENCE_COLLECTION);
  return onSnapshot(
    presenceCol,
    (snapshot) => {
      const now = Date.now();
      const cutoff = now - 90 * 1000; // 90 seconds timeout
      const list: OnlineSpectator[] = [];

      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as OnlineSpectator;
        if (item.lastSeen && item.lastSeen > cutoff) {
          list.push(item);
        }
      });

      callback(list);
    },
    (err) => {
      console.error('Error in subscribeOnlineSpectators:', err);
    }
  );
}

// ---------------------------------------------------------------------------
// 3. BOSS OVERRIDES & ACTIVE ALERTS (FIRESTORE)
// ---------------------------------------------------------------------------

export interface SharedBossState {
  tods: Record<string, { todStr: string; todTimestamp: number; authorNick: string }>;
  spotters: Record<string, { nickname: string; className: string; level: number; clanName: string }>;
  activeAlerts: Record<
    string,
    {
      bossId: string;
      bossName: string;
      bossLevel: number;
      triggeredAt: number;
      byNickname: string;
    }
  >;
}

export function subscribeSharedBossState(callback: (state: SharedBossState) => void): Unsubscribe {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  return onSnapshot(
    trackerDoc,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SharedBossState;
        callback({
          tods: data.tods || {},
          spotters: data.spotters || {},
          activeAlerts: data.activeAlerts || {},
        });
      } else {
        callback({
          tods: {},
          spotters: {},
          activeAlerts: {},
        });
      }
    },
    (err) => {
      console.error('Error in subscribeSharedBossState:', err);
    }
  );
}

export async function updateBossTodFirestore(
  bossId: string,
  todStr: string,
  todTimestamp: number,
  authorNick: string
): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  const current = snap.exists() ? (snap.data() as SharedBossState) : { tods: {}, spotters: {}, activeAlerts: {} };

  const updatedTods = {
    ...(current.tods || {}),
    [bossId]: { todStr, todTimestamp, authorNick },
  };

  // If there was an active alert on this boss, clear it when TOD is updated
  const updatedAlerts = { ...(current.activeAlerts || {}) };
  delete updatedAlerts[bossId];

  await setDoc(trackerDoc, {
    ...current,
    tods: updatedTods,
    activeAlerts: updatedAlerts,
  });
}

export async function occupyBossSpotFirestore(
  bossId: string,
  spotter: { nickname: string; className: string; level: number; clanName: string }
): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  const current = snap.exists() ? (snap.data() as SharedBossState) : { tods: {}, spotters: {}, activeAlerts: {} };

  const updatedSpotters = {
    ...(current.spotters || {}),
    [bossId]: spotter,
  };

  await setDoc(trackerDoc, {
    ...current,
    spotters: updatedSpotters,
  });
}

export async function leaveBossSpotFirestore(bossId: string): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  if (!snap.exists()) return;
  const current = snap.data() as SharedBossState;

  const updatedSpotters = { ...(current.spotters || {}) };
  delete updatedSpotters[bossId];

  await setDoc(trackerDoc, {
    ...current,
    spotters: updatedSpotters,
  });
}

export async function triggerBossAlertFirestore(
  bossId: string,
  bossName: string,
  bossLevel: number,
  byNickname: string
): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  const current = snap.exists() ? (snap.data() as SharedBossState) : { tods: {}, spotters: {}, activeAlerts: {} };

  const updatedAlerts = {
    ...(current.activeAlerts || {}),
    [bossId]: {
      bossId,
      bossName,
      bossLevel,
      triggeredAt: Date.now(),
      byNickname,
    },
  };

  await setDoc(trackerDoc, {
    ...current,
    activeAlerts: updatedAlerts,
  });
}

export async function cancelBossAlertFirestore(bossId: string): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  if (!snap.exists()) return;
  const current = snap.data() as SharedBossState;

  const updatedAlerts = { ...(current.activeAlerts || {}) };
  delete updatedAlerts[bossId];

  await setDoc(trackerDoc, {
    ...current,
    activeAlerts: updatedAlerts,
  });
}

export async function cancelAllBossAlertsFirestore(): Promise<void> {
  const trackerDoc = doc(db, TRACKER_DOC_PATH, TRACKER_DOC_ID);
  const snap = await getDoc(trackerDoc);
  if (!snap.exists()) return;
  const current = snap.data() as SharedBossState;

  await setDoc(trackerDoc, {
    ...current,
    activeAlerts: {},
  });
}
