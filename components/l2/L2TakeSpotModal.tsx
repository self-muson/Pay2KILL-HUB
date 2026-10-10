'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, Crosshair, Sparkles } from 'lucide-react';
import { L2Boss, L2ClassArchetype } from '@/lib/l2-spot-types';
import { useL2SpotStore } from '@/lib/l2-spot-store';

interface L2TakeSpotModalProps {
  boss: L2Boss;
  onClose: () => void;
}

const L2_POPULAR_CLASSES = [
  { name: 'Silver Ranger', archetype: 'ARCHER' as L2ClassArchetype },
  { name: 'Hawkeye', archetype: 'ARCHER' as L2ClassArchetype },
  { name: 'Phantom Ranger', archetype: 'ARCHER' as L2ClassArchetype },
  { name: 'Abyss Walker', archetype: 'DAGGER' as L2ClassArchetype },
  { name: 'Plains Walker', archetype: 'DAGGER' as L2ClassArchetype },
  { name: 'Treasure Hunter', archetype: 'DAGGER' as L2ClassArchetype },
  { name: 'Blade Dancer', archetype: 'SUPPORT' as L2ClassArchetype },
  { name: 'Sword Muse', archetype: 'SUPPORT' as L2ClassArchetype },
  { name: 'Dominator', archetype: 'SUPPORT' as L2ClassArchetype },
  { name: 'Cardinal', archetype: 'SUPPORT' as L2ClassArchetype },
  { name: 'Duelist', archetype: 'WARRIOR' as L2ClassArchetype },
  { name: 'Titan', archetype: 'WARRIOR' as L2ClassArchetype },
  { name: 'Paladin', archetype: 'TANK' as L2ClassArchetype },
  { name: 'Archmage', archetype: 'MAGE' as L2ClassArchetype },
  { name: 'Spellhowler', archetype: 'MAGE' as L2ClassArchetype },
];

export function L2TakeSpotModal({ boss, onClose }: L2TakeSpotModalProps) {
  const { myCharacter, updateMyCharacter, takeSpot } = useL2SpotStore();

  const [nickname, setNickname] = useState(myCharacter.nickname || '');
  const [className, setClassName] = useState(myCharacter.className || 'Silver Ranger');
  const [clanName, setClanName] = useState(myCharacter.clanName || 'Pay2KILL');
  const [level, setLevel] = useState(String(myCharacter.level || 78));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Укажите никнейм персонажа');
      return;
    }

    const selectedClassObj = L2_POPULAR_CLASSES.find((c) => c.name === className) || {
      name: className,
      archetype: 'ARCHER' as L2ClassArchetype,
    };

    // Save profile update
    updateMyCharacter({
      nickname: nickname.trim(),
      className,
      classArchetype: selectedClassObj.archetype,
      clanName: clanName.trim() || 'Pay2KILL',
      level: Number(level) || 78,
    });

    // Claim spot
    takeSpot(
      boss.id,
      {
        nickname: nickname.trim(),
        className,
        classArchetype: selectedClassObj.archetype,
        clanName: clanName.trim() || 'Pay2KILL',
        level: Number(level) || 78,
      },
      note.trim() || 'На споте. Мониторю респаун босса'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#11141a] border-2 border-[#c2a363]/60 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans select-none">
        {/* Header with antique fantasy styling */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#1c1813] via-[#2a2217] to-[#1c1813] border-b border-[#c2a363]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b2d18] border border-[#c2a363] flex items-center justify-center text-[#c2a363] shadow-md">
              <Crosshair className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-amber-100 uppercase tracking-wider drop-shadow-sm">
                Встать на спот {boss.name}
              </h3>
              <p className="text-xs text-[#c2a363] font-mono">
                {boss.location} (Lv {boss.level})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-amber-300/70 hover:text-amber-100 hover:bg-black/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-2.5 bg-red-950/70 border border-red-500/60 rounded-md text-red-200">
              {error}
            </div>
          )}

          <div className="bg-[#181d26] p-3 rounded-lg border border-slate-800 text-slate-300 font-sans text-xs leading-relaxed">
            Рейд-лидеры и сокланы увидят ваш никнейм на карточке босса. Когда босс реснется — нажмите кнопку{' '}
            <strong className="text-amber-300 font-mono">«БОСС РЕСНУЛСЯ!»</strong> для созыва КК и паков.
          </div>

          <div>
            <label className="block text-amber-200 font-bold mb-1.5 font-mono">
              НИКНЕЙМ ПЕРСОНАЖА (NICKNAME)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Spectre_SR"
              className="w-full px-3 py-2 bg-[#090b0e] border border-[#c2a363]/40 rounded-md text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-amber-200 font-bold mb-1.5 font-mono">
                КЛАСС В ИГРЕ (CLASS)
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-[#c2a363]/40 rounded-md text-amber-100 focus:outline-none focus:border-amber-400 font-mono text-xs"
              >
                {L2_POPULAR_CLASSES.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-amber-200 font-bold mb-1.5 font-mono">
                УРОВЕНЬ (LEVEL)
              </label>
              <input
                type="number"
                min="40"
                max="85"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 bg-[#090b0e] border border-[#c2a363]/40 rounded-md text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-amber-200 font-bold mb-1.5 font-mono">
              КЛАН / ПАК
            </label>
            <input
              type="text"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              placeholder="Pay2KILL"
              className="w-full px-3 py-2 bg-[#090b0e] border border-[#c2a363]/40 rounded-md text-amber-100 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5 font-mono">
              ЗАМЕТКА / ДИСЛОКАЦИЯ (ПО ЖЕЛАНИЮ)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. В инвизе у входа / на сердце дракона"
              className="w-full px-3 py-2 bg-[#090b0e] border border-slate-800 rounded-md text-slate-200 focus:outline-none focus:border-slate-600 font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black tracking-wider uppercase rounded-md shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>ЗАНЯТЬ СПОТ (НА ДЕЖУРСТВО)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md font-mono transition-colors"
            >
              ОТМЕНА
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
