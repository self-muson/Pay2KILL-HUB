import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { BossServerState } from './boss-server-store';
import { AppUser } from './user-types';

const TRACKER_DOC = 'current';
const TRACKER_COLLECTION = 'tracker';
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Saves entire synchronized Boss Server State to Firestore
 */
export async function saveBossStateToFirestore(state: BossServerState): Promise<boolean> {
  try {
    const docRef = doc(db, TRACKER_COLLECTION, TRACKER_DOC);
    // Convert to JSON-safe payload without undefined values
    const safePayload = JSON.parse(JSON.stringify(state));
    await setDoc(docRef, safePayload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveBossState error:', err);
    return false;
  }
}

/**
 * Loads Boss Server State from Firestore
 */
export async function getBossStateFromFirestore(): Promise<BossServerState | null> {
  try {
    const docRef = doc(db, TRACKER_COLLECTION, TRACKER_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BossServerState;
    }
  } catch (err) {
    console.warn('Firestore getBossState error:', err);
  }
  return null;
}

/**
 * Saves or updates User in Firestore
 */
export async function saveUserToFirestore(user: AppUser): Promise<boolean> {
  try {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    const safePayload = JSON.parse(JSON.stringify(user));
    await setDoc(docRef, safePayload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore saveUser error:', err);
    return false;
  }
}

/**
 * Gets User by ID from Firestore
 */
export async function getUserFromFirestore(userId: string): Promise<AppUser | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppUser;
    }
  } catch (err) {
    console.warn('Firestore getUser error:', err);
  }
  return null;
}

/**
 * Loads all users from Firestore
 */
export async function getAllUsersFromFirestore(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, USERS_COLLECTION));
    const list: AppUser[] = [];
    snap.forEach((d) => {
      list.push(d.data() as AppUser);
    });
    return list;
  } catch (err) {
    console.warn('Firestore getAllUsers error:', err);
    return [];
  }
}

/**
 * Deletes user from Firestore
 */
export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    return true;
  } catch (err) {
    console.warn('Firestore deleteUser error:', err);
    return false;
  }
}

/**
 * Saves auth token session to Firestore
 */
export async function saveSessionToFirestore(
  token: string,
  userId: string,
  expiresAt: number
): Promise<boolean> {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, token);
    await setDoc(docRef, { token, userId, expiresAt, createdAt: Date.now() });
    return true;
  } catch (err) {
    console.warn('Firestore saveSession error:', err);
    return false;
  }
}

/**
 * Gets auth session by token from Firestore
 */
export async function getSessionFromFirestore(
  token: string
): Promise<{ userId: string; expiresAt: number } | null> {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, token);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.userId && data.expiresAt) {
        if (Date.now() > data.expiresAt) {
          void deleteDoc(docRef).catch(() => {});
          return null;
        }
        return { userId: data.userId, expiresAt: data.expiresAt };
      }
    }
  } catch (err) {
    console.warn('Firestore getSession error:', err);
  }
  return null;
}

/**
 * Deletes auth session
 */
export async function deleteSessionFromFirestore(token: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, SESSIONS_COLLECTION, token));
    return true;
  } catch (err) {
    return false;
  }
}
