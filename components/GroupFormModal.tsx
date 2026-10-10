'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Crown, Users } from 'lucide-react';
import { Goal, L2ClassId, L2_CLASSES_LIST, GOALS_LIST, ClanInfo, INITIAL_CLANS_LIST, QueuePlayer } from '@/lib/types';
import { sounds } from '@/lib/sound-effects';
import { Language, translations } from '@/lib/i18n';

interface GroupFormModalProps {
  isOpen: boolean;
  mySessionId: string;
  lang: Language;
  clans?: ClanInfo[];
  onClose: () => void;
  onSubmitSuccess: () => void;
  soundEnabled: boolean;
  initialPlayer?: QueuePlayer | null;
  initialMemberId?: string;
  initialPlayerNick?: string;
}

export function GroupFormModal({
  isOpen,
  mySessionId,
  lang,
  clans = INITIAL_CLANS_LIST,
  onClose,
  onSubmitSuccess,
  soundEnabled,
  initialPlayer,
  initialMemberId,
  initialPlayerNick,
}: GroupFormModalProps) {
  const t = translations[lang];

  const [rlNickname, setRlNickname] = useState('');
  const [rlClan, setRlClan] = useState('Pay2KILL');
  const [rlClass, setRlClass] = useState<L2ClassId>('Warcryer');
  const [rlLevel, setRlLevel] = useState<number>(75);
  const [titleInput, setTitleInput] = useState('');
  const [goal, setGoal] = useState<Goal>('Raid');
  const [maxMembers, setMaxMembers] = useState(9);
  const [discordVoice, setDiscordVoice] = useState('Channel #PACK-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wasOpenRef = useRef(false);
  const lastInitialPlayerIdRef = useRef<string | undefined>(undefined);
  const clansRef = useRef(clans);
  const initialPlayerRef = useRef(initialPlayer);

  useEffect(() => {
    clansRef.current = clans;
  }, [clans]);

  useEffect(() => {
    initialPlayerRef.current = initialPlayer;
  }, [initialPlayer]);

  // Sync state ONLY when opening with an initial player or standalone
  // Never resets while the modal is already open and the user is typing
  useEffect(() => {
    if (isOpen) {
      const isNewOpen = !wasOpenRef.current;
      const isDifferentPlayer = initialPlayer?.id !== lastInitialPlayerIdRef.current;

      if (isNewOpen || isDifferentPlayer) {
        wasOpenRef.current = true;
        lastInitialPlayerIdRef.current = initialPlayer?.id;

        const timer = setTimeout(() => {
          const currentPlayer = initialPlayerRef.current;
          const currentClans = clansRef.current;

          if (currentPlayer) {
            setRlNickname(currentPlayer.nickname || '');
            setRlClan(currentPlayer.clan || (currentClans[0]?.name || 'Pay2KILL'));
            setRlClass(currentPlayer.l2Class || 'Warcryer');
            setRlLevel(Math.min(Math.max(Number(currentPlayer.level) || 75, 1), 75));
            setGoal(currentPlayer.goal || 'Raid');
            setTitleInput(`Party PL ${currentPlayer.nickname}`);
          } else if (initialPlayerNick) {
            setRlNickname(initialPlayerNick);
            setRlClan(typeof window !== 'undefined' ? localStorage.getItem('tl_lfg_last_clan') || (currentClans[0]?.name || 'Pay2KILL') : (currentClans[0]?.name || 'Pay2KILL'));
            setRlClass(typeof window !== 'undefined' ? (localStorage.getItem('tl_lfg_last_rl_class') as L2ClassId) || 'Warcryer' : 'Warcryer');
            setRlLevel(75);
            setTitleInput(`Party PL ${initialPlayerNick}`);
            setGoal('Raid');
          } else {
            const savedNick = typeof window !== 'undefined' ? localStorage.getItem('tl_lfg_last_rl_nick') || '' : '';
            const savedClass = typeof window !== 'undefined' ? (localStorage.getItem('tl_lfg_last_rl_class') as L2ClassId) || 'Warcryer' : 'Warcryer';
            const savedClan = typeof window !== 'undefined' ? localStorage.getItem('tl_lfg_last_clan') || (currentClans[0]?.name || 'Pay2KILL') : (currentClans[0]?.name || 'Pay2KILL');

            setRlNickname(savedNick);
            setRlClan(savedClan);
            setRlClass(savedClass);
            setRlLevel(75);
            setTitleInput('');
            setGoal('Raid');
          }
          setError('');
        }, 0);

        return () => clearTimeout(timer);
      }
    } else {
      wasOpenRef.current = false;
      lastInitialPlayerIdRef.current = undefined;
    }
  }, [isOpen, initialPlayer?.id, initialPlayerNick]);

  const effectiveLeaderNick = rlNickname || initialPlayer?.nickname || initialPlayerNick || '';
  const displayTitle = titleInput || (effectiveLeaderNick ? `Party PL ${effectiveLeaderNick}` : '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rlNickname.trim()) {
      setError('Please specify PL nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('tl_lfg_last_rl_nick', rlNickname.trim());
      localStorage.setItem('tl_lfg_last_rl_class', rlClass);

      const safeLevel = Math.min(Math.max(Number(rlLevel) || 75, 1), 75);

      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_group',
          ownerId: mySessionId,
          requestorId: mySessionId,
          rlNickname: rlNickname.trim(),
          rlClan,
          rlClass,
          rlLevel: safeLevel,
          title: displayTitle.trim() || `Party PL ${rlNickname.trim()}`,
          goal,
          maxMembers,
          discordVoice,
          initialMemberId: initialPlayer ? initialPlayer.id : initialMemberId,
          queuePlayerToLeaderId: initialPlayer ? initialPlayer.id : undefined,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        if (soundEnabled) sounds.playTakePlayer();
        onSubmitSuccess();
        onClose();
      }
    } catch {
      setError('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-lg card-fantasy rounded-t-2xl sm:rounded-xl border border-[#c2a363]/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden safe-area-bottom">
        {/* Mobile handle indicator */}
        <div className="w-10 h-1.5 bg-slate-600/80 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#c2a363]/25 bg-gradient-to-r from-[#161b26] to-[#121620] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#2a2215] border border-[#c2a363]/50 flex items-center justify-center text-amber-300 shrink-0">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cinzel text-slate-100">
                {initialPlayer
                  ? (lang === 'ru' ? `Собрать Пати с лидером ${initialPlayer.nickname}` : `Form Party with Leader ${initialPlayer.nickname}`)
                  : t.modalGroupTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Lineage 2 — 9-man Party (PL)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Informational banner when converting a queue player to Leader */}
          {initialPlayer && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center gap-2.5 text-xs text-amber-200">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {lang === 'ru' ? (
                  <>
                    Персонаж <strong className="text-amber-100">{initialPlayer.nickname}</strong> будет назначен Лидером группы (ПЛ) и автоматически перенесён из очереди ожидания.
                  </>
                ) : (
                  <>
                    Character <strong className="text-amber-100">{initialPlayer.nickname}</strong> will be assigned as Party Leader (PL) and moved from the queue.
                  </>
                )}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.fieldPlNick} <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={rlNickname}
                onChange={(e) => setRlNickname(e.target.value)}
                placeholder="PL Nickname"
                className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.fieldClan}
              </label>
              <select
                value={rlClan}
                onChange={(e) => setRlClan(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
              >
                {clans.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PL Class and Level Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.fieldPlClass}</span>
              </label>
              <select
                value={rlClass}
                onChange={(e) => setRlClass(e.target.value as L2ClassId)}
                className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-amber-500/40 rounded-lg text-base sm:text-sm text-amber-200 font-medium focus:outline-none focus:border-[#c2a363] min-h-[44px]"
              >
                {L2_CLASSES_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.shortCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5">
                {t.fieldPlLevel} (макс. 75)
              </label>
              <input
                type="number"
                min={1}
                max={75}
                value={rlLevel}
                onChange={(e) => setRlLevel(Math.min(Number(e.target.value) || 1, 75))}
                className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-amber-500/40 rounded-lg text-base sm:text-sm text-amber-200 font-mono focus:outline-none focus:border-[#c2a363] min-h-[44px]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              {t.fieldPartyTitle}
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder={effectiveLeaderNick ? `Party PL ${effectiveLeaderNick}` : '⚔️ Epic Bosses / Baium 9-man Main Party'}
              className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.fieldContentType}
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full px-3 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
              >
                {GOALS_LIST.map((g) => (
                  <option key={g.id} value={g.id}>
                    {t[g.key as keyof typeof t] || g.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.fieldPartySize}
              </label>
              <select
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
              >
                <option value={9}>9 members (Standard L2 Party)</option>
                <option value={18}>18 members (Command Channel 2 Packs)</option>
                <option value={27}>27 members (Command Channel 3 Packs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t.fieldVoice}
              </label>
              <input
                type="text"
                value={discordVoice}
                onChange={(e) => setDiscordVoice(e.target.value)}
                placeholder="#PACK-1"
                className="w-full px-3.5 py-2.5 bg-[#0d1017] border border-[#8c7241]/40 rounded-lg text-base sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#c2a363] min-h-[44px]"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors min-h-[44px]"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#aa8222] via-[#c2a363] to-[#8c7241] text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              <span>{loading ? 'Creating...' : t.btnCreatePartyModal}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
