'use client';

import { create } from 'zustand';
import { UserSessionData, UserRole } from './user-store';
import { UserCharacter } from './l2-spot-types';
import { TIMEZONE_OPTIONS, DEFAULT_TIMEZONE_ID, getTimezoneOption } from './timezone-manager';
import { useBossTrackerStore } from './boss-tracker-store';
import { useL2SpotStore } from './l2-spot-store';

const TOKEN_KEY = 'tl_p2k_auth_token_v1';
const TIMEZONE_KEY = 'p2k_user_timezone_v1';

interface AuthState {
  user: UserSessionData | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Timezone
  timezoneId: string;
  timezoneOffset: number;
  setTimezone: (tzId: string) => void;

  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAdminUsersModalOpen: boolean;
  setIsAdminUsersModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // Admin users list
  allUsers: Array<{
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    clanName: string;
    discordTag?: string;
    characters: UserCharacter[];
    activeCharacterId?: string;
    createdAt: number;
    lastActiveAt: number;
  }>;

  // Actions
  initializeAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    username: string;
    password: string;
    displayName?: string;
    clanName?: string;
    discordTag?: string;
    inviteCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  saveCharacters: (characters: UserCharacter[], activeId?: string) => Promise<boolean>;
  loadAllUsers: () => Promise<void>;
  changeUserRole: (targetUserId: string, newRole: UserRole) => Promise<boolean>;
  removeUser: (targetUserId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  return {
    user: null,
    token: null,
    isLoading: false,
    isInitialized: false,
    allUsers: [],

    timezoneId: DEFAULT_TIMEZONE_ID,
    timezoneOffset: 180,

    isAuthModalOpen: false,
    setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
    isAdminUsersModalOpen: false,
    setIsAdminUsersModalOpen: (open) => set({ isAdminUsersModalOpen: open }),
    isProfileModalOpen: false,
    setIsProfileModalOpen: (open) => set({ isProfileModalOpen: open }),

    setTimezone: (tzId: string) => {
      const opt = getTimezoneOption(tzId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TIMEZONE_KEY, tzId);
      }
      set({ timezoneId: opt.id, timezoneOffset: opt.offsetMinutes });
    },

    initializeAuth: async () => {
      if (typeof window === 'undefined') return;

      // Load saved timezone
      const savedTz = localStorage.getItem(TIMEZONE_KEY) || DEFAULT_TIMEZONE_ID;
      const opt = getTimezoneOption(savedTz);
      set({ timezoneId: opt.id, timezoneOffset: opt.offsetMinutes });

      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        set({ isInitialized: true });
        return;
      }

      set({ isLoading: true });
      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user, token: storedToken });
            // Sync with boss tracker role
            const roleStr = data.user.role;
            useBossTrackerStore.getState().setSessionFromPin({
              role: roleStr,
              isAdmin: roleStr === 'admin',
              isScout: roleStr === 'scout',
            });
            // Sync characters to l2-spot-store if user has characters
            if (data.user.characters && data.user.characters.length > 0) {
              useL2SpotStore.setState({
                characters: data.user.characters,
                activeCharacterId: data.user.activeCharacterId || data.user.characters[0].id,
              });
            }
          } else {
            localStorage.removeItem(TOKEN_KEY);
            set({ user: null, token: null });
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null });
        }
      } catch (e) {
        console.error('Failed to initialize auth', e);
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    },

    login: async (username, password) => {
      set({ isLoading: true });
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', username, password }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, data.user.token);
          }
          set({ user: data.user, token: data.user.token, isAuthModalOpen: false });

          // Sync roles across stores
          useBossTrackerStore.getState().setSessionFromPin({
            role: data.user.role,
            isAdmin: data.user.role === 'admin',
            isScout: data.user.role === 'scout',
          });

          // Sync characters
          if (data.user.characters && data.user.characters.length > 0) {
            useL2SpotStore.setState({
              characters: data.user.characters,
              activeCharacterId: data.user.activeCharacterId || data.user.characters[0].id,
            });
          }

          // Trigger immediate heartbeat so user appears on spectator tribune
          const mainChar =
            (data.user.characters || []).find((c: UserCharacter) => c.id === data.user.activeCharacterId) ||
            data.user.characters?.[0] || {
              nickname: data.user.displayName || data.user.username,
              className: data.user.role === 'admin' ? 'Warlock' : 'Silver Ranger',
              level: 75,
              clanName: data.user.clanName || 'Pay2KILL',
            };

          void useBossTrackerStore.getState().syncUserCharacterToSpectator({
            nickname: mainChar.nickname,
            className: mainChar.className,
            level: mainChar.levelNumber || 75,
            clanName: mainChar.clanName || data.user.clanName || 'Pay2KILL',
          });

          return { success: true };
        }
        return { success: false, error: data.error || 'Ошибка входа' };
      } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером' };
      } finally {
        set({ isLoading: false });
      }
    },

    register: async (data) => {
      set({ isLoading: true });
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', ...data }),
        });
        const resData = await res.json();
        if (res.ok && resData.success && resData.user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, resData.user.token);
          }
          set({ user: resData.user, token: resData.user.token, isAuthModalOpen: false });

          // Sync role across application
          useBossTrackerStore.getState().setSessionFromPin({
            role: resData.user.role,
            isAdmin: resData.user.role === 'admin',
            isScout: resData.user.role === 'scout',
          });

          if (resData.user.characters && resData.user.characters.length > 0) {
            useL2SpotStore.setState({
              characters: resData.user.characters,
              activeCharacterId: resData.user.activeCharacterId || resData.user.characters[0].id,
            });
          }

          // Trigger immediate heartbeat so user appears on spectator tribune
          const mainChar = resData.user.characters[0];
          void useBossTrackerStore.getState().syncUserCharacterToSpectator({
            nickname: mainChar.nickname,
            className: mainChar.className,
            level: mainChar.levelNumber || 75,
            clanName: mainChar.clanName || resData.user.clanName || 'Pay2KILL',
          });

          return { success: true };
        }
        return { success: false, error: resData.error || 'Ошибка регистрации' };
      } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером' };
      } finally {
        set({ isLoading: false });
      }
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
      set({ user: null, token: null });
      useBossTrackerStore.getState().logoutPin();
    },

    refreshProfile: async () => {
      const token = get().token;
      if (!token) return;
      try {
        const res = await fetch('/api/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            set({ user: data.user });
            useBossTrackerStore.getState().setSessionFromPin({
              role: data.user.role,
              isAdmin: data.user.role === 'admin',
              isScout: data.user.role === 'scout',
            });
          }
        }
      } catch (e) {}
    },

    saveCharacters: async (characters, activeId) => {
      const token = get().token;
      if (!token) {
        // Fallback to local storage if guest
        useL2SpotStore.setState({
          characters,
          activeCharacterId: activeId || characters[0]?.id,
        });
        return true;
      }

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_characters',
            token,
            characters,
            activeCharacterId: activeId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.user) {
          set({ user: data.user });
          useL2SpotStore.setState({
            characters: data.user.characters,
            activeCharacterId: data.user.activeCharacterId || data.user.characters[0]?.id,
          });

          // Sync active character to spectator tribune
          const activeChar =
            data.user.characters.find((c: UserCharacter) => c.id === data.user.activeCharacterId) ||
            data.user.characters[0];
          if (activeChar) {
            void useBossTrackerStore.getState().syncUserCharacterToSpectator({
              nickname: activeChar.nickname,
              className: activeChar.className,
              level: activeChar.levelNumber || 75,
              clanName: activeChar.clanName || data.user.clanName || 'Pay2KILL',
            });
          }
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    loadAllUsers: async () => {
      const token = get().token;
      if (!token) return;
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_all_users', token }),
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.users)) {
          set({ allUsers: data.users });
        }
      } catch (e) {
        console.error('Failed to load users list', e);
      }
    },

    changeUserRole: async (targetUserId, newRole) => {
      const token = get().token;
      if (!token) return false;
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_user_role',
            token,
            targetUserId,
            newRole,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          set({ allUsers: data.users });
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    removeUser: async (targetUserId) => {
      const token = get().token;
      if (!token) return false;
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_user',
            token,
            targetUserId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          set({ allUsers: data.users });
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },
  };
});
