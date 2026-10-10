'use client';

import React, { useState } from 'react';
import {
  X,
  Skull,
  Video,
  ExternalLink,
  Trash2,
  CheckCircle,
  Info,
} from 'lucide-react';
import { TrackerBoss } from '@/lib/boss-tracker-types';
import { getBossCooldownRange } from '@/lib/boss-tracker-data';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';

interface BossEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  boss: TrackerBoss | null;
  isNew?: boolean;
}

function BossEditModalContent({
  boss,
  isNew,
  onClose,
}: {
  boss: TrackerBoss | null;
  isNew: boolean;
  onClose: () => void;
}) {
  const { updateBossDetails, addNewBoss, deleteBoss } = useBossTrackerStore();

  const [name, setName] = useState(boss && !isNew ? boss.name : '');
  const [level, setLevel] = useState(boss && !isNew ? boss.level : 40);
  const [camCode, setCamCode] = useState(boss && !isNew ? boss.camCode || '' : '');
  const [notes, setNotes] = useState(boss && !isNew ? boss.notes || '' : '');
  const [link, setLink] = useState(boss && !isNew ? boss.link || '' : '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentRange = getBossCooldownRange(level);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isNew) {
      addNewBoss({
        name,
        level,
        camCode,
        notes,
        link,
      });
    } else if (boss) {
      updateBossDetails(boss.id, {
        name,
        level,
        camCode,
        notes,
        link,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (boss) {
      deleteBoss(boss.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-md bg-[#0e121a] border-2 border-amber-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#1c1813] via-[#2a2217] to-[#1c1813] border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-300">
              <Skull className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-amber-100 uppercase tracking-wider">
                {isNew ? 'ДОБАВИТЬ НОВОГО БОССА' : 'РЕДАКТИРОВАНИЕ БОССА'}
              </h3>
              <p className="text-[10px] text-amber-300/80 font-mono">
                Параметры босса, уровень и камера наблюдения
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs font-mono">
          {/* Boss Name */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-bold font-sans">
              ИМЯ РЕЙД-БОССА: <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: King Tarlk"
              className="w-full px-3 py-2 bg-[#080a0f] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-amber-400 font-sans text-sm"
            />
          </div>

          {/* Level & Cooldown preview */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-bold font-sans">
                УРОВЕНЬ БОССА (20–85):
              </label>
              <span className="text-amber-300 font-bold">{level} ур.</span>
            </div>
            <input
              type="number"
              min={20}
              max={85}
              required
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value, 10) || 20)}
              className="w-full px-3 py-2 bg-[#080a0f] border border-slate-700 rounded-lg text-amber-300 font-bold focus:outline-none focus:border-amber-400"
            />

            {/* Dynamic rule hint */}
            <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-1.5 font-sans">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Формула респауна: <b>{currentRange.label}</b> (от {currentRange.minCooldownHours} до {currentRange.maxCooldownHours} ч)
              </span>
            </div>
          </div>

          {/* Camera code (Персонаж 1 уровня на боссе) */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-bold font-sans flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>НАЗВАНИЕ КАМЕРЫ (АЛЬТ 1 УР.):</span>
            </label>
            <input
              type="text"
              value={camCode}
              onChange={(e) => setCamCode(e.target.value)}
              placeholder="Например: cam56 или camera104"
              className="w-full px-3 py-2 bg-[#080a0f] border border-cyan-700/60 rounded-lg text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500 font-sans">
              Персонаж 1 уровня, припаркованный на споте респауна («поливалка»).
            </p>
          </div>

          {/* Notes / Territory */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-bold font-sans">
              ЗАМЕТКИ / ТЕРРИТОРИЯ (ОПЦИОНАЛЬНО):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Вход в Круму, premo 23.20"
              className="w-full px-3 py-2 bg-[#080a0f] border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] text-slate-950 font-bold font-serif uppercase tracking-wider text-xs shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>СОХРАНИТЬ</span>
            </button>

            {!isNew && (
              <button
                type="button"
                onClick={() => {
                  if (showDeleteConfirm) {
                    handleDelete();
                  } else {
                    setShowDeleteConfirm(true);
                  }
                }}
                className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                  showDeleteConfirm
                    ? 'bg-red-950 text-red-200 border-red-500 animate-pulse'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-red-400'
                }`}
                title={showDeleteConfirm ? 'Подтвердите удаление!' : 'Удалить босса'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{showDeleteConfirm ? 'ТОЧНО?' : 'УДАЛИТЬ'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function BossEditModal({ isOpen, onClose, boss, isNew = false }: BossEditModalProps) {
  if (!isOpen) return null;
  return (
    <BossEditModalContent
      key={isNew ? 'new_boss' : boss?.id || 'unknown'}
      boss={boss}
      isNew={isNew}
      onClose={onClose}
    />
  );
}
