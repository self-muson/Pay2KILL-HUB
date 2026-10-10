'use client';

import React from 'react';
import { X, UserPlus, Plus, Crown, Users } from 'lucide-react';
import { ActiveGroup, QueuePlayer, L2_CLASSES_LIST } from '@/lib/types';
import { sounds } from '@/lib/sound-effects';
import { Language, translations } from '@/lib/i18n';

interface RaidLeaderAssignModalProps {
  isOpen: boolean;
  mySessionId: string;
  lang: Language;
  onClose: () => void;
  player: QueuePlayer | null;
  activeGroups: ActiveGroup[];
  onTakeToExistingGroup: (groupId: string, playerId: string) => void;
  onCreateNewGroupForPlayer: (player: QueuePlayer) => void;
  soundEnabled: boolean;
}

export function RaidLeaderAssignModal({
  isOpen,
  mySessionId,
  lang,
  onClose,
  player,
  activeGroups,
  onTakeToExistingGroup,
  onCreateNewGroupForPlayer,
  soundEnabled,
}: RaidLeaderAssignModalProps) {
  const t = translations[lang];

  if (!isOpen || !player) return null;

  const l2ClassObj = L2_CLASSES_LIST.find((c) => c.id === player.l2Class);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-md card-fantasy rounded-t-2xl sm:rounded-xl border border-[#c2a363]/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden safe-area-bottom">
        {/* Mobile handle indicator */}
        <div className="w-10 h-1.5 bg-slate-600/80 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 border-b border-[#c2a363]/25 bg-gradient-to-r from-[#161b26] to-[#121620] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold font-cinzel text-slate-100 text-sm">
                {t.assignModalTitle.replace('{nick}', player.nickname)}
              </h3>
              <p className="text-[11px] text-slate-400">
                {l2ClassObj?.shortCode || player.l2Class} · {player.clan} · {player.equipGrade}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-slate-400 hover:text-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Create New Group Option with this player as Leader */}
          <button
            onClick={() => {
              onCreateNewGroupForPlayer(player);
              onClose();
            }}
            className="w-full p-3.5 rounded-lg border border-[#c2a363]/50 bg-gradient-to-r from-[#221c12] to-[#17140e] hover:brightness-125 transition-all text-left flex items-center justify-between gap-3 group shadow-md min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#aa8222]/30 border border-[#c2a363]/60 text-amber-300 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-200 group-hover:text-amber-100 flex items-center gap-1.5">
                  <span>+ Собрать пати с лидером {player.nickname}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Сделать {player.nickname} Лидером группы (ПЛ) и перенести из очереди
                </div>
              </div>
            </div>
            <Plus className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Existing Groups List */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{t.orAddToExisting}</span>
              <span className="text-[10px] font-mono text-amber-400">
                {activeGroups.length} available
              </span>
            </div>

            {activeGroups.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
                Нет активных групп. Нажмите кнопку выше, чтобы собрать новое пати с этим игроком в качестве лидера!
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeGroups.map((group) => {
                  const isFull = group.members.length >= group.maxMembers;
                  const isAlreadyIn = group.members.some((m) => m.id === player.id);
                  const canAdd = group.ownerId === mySessionId || group.ownerId.startsWith('demo_');

                  return (
                    <div
                      key={group.id}
                      className="p-3 rounded-lg bg-[#111520] border border-slate-800 flex items-center justify-between gap-2 hover:border-[#c2a363]/40 transition-colors"
                    >
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-200 truncate">
                          {group.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>PL: {group.rlNickname}</span>
                          <span>·</span>
                          <span className="font-mono text-amber-300">
                            {group.members.length}/{group.maxMembers}
                          </span>
                        </div>
                      </div>

                      <button
                        disabled={isFull || isAlreadyIn}
                        onClick={() => {
                          if (soundEnabled) sounds.playTakePlayer();
                          onTakeToExistingGroup(group.id, player.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow shrink-0 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-[#aa8222] to-[#8c7241] text-slate-950 hover:brightness-110 min-h-[38px] flex items-center"
                      >
                        {isAlreadyIn ? 'Уже в пати' : isFull ? 'Полная пати' : '+ Забрать'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
