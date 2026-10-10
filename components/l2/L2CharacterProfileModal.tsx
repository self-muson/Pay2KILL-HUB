'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Plus,
  Trash2,
  Edit2,
  Check,
  Shield,
  Sparkles,
  Sword,
  Shirt,
  Users,
  PawPrint,
  Heart,
  Crosshair,
  Crown,
  ShieldCheck,
  Eye,
  LogIn,
} from 'lucide-react';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { useAuthStore } from '@/lib/auth-store';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import { UserCharacter, L2ClassArchetype } from '@/lib/l2-spot-types';

interface L2CharacterProfileModalProps {
  onClose: () => void;
}

const L2_POPULAR_CLASSES: { name: string; archetype: L2ClassArchetype }[] = [
  // Summoners (Саммонеры / Призыватели)
  { name: 'Warlock (Котовод)', archetype: 'SUMMONER' },
  { name: 'Elemental Summoner (Коневод)', archetype: 'SUMMONER' },
  { name: 'Phantom Summoner (Теневод)', archetype: 'SUMMONER' },
  { name: 'Arcana Lord (Аркана Лорд)', archetype: 'SUMMONER' },
  { name: 'Elemental Master (Элементал Мастер)', archetype: 'SUMMONER' },
  { name: 'Spectral Master (Спектрал Мастер)', archetype: 'SUMMONER' },
  // Archers
  { name: 'Silver Ranger', archetype: 'ARCHER' },
  { name: 'Hawkeye', archetype: 'ARCHER' },
  { name: 'Phantom Ranger', archetype: 'ARCHER' },
  { name: 'Elven Scout', archetype: 'ARCHER' },
  // Daggers
  { name: 'Rogue', archetype: 'DAGGER' },
  { name: 'Abyss Walker', archetype: 'DAGGER' },
  { name: 'Treasure Hunter', archetype: 'DAGGER' },
  { name: 'Plains Walker', archetype: 'DAGGER' },
  // Support & Healers
  { name: 'Cleric', archetype: 'SUPPORT' },
  { name: 'Bishop', archetype: 'SUPPORT' },
  { name: 'Elven Elder', archetype: 'SUPPORT' },
  { name: 'Shillien Elder', archetype: 'SUPPORT' },
  { name: 'Prophet', archetype: 'SUPPORT' },
  { name: 'Warcryer', archetype: 'SUPPORT' },
  { name: 'Overlord', archetype: 'SUPPORT' },
  { name: 'Swordsinger', archetype: 'SUPPORT' },
  { name: 'Bladedancer', archetype: 'SUPPORT' },
  // Tanks
  { name: 'Paladin', archetype: 'TANK' },
  { name: 'Dark Avenger', archetype: 'TANK' },
  { name: 'Temple Knight', archetype: 'TANK' },
  { name: 'Shillien Knight', archetype: 'TANK' },
  // Warriors
  { name: 'Destroyer', archetype: 'WARRIOR' },
  { name: 'Tyrant', archetype: 'WARRIOR' },
  { name: 'Gladiator', archetype: 'WARRIOR' },
  { name: 'Warlord', archetype: 'WARRIOR' },
  { name: 'Bounty Hunter', archetype: 'WARRIOR' },
  { name: 'Warsmith', archetype: 'WARRIOR' },
  // Mages
  { name: 'Spellhowler', archetype: 'MAGE' },
  { name: 'Spellsinger', archetype: 'MAGE' },
  { name: 'Sorcerer', archetype: 'MAGE' },
  { name: 'Necromancer', archetype: 'MAGE' },
];

export function L2CharacterProfileModal({ onClose }: L2CharacterProfileModalProps) {
  const {
    characters,
    activeCharacterId,
    setActiveCharacter,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  } = useL2SpotStore();

  const { user, setIsAuthModalOpen } = useAuthStore();
  const { role } = useBossTrackerStore();

  const [isCreating, setIsCreating] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  // Form fields
  const [nickname, setNickname] = useState('');
  const [approxLevel, setApproxLevel] = useState('20-24');
  const [className, setClassName] = useState('Silver Ranger');
  const [gearSummary, setGearSummary] = useState('');
  const [clanName, setClanName] = useState(user?.clanName || 'Pay2KILL');

  const startCreate = () => {
    setNickname('');
    setApproxLevel('20-24');
    setClassName('Silver Ranger');
    setGearSummary('Brigandine Set + D-Grade Weapon');
    setClanName(user?.clanName || 'Pay2KILL');
    setEditingCharId(null);
    setIsCreating(true);
  };

  const startEdit = (char: UserCharacter) => {
    setNickname(char.nickname);
    setApproxLevel(char.approxLevel);
    setClassName(char.className);
    setGearSummary(char.gearSummary);
    setClanName(char.clanName);
    setEditingCharId(char.id);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingCharId(null);
  };

  const syncCharacterToAllStores = (allChars: UserCharacter[], activeId: string) => {
    void useAuthStore.getState().saveCharacters(allChars, activeId);
    const chosen = allChars.find((c) => c.id === activeId) || allChars[0];
    if (chosen) {
      void useBossTrackerStore.getState().syncUserCharacterToSpectator({
        nickname: chosen.nickname,
        className: chosen.className,
        level: chosen.levelNumber || 75,
        clanName: chosen.clanName || user?.clanName || 'Pay2KILL',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const classObj = L2_POPULAR_CLASSES.find((c) => c.name === className) || {
      name: className,
      archetype: 'ARCHER' as L2ClassArchetype,
    };

    const parsedNum = parseInt(approxLevel.replace(/\D/g, ''), 10) || 75;

    let updatedList: UserCharacter[] = [];
    let newActiveId = activeCharacterId || '';

    if (editingCharId) {
      updateCharacter(editingCharId, {
        nickname: nickname.trim(),
        approxLevel: approxLevel.trim() || '75',
        levelNumber: parsedNum,
        className,
        classArchetype: classObj.archetype,
        gearSummary: gearSummary.trim() || 'A-Grade Equipment',
        clanName: clanName.trim() || user?.clanName || 'Pay2KILL',
      });
      updatedList = useL2SpotStore.getState().characters;
    } else {
      const newChar: UserCharacter = {
        id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        nickname: nickname.trim(),
        approxLevel: approxLevel.trim() || '75',
        levelNumber: parsedNum,
        className,
        classArchetype: classObj.archetype,
        gearSummary: gearSummary.trim() || 'A-Grade Equipment',
        clanName: clanName.trim() || user?.clanName || 'Pay2KILL',
        isMain: characters.length === 0,
        createdAt: Date.now(),
      };
      addCharacter(newChar);
      updatedList = useL2SpotStore.getState().characters;
      if (characters.length === 0) {
        newActiveId = newChar.id;
      }
    }

    syncCharacterToAllStores(updatedList, newActiveId);
    cancelForm();
  };

  const handleSelectActive = (charId: string) => {
    setActiveCharacter(charId);
    syncCharacterToAllStores(useL2SpotStore.getState().characters, charId);
  };

  const handleDelete = (charId: string) => {
    deleteCharacter(charId);
    const remain = useL2SpotStore.getState().characters;
    const nextActive = remain[0]?.id || '';
    syncCharacterToAllStores(remain, nextActive);
  };

  const getArchetypeColor = (archetype: L2ClassArchetype) => {
    switch (archetype) {
      case 'ARCHER':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40';
      case 'DAGGER':
        return 'text-amber-400 bg-amber-950/70 border-amber-500/40';
      case 'SUPPORT':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40';
      case 'WARRIOR':
        return 'text-red-400 bg-red-950/70 border-red-500/40';
      case 'TANK':
        return 'text-blue-400 bg-blue-950/70 border-blue-500/40';
      case 'MAGE':
        return 'text-purple-400 bg-purple-950/70 border-purple-500/40';
      case 'SUMMONER':
        return 'text-amber-300 bg-amber-950/70 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
    }
  };

  const renderArchetypeIcon = (archetype: L2ClassArchetype) => {
    switch (archetype) {
      case 'SUMMONER':
        return <PawPrint className="w-5 h-5 text-amber-300" />;
      case 'ARCHER':
        return <Crosshair className="w-5 h-5 text-emerald-400" />;
      case 'DAGGER':
        return <Sword className="w-5 h-5 text-amber-400" />;
      case 'SUPPORT':
        return <Heart className="w-5 h-5 text-cyan-400" />;
      case 'TANK':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'WARRIOR':
        return <Sword className="w-5 h-5 text-red-400" />;
      case 'MAGE':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0f131a] border-2 border-[#c2a363]/60 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans select-none max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1c1813] via-[#2a2217] to-[#1c1813] border-b border-[#c2a363]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b2d18] border border-[#c2a363] flex items-center justify-center text-amber-300 shadow-md">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-amber-100 uppercase tracking-wider">
                ЛИЧНЫЙ ПРОФИЛЬ // ПЕРСОНАЖИ КЛАНА
              </h3>
              <p className="text-xs text-[#c2a363] font-mono">
                Коллекция персонажей для быстрого занятия спотов и вызова КК
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-amber-300/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 font-mono text-xs">
          {/* User Account / Role Status Banner */}
          <div className="p-3 rounded-xl bg-[#121622] border border-[#c2a363]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${
                  role === 'admin'
                    ? 'bg-red-950 border-red-500 text-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : role === 'scout'
                    ? 'bg-yellow-950 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {role === 'admin' ? (
                  <Crown className="w-5 h-5 text-amber-400" />
                ) : role === 'scout' ? (
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-200 font-bold text-xs">
                    {user ? user.displayName || user.username : 'Гостевой аккаунт'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      role === 'admin'
                        ? 'bg-red-950/80 border-red-500 text-red-200'
                        : role === 'scout'
                        ? 'bg-yellow-950/80 border-yellow-400 text-yellow-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {role === 'admin' ? '👑 Лидер Клана (КЛ)' : role === 'scout' ? '🛡️ Скаут / РЛ' : '👁️ Наблюдатель (Мембер)'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                  <span>Клан: <b className="text-amber-400">{user?.clanName || clanName}</b></span>
                  {user?.discordTag && <span>• DC: {user.discordTag}</span>}
                </div>
              </div>
            </div>

            {!user && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1.5 shadow-md self-start sm:self-center transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти в аккаунт</span>
              </button>
            )}
          </div>

          {/* Top action row */}
          {!isCreating && (
            <div className="flex items-center justify-between bg-[#141924] p-3 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 font-bold">
                  СОХРАНЕНО ПЕРСОНАЖЕЙ: {characters.length}
                </span>
              </div>
              <button
                onClick={startCreate}
                className="px-3 py-1.5 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                <span>ДОБАВИТЬ ПЕРСОНАЖА</span>
              </button>
            </div>
          )}

          {/* Form to Add or Edit Character */}
          {isCreating && (
            <form
              onSubmit={handleSave}
              className="bg-[#141822] p-4 rounded-xl border border-[#c2a363]/60 shadow-lg space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-serif font-bold text-amber-300 text-sm">
                  {editingCharId ? 'РЕДАКТИРОВАНИЕ ПЕРСОНАЖА' : 'СОЗДАНИЕ НОВОГО ПЕРСОНАЖА'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Данные сохраняются в ваш профиль
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nickname */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">НИКНЕЙМ / ИМЯ</label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Например: Spectre_SR"
                    className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Approximate Level */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    ПРИБЛИЗИТЕЛЬНЫЙ УРОВЕНЬ
                  </label>
                  <input
                    type="text"
                    required
                    value={approxLevel}
                    onChange={(e) => setApproxLevel(e.target.value)}
                    placeholder="Например: 20-24, ~22, 20+"
                    className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1 mt-1">
                    {['20-22', '20-24', '22-25', '25+'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setApproxLevel(preset)}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 border border-slate-800"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">ПРОФЕССИЯ / КЛАСС</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    {L2_POPULAR_CLASSES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.archetype})
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-amber-400 font-bold mr-1">Саммонеры:</span>
                    {[
                      { label: 'Котовод (WK)', name: 'Warlock (Котовод)' },
                      { label: 'Коневод (ES)', name: 'Elemental Summoner (Коневод)' },
                      { label: 'Теневод (PS)', name: 'Phantom Summoner (Теневод)' },
                    ].map((sum) => (
                      <button
                        type="button"
                        key={sum.name}
                        onClick={() => setClassName(sum.name)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                          className === sum.name
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-sm'
                            : 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {sum.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clan */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">КЛАН</label>
                  <input
                    type="text"
                    value={clanName}
                    onChange={(e) => setClanName(e.target.value)}
                    placeholder="Pay2KILL"
                    className="w-full px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Gear / Equipment */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  ЭКИПИРОВКА / ВЕЩИ ПЕРСОНАЖА
                </label>
                <div className="relative">
                  <Shirt className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={gearSummary}
                    onChange={(e) => setGearSummary(e.target.value)}
                    placeholder="Например: Brigandine Armor Set + Gastraphetes Bow"
                    className="w-full pl-9 pr-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-xs transition-colors"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  {editingCharId ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОЗДАТЬ ПЕРСОНАЖА'}
                </button>
              </div>
            </form>
          )}

          {/* List of characters */}
          <div className="space-y-2">
            {characters.map((char) => {
              const isActive = char.id === activeCharacterId;

              return (
                <div
                  key={char.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#18202d] border-[#c2a363] shadow-lg ring-1 ring-[#c2a363]/50'
                      : 'bg-[#11151e] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 shadow-sm ${getArchetypeColor(
                        char.classArchetype
                      )}`}
                    >
                      {renderArchetypeIcon(char.classArchetype)}
                    </div>

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-black text-sm text-amber-100 truncate">
                          {char.nickname}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                          Ур. {char.approxLevel}
                        </span>
                        {char.clanName && (
                          <span className="text-[10px] text-slate-400 bg-[#090b0e] px-1.5 py-0.5 rounded border border-slate-800">
                            [{char.clanName}]
                          </span>
                        )}
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[9px] font-bold">
                            АКТИВНЫЙ
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5 truncate">
                        <span className="text-amber-300/90 font-medium">{char.className}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 truncate flex items-center gap-1">
                          <Sword className="w-3 h-3 text-slate-500 shrink-0" />
                          {char.gearSummary || 'Обычная экипировка'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        onClick={() => handleSelectActive(char.id)}
                        className="px-2.5 py-1.5 bg-[#1b2333] hover:bg-[#253046] border border-slate-700 text-slate-300 hover:text-amber-200 rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                        title="Выбрать активным для занятия спотов"
                      >
                        <Check className="w-3 h-3" />
                        <span>ВЫБРАТЬ</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ГОТОВ К СПОТУ
                      </span>
                    )}

                    <button
                      onClick={() => startEdit(char)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Редактировать персонажа"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {characters.length > 1 && (
                      <button
                        onClick={() => handleDelete(char.id)}
                        className="p-1.5 bg-slate-900 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 rounded transition-colors cursor-pointer"
                        title="Удалить персонажа"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0c1017] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>LINEAGE 2 CHARACTER VAULT</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}
