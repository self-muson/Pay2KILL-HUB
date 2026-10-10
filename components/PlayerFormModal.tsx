'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Shield,
  Sword,
  Heart,
  Sparkles,
  Check,
  User,
  PawPrint,
  Settings,
  Sparkle,
} from 'lucide-react';
import {
  Role,
  L2ClassId,
  Goal,
  EquipGrade,
  L2_CLASSES_LIST,
  GOALS_LIST,
  ClanInfo,
  INITIAL_CLANS_LIST,
} from '@/lib/types';
import { sounds } from '@/lib/sound-effects';
import { Language, translations } from '@/lib/i18n';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { UserCharacter, L2ClassArchetype } from '@/lib/l2-spot-types';

interface PlayerFormModalProps {
  isOpen: boolean;
  mySessionId: string;
  lang: Language;
  clans?: ClanInfo[];
  onClose: () => void;
  onSubmitSuccess: () => void;
  soundEnabled: boolean;
  onOpenCharacterProfile?: () => void;
}

export function PlayerFormModal({
  isOpen,
  mySessionId,
  lang,
  clans = INITIAL_CLANS_LIST,
  onClose,
  onSubmitSuccess,
  soundEnabled,
  onOpenCharacterProfile,
}: PlayerFormModalProps) {
  const t = translations[lang];
  const { characters, activeCharacterId, setActiveCharacter, addCharacter, updateCharacter } =
    useL2SpotStore();

  const [nickname, setNickname] = useState('');
  const [clan, setClan] = useState(clans[0]?.name || 'Pay2KILL');
  const [role, setRole] = useState<Role>('DD');
  const [l2Class, setL2Class] = useState<L2ClassId>('SilverRanger');
  const [subClass, setSubClass] = useState('');
  const [level, setLevel] = useState(75);
  const [equipGrade, setEquipGrade] = useState<EquipGrade>('A-Grade');
  const [goal, setGoal] = useState<Goal>('Raid');
  const [notes, setNotes] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wasOpenRef = useRef(false);

  // Map saved UserCharacter to LFG L2ClassId & Role
  const mapCharacterToL2Class = (char: UserCharacter): { l2Class: L2ClassId; role: Role } => {
    const cName = char.className.toLowerCase();
    if (cName.includes('arcana') || cName.includes('аркана')) {
      return { l2Class: 'ArcanaLord', role: 'Summoner' };
    }
    if (cName.includes('elemental master') || (cName.includes('мастер') && cName.includes('эльф'))) {
      return { l2Class: 'ElementalMaster', role: 'Summoner' };
    }
    if (cName.includes('spectral') || cName.includes('спектрал')) {
      return { l2Class: 'SpectralMaster', role: 'Summoner' };
    }
    if (cName.includes('warlock') || cName.includes('котовод') || cName.includes('кот')) {
      return { l2Class: 'Warlock', role: 'Summoner' };
    }
    if (cName.includes('elemental') || cName.includes('коневод') || cName.includes('конь')) {
      return { l2Class: 'ElementalSummoner', role: 'Summoner' };
    }
    if (cName.includes('phantom summoner') || cName.includes('теневод') || cName.includes('тень')) {
      return { l2Class: 'PhantomSummoner', role: 'Summoner' };
    }
    if (cName.includes('silver ranger') || cName.includes('sr')) {
      return { l2Class: 'SilverRanger', role: 'DD' };
    }
    if (cName.includes('hawkeye') || cName.includes('he')) {
      return { l2Class: 'Hawkeye', role: 'DD' };
    }
    if (cName.includes('phantom ranger') || cName.includes('pr')) {
      return { l2Class: 'PhantomRanger', role: 'DD' };
    }
    if (cName.includes('abyss walker') || cName.includes('aw') || cName.includes('rogue')) {
      return { l2Class: 'AbyssWalker', role: 'DD' };
    }
    if (cName.includes('treasure hunter') || cName.includes('th')) {
      return { l2Class: 'TreasureHunter', role: 'DD' };
    }
    if (cName.includes('plains walker') || cName.includes('pw')) {
      return { l2Class: 'PlainsWalker', role: 'DD' };
    }
    if (cName.includes('bishop') || cName.includes('bp') || cName.includes('cleric')) {
      return { l2Class: 'Bishop', role: 'Heal' };
    }
    if (cName.includes('elven elder') || cName.includes('ee')) {
      return { l2Class: 'ElvenElder', role: 'Heal' };
    }
    if (cName.includes('shillien elder') || cName.includes('se') || cName.includes('oracle')) {
      return { l2Class: 'ShillienElder', role: 'Heal' };
    }
    if (cName.includes('prophet') || cName.includes('pp')) {
      return { l2Class: 'Prophet', role: 'Buffer' };
    }
    if (cName.includes('warcryer') || cName.includes('wc')) {
      return { l2Class: 'Warcryer', role: 'Buffer' };
    }
    if (cName.includes('overlord') || cName.includes('ol')) {
      return { l2Class: 'Overlord', role: 'Buffer' };
    }
    if (cName.includes('swordsinger') || cName.includes('sws')) {
      return { l2Class: 'Swordsinger', role: 'Buffer' };
    }
    if (cName.includes('bladedancer') || cName.includes('bd')) {
      return { l2Class: 'Bladedancer', role: 'Buffer' };
    }
    if (cName.includes('paladin') || cName.includes('knight')) {
      return { l2Class: 'Paladin', role: 'Tank' };
    }
    if (cName.includes('dark avenger') || cName.includes('da')) {
      return { l2Class: 'DarkAvenger', role: 'Tank' };
    }
    if (cName.includes('destroyer') || cName.includes('destro')) {
      return { l2Class: 'Destroyer', role: 'DD' };
    }
    if (cName.includes('tyrant') || cName.includes('tyr')) {
      return { l2Class: 'Tyrant', role: 'DD' };
    }
    if (cName.includes('gladiator') || cName.includes('glad')) {
      return { l2Class: 'Gladiator', role: 'DD' };
    }
    if (cName.includes('spellhowler') || cName.includes('sh') || cName.includes('wizard')) {
      return { l2Class: 'Spellhowler', role: 'DD' };
    }
    if (cName.includes('spellsinger') || cName.includes('sps')) {
      return { l2Class: 'Spellsinger', role: 'DD' };
    }
    if (cName.includes('sorcerer') || cName.includes('sorc')) {
      return { l2Class: 'Sorcerer', role: 'DD' };
    }
    if (cName.includes('necromancer') || cName.includes('necro')) {
      return { l2Class: 'Necromancer', role: 'DD' };
    }

    if (char.classArchetype === 'SUMMONER') return { l2Class: 'Warlock', role: 'Summoner' };
    if (char.classArchetype === 'TANK') return { l2Class: 'Paladin', role: 'Tank' };
    if (char.classArchetype === 'SUPPORT') return { l2Class: 'Bishop', role: 'Heal' };
    return { l2Class: 'SilverRanger', role: 'DD' };
  };

  const handleSelectCharacter = useCallback((char: UserCharacter) => {
    const { l2Class: matchedClass, role: matchedRole } = mapCharacterToL2Class(char);
    setNickname(char.nickname);
    if (char.clanName) setClan(char.clanName);
    setRole(matchedRole);
    setL2Class(matchedClass);
    setLevel(Math.min(Math.max(char.levelNumber || 75, 20), 75));
    if (char.gearSummary) setNotes(char.gearSummary);
    setSelectedCharId(char.id);
    setActiveCharacter(char.id);
  }, [setActiveCharacter]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        // Pre-select active character if available
        if (characters.length > 0) {
          const active =
            characters.find((c) => c.id === activeCharacterId) ||
            characters.find((c) => c.isMain) ||
            characters[0];
          if (active) {
            handleSelectCharacter(active);
            return;
          }
        }

        const savedNick =
          typeof window !== 'undefined' ? localStorage.getItem('tl_lfg_last_nick') : null;
        const savedClan =
          typeof window !== 'undefined' ? localStorage.getItem('tl_lfg_last_clan') : null;
        if (savedNick) setNickname(savedNick);
        if (savedClan) setClan(savedClan);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, characters, activeCharacterId, handleSelectCharacter]);

  // Filter classes according to role
  const filteredClasses =
    role === 'Summoner'
      ? L2_CLASSES_LIST.filter((c) => c.category === 'Summoner' || c.role === 'Summoner')
      : role === 'DD'
      ? L2_CLASSES_LIST.filter((c) => c.role === 'DD' || c.category === 'Summoner')
      : L2_CLASSES_LIST.filter((c) => c.role === role);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    const classesForRole =
      newRole === 'Summoner'
        ? L2_CLASSES_LIST.filter((c) => c.category === 'Summoner')
        : L2_CLASSES_LIST.filter((c) => c.role === newRole);
    if (classesForRole.length > 0) {
      setL2Class(classesForRole[0].id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Пожалуйста, введите никнейм персонажа');
      return;
    }

    setLoading(true);
    setError('');

    try {
      localStorage.setItem('tl_lfg_last_nick', nickname.trim());
      localStorage.setItem('tl_lfg_last_clan', clan);

      // Save to User's Character Vault if requested
      if (saveToProfile) {
        const existing = characters.find(
          (c) => c.nickname.toLowerCase() === nickname.trim().toLowerCase()
        );
        const archetype: L2ClassArchetype =
          role === 'Summoner'
            ? 'SUMMONER'
            : role === 'Tank'
            ? 'TANK'
            : role === 'Heal' || role === 'Buffer'
            ? 'SUPPORT'
            : 'ARCHER';

        if (existing) {
          updateCharacter(existing.id, {
            nickname: nickname.trim(),
            clanName: clan,
            className: L2_CLASSES_LIST.find((c) => c.id === l2Class)?.nameEn || l2Class,
            classArchetype: archetype,
            levelNumber: level,
            approxLevel: String(level),
            gearSummary: notes.trim() || `${equipGrade} Equipment`,
          });
        } else {
          addCharacter({
            nickname: nickname.trim(),
            clanName: clan,
            className: L2_CLASSES_LIST.find((c) => c.id === l2Class)?.nameEn || l2Class,
            classArchetype: archetype,
            levelNumber: level,
            approxLevel: String(level),
            gearSummary: notes.trim() || `${equipGrade} Equipment`,
            isMain: characters.length === 0,
          });
        }
      }

      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join_queue',
          ownerId: mySessionId,
          requestorId: mySessionId,
          nickname: nickname.trim(),
          clan,
          role,
          l2Class,
          subClass: subClass.trim(),
          level,
          equipGrade,
          goal,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        if (soundEnabled) sounds.playJoinQueue();
        onSubmitSuccess();
        onClose();
      }
    } catch {
      setError('Ошибка при добавлении в очередь LFG');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-xl bg-[#0f131a] rounded-t-2xl sm:rounded-xl border-2 border-[#c2a363]/60 shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden safe-area-bottom select-none font-sans">
        {/* Mobile handle indicator */}
        <div className="w-10 h-1.5 bg-slate-600/80 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#c2a363]/30 bg-gradient-to-r from-[#181512] via-[#241c13] to-[#181512] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b2d18] border border-[#c2a363] flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-amber-100 uppercase tracking-wide">
                {t.modalJoinTitle}
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-300/80 font-mono">
                Выберите персонажа из профиля или введите данные вручную
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
          {/* ------------------------------------------------------------- */}
          {/* QUICK-SELECT SAVED CHARACTER ROSTER */}
          {/* ------------------------------------------------------------- */}
          {characters.length > 0 && (
            <div className="bg-[#141924] p-3 rounded-xl border border-[#c2a363]/40 shadow-inner space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-200 font-bold font-serif text-xs uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>ВЫБРАТЬ ИЗ МОИХ ПЕРСОНАЖЕЙ:</span>
                </div>
                {onOpenCharacterProfile && (
                  <button
                    type="button"
                    onClick={onOpenCharacterProfile}
                    className="text-[10px] text-amber-400/90 hover:text-amber-200 underline flex items-center gap-1 font-mono"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Личный кабинет ({characters.length})</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {characters.map((char) => {
                  const isSelected =
                    selectedCharId === char.id ||
                    nickname.toLowerCase() === char.nickname.toLowerCase();

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleSelectCharacter(char)}
                      className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-amber-950/80 border-[#c2a363] text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                          : 'bg-[#0d1017] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs truncate max-w-[85px]">{char.nickname}</span>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          {char.approxLevel ? `${char.approxLevel}` : `Lv${char.levelNumber}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{char.className}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 1: Nickname & Clan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {t.fieldNick} <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setSelectedCharId(null);
                }}
                placeholder="Например: DarkDestroyer"
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">{t.fieldClan}</label>
              <select
                value={clan}
                onChange={(e) => setClan(e.target.value)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
              >
                {clans.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Role Selection (Including Summoner!) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              {t.fieldRole} <span className="text-amber-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {/* Tank */}
              <button
                type="button"
                onClick={() => handleRoleChange('Tank')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                  role === 'Tank'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'bg-[#0d1017] border-slate-800 text-slate-400 hover:border-blue-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  {role === 'Tank' && <Check className="w-3 h-3 text-blue-400" />}
                </div>
                <div className="font-bold text-[11px] text-blue-400">{t.roleTank}</div>
              </button>

              {/* Heal */}
              <button
                type="button"
                onClick={() => handleRoleChange('Heal')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                  role === 'Heal'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : 'bg-[#0d1017] border-slate-800 text-slate-400 hover:border-emerald-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Heart className="w-3.5 h-3.5 text-emerald-400" />
                  {role === 'Heal' && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="font-bold text-[11px] text-emerald-400">{t.roleHeal}</div>
              </button>

              {/* Buffer */}
              <button
                type="button"
                onClick={() => handleRoleChange('Buffer')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                  role === 'Buffer'
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-[#0d1017] border-slate-800 text-slate-400 hover:border-purple-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  {role === 'Buffer' && <Check className="w-3 h-3 text-purple-400" />}
                </div>
                <div className="font-bold text-[11px] text-purple-400">{t.roleBuffer}</div>
              </button>

              {/* DD */}
              <button
                type="button"
                onClick={() => handleRoleChange('DD')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                  role === 'DD'
                    ? 'bg-red-950/80 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'bg-[#0d1017] border-slate-800 text-slate-400 hover:border-red-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Sword className="w-3.5 h-3.5 text-red-400" />
                  {role === 'DD' && <Check className="w-3 h-3 text-red-400" />}
                </div>
                <div className="font-bold text-[11px] text-red-400">{t.roleDd}</div>
              </button>

              {/* SUMMONER (САММОНЕРЫ) */}
              <button
                type="button"
                onClick={() => handleRoleChange('Summoner')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col gap-1 col-span-2 sm:col-span-1 ${
                  role === 'Summoner'
                    ? 'bg-amber-950/90 border-[#c2a363] text-amber-200 shadow-[0_0_15px_rgba(194,163,99,0.4)] ring-1 ring-amber-400/50'
                    : 'bg-[#0d1017] border-slate-800 text-slate-400 hover:border-amber-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <PawPrint className="w-3.5 h-3.5 text-amber-400" />
                  {role === 'Summoner' && <Check className="w-3 h-3 text-amber-400" />}
                </div>
                <div className="font-bold text-[11px] text-amber-300">
                  {t.roleSummoner || 'САММОНЕР'}
                </div>
              </button>
            </div>
          </div>

          {/* Row 3: Class Select & Subclass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {t.fieldClass} <span className="text-amber-400">*</span>
              </label>
              <select
                value={l2Class}
                onChange={(e) => setL2Class(e.target.value as L2ClassId)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
              >
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">{t.fieldSubclass}</label>
              <input
                type="text"
                value={subClass}
                onChange={(e) => setSubClass(e.target.value)}
                placeholder="Например: Hawkeye 75, BP"
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 4: Level, Equip Grade & Goal */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {t.fieldLevel} (20-75)
              </label>
              <input
                type="number"
                min={20}
                max={75}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">{t.fieldEquip}</label>
              <select
                value={equipGrade}
                onChange={(e) => setEquipGrade(e.target.value as EquipGrade)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
              >
                <option value="A-Grade">A-Grade</option>
                <option value="B-Grade">B-Grade</option>
                <option value="C-Grade">C-Grade</option>
                <option value="D-Grade">D-Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">{t.fieldGoal}</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
              >
                {GOALS_LIST.map((g) => (
                  <option key={g.id} value={g.id}>
                    {t[g.key as keyof typeof t] || g.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Notes & Equipment description */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              ЭКИПИРОВКА / ЗАМЕТКИ / ПРАЙМ-ТАЙМ
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Avadon Set + Homunculus, готов на Баюма, прайм с 19:00 МСК"
              className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Save to personal profile checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="saveToProfile"
              checked={saveToProfile}
              onChange={(e) => setSaveToProfile(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#c2a363] focus:ring-0 bg-[#090b0e] cursor-pointer"
            />
            <label htmlFor="saveToProfile" className="text-slate-300 cursor-pointer select-none text-[11px]">
              Сохранить этого персонажа в мой профиль (личный кабинет) для быстрого выбора
            </label>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-red-950/80 border border-red-500/80 text-red-200 text-xs">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? t.publishing : t.btnPublishQueue}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
