'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  Shield,
  Users,
  Search,
  Plus,
  Crown,
  Heart,
  Sword,
  Sparkles,
  Flame,
  SlidersHorizontal,
  X,
  PawPrint,
  User,
} from 'lucide-react';
import {
  QueuePlayer,
  ActiveGroup,
  ClanInfo,
  KbTopic,
  CharterRule,
  L2_CLASSES_LIST,
  GOALS_LIST,
  INITIAL_CLANS_LIST,
} from '@/lib/types';
import { getOrCreateSessionId } from '@/lib/session';
import { Language, translations } from '@/lib/i18n';
import { AllianceHeader } from '@/components/AllianceHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { QueuePlayerCard } from '@/components/QueuePlayerCard';
import { ActiveGroupCard } from '@/components/ActiveGroupCard';
import { PlayerFormModal } from '@/components/PlayerFormModal';
import { GroupFormModal } from '@/components/GroupFormModal';
import { RaidLeaderAssignModal } from '@/components/RaidLeaderAssignModal';
import { ClanManagerModal } from '@/components/ClanManagerModal';
import { KnowledgeBaseTab } from '@/components/KnowledgeBaseTab';
import { AllianceRulesTab } from '@/components/AllianceRulesModal';
import { sounds } from '@/lib/sound-effects';
import { L2CharacterProfileModal } from '@/components/l2/L2CharacterProfileModal';
import { BossTrackerApp } from '@/components/boss-tracker/BossTrackerApp';
import { AuthModal } from '@/components/AuthModal';
import { AdminRolesModal } from '@/components/AdminRolesModal';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { useAuthStore } from '@/lib/auth-store';
import { audioManager } from '@/lib/audio-manager';

export default function LfgDashboardPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const { characters, activeCharacterId } = useL2SpotStore();
  const activeChar = characters.find((c) => c.id === activeCharacterId) || characters[0];

  // Active Application: 'boss_tracker' (Таблица боссов) vs 'lfg' (LFG Хаб)
  const [currentApp, setCurrentApp] = useState<'lfg' | 'boss_tracker'>('boss_tracker');

  // Character Profile Modal
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);

  // Global Auth & Roles Store
  const {
    user,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAdminUsersModalOpen,
    setIsAdminUsersModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    logout,
  } = useAuthStore();

  // Boss Tracker Modal Controls
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isBossAdminModalOpen, setIsBossAdminModalOpen] = useState(false);
  const [isSpawnLogsModalOpen, setIsSpawnLogsModalOpen] = useState(false);
  const [isSoundSettingsModalOpen, setIsSoundSettingsModalOpen] = useState(false);
  const [isNewBossModalOpen, setIsNewBossModalOpen] = useState(false);

  // Client Identity & Language State
  const [mySessionId, setMySessionId] = useState<string>('');
  const [lang, setLang] = useState<Language>('ru');

  // Authorization State derived from logged-in user profile
  const isAdmin = Boolean(user?.role === 'admin' || user?.permissions?.canManageUsers);

  useEffect(() => {
    setHasMounted(true);
    useL2SpotStore.getState().hydrateFromStorage();
    useBossTrackerStore.getState().hydrateFromStorage();
    void useAuthStore.getState().initializeAuth();

    const timer = setTimeout(() => {
      setMySessionId(getOrCreateSessionId());

      const savedLang = localStorage.getItem('p2k_lfg_lang') as Language;
      if (savedLang && ['ru', 'en', 'es', 'tr', 'pt'].includes(savedLang)) {
        setLang(savedLang);
      }

      const savedApp = localStorage.getItem('p2k_current_app') as 'lfg' | 'boss_tracker';
      if (savedApp === 'lfg' || savedApp === 'boss_tracker') {
        setCurrentApp(savedApp);
      }

      // Clean up legacy keys
      localStorage.removeItem('tl_alliance_pin_verified');
      localStorage.removeItem('tl_alliance_pin_version');
      localStorage.removeItem('p2k_boss_tracker_pin_v2');
      localStorage.removeItem('p2k_boss_tracker_role_v2');
      localStorage.removeItem('p2k_boss_tracker_pin_version_v2');
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSwitchApp = (newApp: 'lfg' | 'boss_tracker') => {
    setCurrentApp(newApp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2k_current_app', newApp);
    }
  };

  // Global Broadcast coordinator to sync active ready checks and immediately stop audio alerts across tabs
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('p2k_boss_tracker_alerts_v1');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data) {
        if (data.type === 'READY_CHECK_CONFIRMED') {
          audioManager.stopReadyCheckRadio();
        } else if (data.type === 'FORCE_LOGOUT_ALL') {
          useAuthStore.getState().logout();
          showToast(
            lang === 'ru'
              ? '⚠️ Сессии сброшены Администратором клана.'
              : '⚠️ Sessions cleared by Clan Admin.'
          );
        } else if (data.type === 'READY_CHECK_TRIGGERED') {
          // If the ready check was triggered for this active user character, start the radio alert
          const state = useBossTrackerStore.getState();
          const target = state.bosses.find((b) => b.id === data.bossId);
          if (target) {
            const spotter = target.assignedSpotter;
            const isMySpotter =
              spotter?.isMe ||
              (activeChar?.nickname && spotter?.nickname === activeChar.nickname);
            if (isMySpotter) {
              audioManager.startReadyCheckRadio();
            }
          }
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [activeChar]);

  // Data State
  const [queuePlayers, setQueuePlayers] = useState<QueuePlayer[]>([]);
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
  const [clans, setClans] = useState<ClanInfo[]>(INITIAL_CLANS_LIST);
  const [kbTopics, setKbTopics] = useState<KbTopic[]>([]);
  const [charterRules, setCharterRules] = useState<CharterRule[]>([]);

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'lfg' | 'kb' | 'rules'>('lfg');
  const [mobileLfgView, setMobileLfgView] = useState<'all' | 'queue' | 'groups'>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedGoal, setSelectedGoal] = useState<string>('ALL');
  const [selectedClan, setSelectedClan] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Modal Controls
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [isClanManagerOpen, setIsClanManagerOpen] = useState(false);
  const [assignModalPlayer, setAssignModalPlayer] = useState<QueuePlayer | null>(null);
  const [groupFormInitialPlayer, setGroupFormInitialPlayer] = useState<QueuePlayer | null>(null);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('p2k_lfg_lang', newLang);
    }
  };

  const t = translations[lang] || translations.ru;

  // Toast notification timer
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  // Fetch LFG Data from API
  const fetchLfgData = useCallback(async () => {
    try {
      const res = await fetch('/api/lfg');
      if (res.ok) {
        const data = await res.json();
        setQueuePlayers(data.queuePlayers || []);
        setActiveGroups(data.activeGroups || []);
        if (data.clans && Array.isArray(data.clans)) {
          setClans((prev) => (JSON.stringify(prev) === JSON.stringify(data.clans) ? prev : data.clans));
        }
        if (data.kbTopics && Array.isArray(data.kbTopics)) {
          setKbTopics((prev) => (JSON.stringify(prev) === JSON.stringify(data.kbTopics) ? prev : data.kbTopics));
        }
        if (data.charterRules && Array.isArray(data.charterRules)) {
          setCharterRules((prev) => (JSON.stringify(prev) === JSON.stringify(data.charterRules) ? prev : data.charterRules));
        }
      }
    } catch {
      // Transient network drop during polling interval
    }
  }, []);

  // Poll for Real-Time Synchronization
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchLfgData();
      }
    };

    void loadData();
    const interval = setInterval(() => {
      void fetchLfgData();
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchLfgData]);

  // Handle Player Queue Refresh
  const handleRefreshPlayer = async (id: string) => {
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh_queue',
          id,
          requesterSessionId: mySessionId,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (soundEnabled) sounds.playCopy();
        showToast(t.toastUpdated);
        fetchLfgData();
      } else {
        showToast(data.error || t.toastDeniedNotOwner);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // Handle Remove Player from Queue
  const handleRemovePlayer = async (id: string) => {
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_queue',
          id,
          requesterSessionId: mySessionId,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (soundEnabled) sounds.playRemove();
        showToast(t.toastRemoved);
        fetchLfgData();
      } else {
        showToast(data.error || t.toastDeniedNotOwner);
      }
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  // Handle Take Player to Existing Group
  const handleTakeToExistingGroup = async (groupId: string, playerId: string) => {
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'take_player',
          groupId,
          playerId,
          requesterSessionId: mySessionId,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t.toastPlayerAddedToGroup);
        fetchLfgData();
      } else {
        showToast(data.error || t.toastDeniedNotOwner);
      }
    } catch (err) {
      console.error('Take player error:', err);
    }
  };

  // Handle Return Player to Queue
  const handleReturnPlayerToQueue = async (groupId: string, playerId: string) => {
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return_player',
          groupId,
          playerId,
          requesterSessionId: mySessionId,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (soundEnabled) sounds.playRemove();
        showToast(t.toastPlayerReturned);
        fetchLfgData();
      } else {
        showToast(data.error || t.toastDeniedNotOwner);
      }
    } catch (err) {
      console.error('Return player error:', err);
    }
  };

  // Handle Disband Group
  const handleDisbandGroup = async (groupId: string) => {
    if (
      !confirm(
        lang === 'ru'
          ? 'Распустить группу? Она будет полностью удалена из списка активных.'
          : 'Disband group? It will be removed from active parties.'
      )
    ) {
      return;
    }
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disband_group',
          groupId,
          requesterSessionId: mySessionId,
          isAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (soundEnabled) sounds.playRemove();
        showToast(t.toastPartyDisbanded);
        fetchLfgData();
      } else {
        showToast(data.error || t.toastDeniedNotOwner);
      }
    } catch (err) {
      console.error('Disband error:', err);
    }
  };

  // ------------ ADMIN ACTIONS ------------

  // Add Clan
  const handleAddClan = async (name: string) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_clan', name }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to add clan');
    }
    showToast(`Клан "${name}" успешно добавлен в список альянса!`);
    fetchLfgData();
  };

  // Delete Clan
  const handleDeleteClan = async (id: string) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_clan', id }),
    });
    if (res.ok) {
      showToast('Клан удален из списка альянса.');
      fetchLfgData();
    }
  };

  // KB Topics Admin Actions
  const handleUpdateKbTopic = async (id: string, title: string, subtitle: string, content: string) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_kb', id, title, subtitle, content }),
    });
    if (res.ok) {
      showToast('Топик Базы Знаний обновлен!');
      fetchLfgData();
    }
  };

  const handleAddKbTopic = async (
    title: string,
    subtitle: string,
    category: 'party_comp' | 'epics' | 'aoe_spots' | 'pl_commands',
    content: string
  ) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_kb', title, subtitle, category, content }),
    });
    if (res.ok) {
      showToast('Новый топик добавлен в Базу Знаний!');
      fetchLfgData();
    }
  };

  const handleDeleteKbTopic = async (id: string) => {
    if (!confirm('Удалить этот топик из Базы Знаний?')) return;
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_kb', id }),
    });
    if (res.ok) {
      showToast('Топик удален.');
      fetchLfgData();
    }
  };

  // Charter Rules Admin Actions
  const handleUpdateCharterRule = async (id: string, title: string, desc: string) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_rule', id, title, desc }),
    });
    if (res.ok) {
      showToast('Правило Устава обновлено!');
      fetchLfgData();
    }
  };

  const handleAddCharterRule = async (title: string, desc: string) => {
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_rule', title, desc }),
    });
    if (res.ok) {
      showToast('Новое правило добавлено в Устав!');
      fetchLfgData();
    }
  };

  const handleDeleteCharterRule = async (id: string) => {
    if (!confirm('Удалить это правило из Устава?')) return;
    const res = await fetch('/api/lfg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_rule', id }),
    });
    if (res.ok) {
      showToast('Правило удалено.');
      fetchLfgData();
    }
  };

  // Manual Safe Refresh
  const handleManualRefresh = async () => {
    if (soundEnabled) sounds.playCopy();
    showToast(lang === 'ru' ? 'Списки обновлены' : 'Lists refreshed');
    await fetchLfgData();
  };

  // Reset Demo Data (Admin Only)
  const handleResetDemo = async () => {
    if (!isAdmin) {
      showToast('Доступ запрещён: требуется режим Администратора');
      return;
    }
    if (
      !confirm(
        lang === 'ru'
          ? 'Внимание: Вы уверены, что хотите полностью очистить списки очереди и групп?'
          : 'Warning: Are you sure you want to clear all queue and active groups?'
      )
    )
      return;
    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_demo', isAdmin }),
      });
      if (res.ok) {
        showToast(lang === 'ru' ? 'База данных очищена Администратором.' : 'Database cleared by Admin.');
        fetchLfgData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Ошибка сброса');
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  // User Logout
  const handleLogout = () => {
    logout();
    showToast(lang === 'ru' ? 'Вы вышли из учетной записи' : 'Logged out');
  };

  // Filtered Queue Players
  const filteredQueue = queuePlayers.filter((p) => {
    if (
      searchQuery &&
      !p.nickname.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.clan.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (selectedRole !== 'ALL') {
      if (selectedRole === 'Summoner') {
        const isSummoner =
          p.role === 'Summoner' ||
          p.l2Class === 'Warlock' ||
          p.l2Class === 'ElementalSummoner' ||
          p.l2Class === 'PhantomSummoner';
        if (!isSummoner) return false;
      } else if (p.role !== selectedRole) {
        return false;
      }
    }
    if (selectedGoal !== 'ALL' && p.goal !== selectedGoal) return false;
    if (selectedClan !== 'ALL' && p.clan !== selectedClan) return false;
    if (selectedClass !== 'ALL' && p.l2Class !== selectedClass) return false;

    return true;
  });

  // Role Counts
  const tankCount = queuePlayers.filter((p) => p.role === 'Tank').length;
  const healCount = queuePlayers.filter((p) => p.role === 'Heal').length;
  const bufferCount = queuePlayers.filter((p) => p.role === 'Buffer').length;
  const ddCount = queuePlayers.filter((p) => p.role === 'DD').length;
  const summonerCount = queuePlayers.filter(
    (p) =>
      p.role === 'Summoner' ||
      p.l2Class === 'Warlock' ||
      p.l2Class === 'ElementalSummoner' ||
      p.l2Class === 'PhantomSummoner'
  ).length;

  const activeSecondaryFilterCount =
    (selectedClass !== 'ALL' ? 1 : 0) +
    (selectedGoal !== 'ALL' ? 1 : 0) +
    (selectedClan !== 'ALL' ? 1 : 0);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2a1d15] border border-[#c2a363]/60 flex items-center justify-center text-[#e2c784] shadow-md animate-pulse">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-amber-200/80 font-serif font-bold text-sm tracking-wider">
            Pay2KILL Alliance Hub
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col font-sans selection:bg-[#c2a363] selection:text-slate-950">
      {/* Header */}
      <AllianceHeader
        lang={lang}
        setLang={handleSetLang}
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentApp={currentApp}
        onSwitchApp={handleSwitchApp}
        onOpenPlayerForm={() => setIsPlayerFormOpen(true)}
        onOpenGroupForm={() => {
          setGroupFormInitialPlayer(null);
          setIsGroupFormOpen(true);
        }}
        onOpenClanManager={() => setIsClanManagerOpen(true)}
        onOpenCharacterProfile={() => setIsCharModalOpen(true)}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onLockPin={handleLogout}
        onResetDemo={handleResetDemo}
        onRefreshData={handleManualRefresh}
        activeQueueCount={queuePlayers.length}
        activeGroupsCount={activeGroups.length}

        // Pass Boss Tracker modal trigger handlers
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        onOpenLogsModal={() => setIsSpawnLogsModalOpen(true)}
        onOpenSoundSettingsModal={() => setIsSoundSettingsModalOpen(true)}
        onOpenBossAdminModal={() => setIsBossAdminModalOpen(true)}
        onOpenNewBossModal={() => setIsNewBossModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 px-4 py-3 bg-[#182030] border border-[#c2a363] text-amber-200 text-xs font-semibold rounded-lg shadow-2xl flex items-center gap-2.5 animate-bounce max-w-sm sm:max-w-md mx-auto sm:mx-0">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container with extra bottom padding on mobile for MobileBottomNav */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 py-3 sm:py-6 pb-28 md:pb-8">
        {currentApp === 'boss_tracker' ? (
          <BossTrackerApp
            onSwitchToLfg={() => handleSwitchApp('lfg')}
            isAccountsModalOpen={isAccountsModalOpen}
            setIsAccountsModalOpen={setIsAccountsModalOpen}
            isBossAdminModalOpen={isBossAdminModalOpen}
            setIsBossAdminModalOpen={setIsBossAdminModalOpen}
            isSpawnLogsModalOpen={isSpawnLogsModalOpen}
            setIsSpawnLogsModalOpen={setIsSpawnLogsModalOpen}
            isSoundSettingsModalOpen={isSoundSettingsModalOpen}
            setIsSoundSettingsModalOpen={setIsSoundSettingsModalOpen}
            isNewBossModalOpen={isNewBossModalOpen}
            setIsNewBossModalOpen={setIsNewBossModalOpen}
          />
        ) : (
          <>
            {activeTab === 'kb' && (
              <KnowledgeBaseTab
                lang={lang}
                isAdmin={isAdmin}
                kbTopics={kbTopics}
                onUpdateTopic={handleUpdateKbTopic}
                onAddTopic={handleAddKbTopic}
                onDeleteTopic={handleDeleteKbTopic}
              />
            )}
            {activeTab === 'rules' && (
              <AllianceRulesTab
                lang={lang}
                isAdmin={isAdmin}
                charterRules={charterRules}
                onUpdateRule={handleUpdateCharterRule}
                onAddRule={handleAddCharterRule}
                onDeleteRule={handleDeleteCharterRule}
              />
            )}

            {activeTab === 'lfg' && (
              <div className="space-y-3 sm:space-y-6">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t.statsSearching}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-amber-300">
                    {queuePlayers.length}
                  </div>
                </div>
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400/80" />
              </div>

              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-blue-900/40 bg-blue-950/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {t.statsTanks}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-blue-300">
                    {tankCount}
                  </div>
                </div>
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>

              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-emerald-900/40 bg-emerald-950/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {t.statsHealers}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-emerald-300">
                    {healCount}
                  </div>
                </div>
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>

              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-purple-900/40 bg-purple-950/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    {t.statsBuffers}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-purple-300">
                    {bufferCount}
                  </div>
                </div>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>

              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-red-900/40 bg-red-950/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    {t.statsDds}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-red-300">
                    {ddCount}
                  </div>
                </div>
                <Sword className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>

              <div className="p-2.5 sm:p-3.5 card-fantasy rounded-xl border border-amber-900/40 bg-amber-950/20 col-span-2 sm:col-span-1 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {t.roleSummoner || 'САММОНЕРЫ'}
                  </div>
                  <div className="text-base sm:text-xl font-bold font-mono text-amber-300">
                    {summonerCount}
                  </div>
                </div>
                <PawPrint className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="card-fantasy rounded-xl p-3 sm:p-4 border border-[#c2a363]/20 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[170px] sm:min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-8 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-base sm:text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mobile Secondary Filters Toggle Button */}
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="sm:hidden px-3.5 py-2 rounded-lg bg-[#0a0d14] border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 min-h-[44px] shrink-0 active:scale-95 transition-transform"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Фильтры</span>
                  {activeSecondaryFilterCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                      {activeSecondaryFilterCount}
                    </span>
                  )}
                </button>

                {/* Role Filter Buttons (Horizontal swipe on mobile) */}
                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar py-0.5 flex items-center gap-1 bg-[#0a0d14] p-1 rounded-lg border border-slate-800 text-xs flex-nowrap sm:flex-wrap">
                  <button
                    onClick={() => setSelectedRole('ALL')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'ALL'
                        ? 'bg-slate-800 text-slate-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.filterAllRoles}
                  </button>
                  <button
                    onClick={() => setSelectedRole('Tank')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'Tank'
                        ? 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
                        : 'text-slate-400 hover:text-blue-400'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.statsTanks}</span>
                  </button>
                  <button
                    onClick={() => setSelectedRole('Heal')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'Heal'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.statsHealers}</span>
                  </button>
                  <button
                    onClick={() => setSelectedRole('Buffer')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'Buffer'
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-500/50'
                        : 'text-slate-400 hover:text-purple-400'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.statsBuffers}</span>
                  </button>
                  <button
                    onClick={() => setSelectedRole('DD')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'DD'
                        ? 'bg-red-900/60 text-red-300 border border-red-500/50'
                        : 'text-slate-400 hover:text-red-400'
                    }`}
                  >
                    <Sword className="w-3.5 h-3.5 text-red-400" />
                    <span>{t.statsDds}</span>
                  </button>
                  <button
                    onClick={() => setSelectedRole('Summoner')}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                      selectedRole === 'Summoner'
                        ? 'bg-amber-900/70 text-amber-200 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <PawPrint className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.roleSummoner || 'Саммонеры'}</span>
                  </button>
                </div>
              </div>

              {/* Secondary Select Dropdowns (Collapsible on mobile, always visible on tablet/desktop) */}
              <div
                className={`${
                  showMobileFilters ? 'block' : 'hidden sm:block'
                } pt-2 border-t border-slate-800/80 text-xs`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* L2 Class Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                    <span className="text-slate-400 font-medium shrink-0">{t.fieldClass}:</span>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                    >
                      <option value="ALL">{t.filterAllClasses}</option>
                      {L2_CLASSES_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn} ({c.shortCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Goal Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                    <span className="text-slate-400 font-medium shrink-0">{t.fieldGoal}:</span>
                    <select
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                    >
                      <option value="ALL">{t.filterAllGoals}</option>
                      {GOALS_LIST.map((g) => (
                        <option key={g.id} value={g.id}>
                          {(t[g.key as keyof typeof t] as string) || g.id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clan Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                    <span className="text-slate-400 font-medium shrink-0">{t.fieldClan}:</span>
                    <select
                      value={selectedClan}
                      onChange={(e) => setSelectedClan(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded-lg px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                    >
                      <option value="ALL">{t.filterAllClans}</option>
                      {clans.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Filters */}
                {(selectedRole !== 'ALL' ||
                  selectedGoal !== 'ALL' ||
                  selectedClan !== 'ALL' ||
                  selectedClass !== 'ALL' ||
                  searchQuery) && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedRole('ALL');
                        setSelectedGoal('ALL');
                        setSelectedClan('ALL');
                        setSelectedClass('ALL');
                        setSearchQuery('');
                      }}
                      className="text-amber-400 hover:underline font-medium text-xs py-1 min-h-[36px] flex items-center"
                    >
                      {t.resetFilters}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Section View Switcher (lg:hidden) */}
            <div className="lg:hidden flex items-center p-1 bg-[#121620] rounded-xl border border-slate-800 text-xs shadow-md">
              <button
                onClick={() => setMobileLfgView('queue')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                  mobileLfgView === 'queue'
                    ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Очередь ({filteredQueue.length})</span>
              </button>
              <button
                onClick={() => setMobileLfgView('groups')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1.5 min-h-[42px] ${
                  mobileLfgView === 'groups'
                    ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Crown className="w-4 h-4" />
                <span>Пати ({activeGroups.length})</span>
              </button>
              <button
                onClick={() => setMobileLfgView('all')}
                className={`px-3 py-2.5 rounded-lg font-semibold text-center transition-all min-h-[42px] ${
                  mobileLfgView === 'all'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Все
              </button>
            </div>

            {/* Dashboard Layout: 2 Columns on desktop, Adaptive on Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
              {/* BLOCK 1: Очередь ожидания (Waiting Queue) */}
              <div
                className={`space-y-3 sm:space-y-4 ${
                  mobileLfgView === 'groups' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <h2 className="text-base sm:text-lg font-bold font-cinzel text-slate-100 gold-gradient-text">
                      {t.queueTitle} ({filteredQueue.length})
                    </h2>
                  </div>

                  <button
                    onClick={() => setIsPlayerFormOpen(true)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#aa8222] to-[#8c7241] text-slate-950 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 shadow min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.btnJoinQueueShort}</span>
                  </button>
                </div>

                {filteredQueue.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center card-fantasy rounded-xl border border-slate-800 space-y-3">
                    <Users className="w-9 h-9 sm:w-10 sm:h-10 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">
                      {t.emptyQueueTitle}
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t.emptyQueueDesc}
                    </p>
                    <button
                      onClick={() => setIsPlayerFormOpen(true)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-950 text-amber-200 border border-amber-500/30 hover:bg-amber-900/50 transition-colors inline-block mt-2 min-h-[40px]"
                    >
                      {t.btnJoinQueueShort}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQueue.map((player) => (
                      <QueuePlayerCard
                        key={player.id}
                        player={player}
                        mySessionId={mySessionId}
                        isAdmin={isAdmin}
                        lang={lang}
                        onTakeToGroup={(p) => setAssignModalPlayer(p)}
                        onRefresh={handleRefreshPlayer}
                        onRemove={handleRemovePlayer}
                        soundEnabled={soundEnabled}
                        onShowToast={showToast}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* BLOCK 2: Активные группы (Formed 9-man Parties) */}
              <div
                className={`space-y-3 sm:space-y-4 ${
                  mobileLfgView === 'queue' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h2 className="text-base sm:text-lg font-bold font-cinzel text-slate-100 gold-gradient-text">
                      {t.activeGroupsTitle} ({activeGroups.length})
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setGroupFormInitialPlayer(null);
                      setIsGroupFormOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1a2030] border border-[#c2a363]/40 text-amber-200 hover:border-[#c2a363] hover:bg-[#222a3f] transition-all flex items-center gap-1 shadow min-h-[36px]"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.btnCreateParty}</span>
                  </button>
                </div>

                {activeGroups.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center card-fantasy rounded-xl border border-slate-800 space-y-3">
                    <Crown className="w-9 h-9 sm:w-10 sm:h-10 text-slate-600 mx-auto" />
                    <div className="text-sm font-semibold text-slate-300">
                      {t.emptyGroupsTitle}
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t.emptyGroupsDesc}
                    </p>
                    <button
                      onClick={() => {
                        setGroupFormInitialPlayer(null);
                        setIsGroupFormOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1a2030] text-amber-300 border border-[#c2a363]/50 hover:bg-[#232b40] transition-colors inline-block mt-2 min-h-[40px]"
                    >
                      {t.btnCreateParty}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {activeGroups.map((group) => (
                      <ActiveGroupCard
                        key={group.id}
                        group={group}
                        mySessionId={mySessionId}
                        isAdmin={isAdmin}
                        lang={lang}
                        onReturnPlayer={handleReturnPlayerToQueue}
                        onDisbandGroup={handleDisbandGroup}
                        onAddPlayerFromQueue={() => {
                          if (queuePlayers.length > 0) {
                            setAssignModalPlayer(queuePlayers[0]);
                          } else {
                            showToast(t.emptyQueueTitle);
                          }
                        }}
                        soundEnabled={soundEnabled}
                        onShowToast={showToast}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentApp={currentApp}
        onSwitchApp={handleSwitchApp}
        activeQueueCount={queuePlayers.length}
        activeGroupsCount={activeGroups.length}
        onOpenPlayerForm={() => setIsPlayerFormOpen(true)}
        onOpenGroupForm={() => {
          setGroupFormInitialPlayer(null);
          setIsGroupFormOpen(true);
        }}
        lang={lang}
      />

      {/* Modals */}
      <PlayerFormModal
        isOpen={isPlayerFormOpen}
        onClose={() => setIsPlayerFormOpen(false)}
        onSubmitSuccess={() => {
          showToast(t.toastJoined);
          fetchLfgData();
        }}
        mySessionId={mySessionId}
        lang={lang}
        clans={clans}
        soundEnabled={soundEnabled}
        onOpenCharacterProfile={() => setIsCharModalOpen(true)}
      />

      <GroupFormModal
        isOpen={isGroupFormOpen}
        onClose={() => {
          setIsGroupFormOpen(false);
          setGroupFormInitialPlayer(null);
        }}
        onSubmitSuccess={() => {
          showToast(t.toastPartyCreated);
          fetchLfgData();
        }}
        mySessionId={mySessionId}
        lang={lang}
        clans={clans}
        soundEnabled={soundEnabled}
        initialPlayer={groupFormInitialPlayer}
        initialMemberId={groupFormInitialPlayer?.id}
        initialPlayerNick={groupFormInitialPlayer?.nickname}
      />

      <ClanManagerModal
        isOpen={isClanManagerOpen}
        clans={clans}
        lang={lang}
        onClose={() => setIsClanManagerOpen(false)}
        onAddClan={handleAddClan}
        onDeleteClan={handleDeleteClan}
      />

      <RaidLeaderAssignModal
        isOpen={Boolean(assignModalPlayer)}
        onClose={() => setAssignModalPlayer(null)}
        player={assignModalPlayer}
        activeGroups={activeGroups}
        mySessionId={mySessionId}
        lang={lang}
        onTakeToExistingGroup={handleTakeToExistingGroup}
        onCreateNewGroupForPlayer={(player) => {
          setGroupFormInitialPlayer(player);
          setIsGroupFormOpen(true);
        }}
        soundEnabled={soundEnabled}
      />

      {/* Personal Character Vault (Личный Кабинет) Modal */}
      {(isCharModalOpen || isProfileModalOpen) && (
        <L2CharacterProfileModal
          onClose={() => {
            setIsCharModalOpen(false);
            setIsProfileModalOpen(false);
          }}
        />
      )}

      {/* User Auth Modal (Login / Register / PIN) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={showToast}
      />

      {/* Admin Roles & Users Management Modal (CL) */}
      <AdminRolesModal
        isOpen={isAdminUsersModalOpen}
        onClose={() => setIsAdminUsersModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Footer */}
      <footer className="border-t border-[#c2a363]/20 bg-[#07090c] py-6 text-center text-xs text-slate-500 mt-12 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500/70" />
            <span className="font-cinzel text-slate-400">
              Pay2KILL Hub — Lineage 2 Alliance LFG
            </span>
          </div>
          <div>
            {lang === 'ru'
              ? 'Синхронизация в реальном времени · Единая авторизация'
              : 'Real-time sync · Unified Auth'}
          </div>
        </div>
      </footer>
    </div>
  );
}
