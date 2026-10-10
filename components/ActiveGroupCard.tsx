'use client';

import React, { useState } from 'react';
import {
  Crown,
  Users,
  Copy,
  Trash2,
  UserPlus,
  CheckCircle2,
  LogOut,
  Volume2,
  Lock,
  Sparkles,
  Shield,
  Heart,
  Sword,
  PawPrint,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveGroup, L2_CLASSES_LIST, GOALS_LIST } from '@/lib/types';
import { sounds } from '@/lib/sound-effects';
import { Language, translations } from '@/lib/i18n';

interface ActiveGroupCardProps {
  group: ActiveGroup;
  mySessionId: string;
  isAdmin: boolean;
  lang: Language;
  onReturnPlayer: (groupId: string, playerId: string) => void;
  onDisbandGroup: (groupId: string) => void;
  onAddPlayerFromQueue: (group: ActiveGroup) => void;
  soundEnabled: boolean;
  onShowToast: (msg: string) => void;
}

export function ActiveGroupCard({
  group,
  mySessionId,
  isAdmin,
  lang,
  onReturnPlayer,
  onDisbandGroup,
  onAddPlayerFromQueue,
  soundEnabled,
  onShowToast,
}: ActiveGroupCardProps) {
  const t = translations[lang];

  const [copiedBatch, setCopiedBatch] = useState(false);

  const isMyGroup = group.ownerId === mySessionId;
  const canManageGroup = isMyGroup || isAdmin || group.ownerId.startsWith('demo_');
  const isFull = group.members.length >= group.maxMembers;
  const goalInfo = GOALS_LIST.find((g) => g.id === group.goal);

  // Copy batch invites
  const handleCopyBatchInvites = () => {
    if (group.members.length === 0) return;

    const inviteCommands = group.members
      .map((m) => `/invite ${m.nickname}`)
      .join('\n');

    navigator.clipboard.writeText(inviteCommands);
    if (soundEnabled) sounds.playCopy();
    setCopiedBatch(true);
    onShowToast(t.toastCopiedAll.replace('{count}', String(group.members.length)));

    if (isFull) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setTimeout(() => setCopiedBatch(false), 2500);
  };

  // Copy single member invite
  const handleCopySingleMember = (nickname: string) => {
    const cmd = `/invite ${nickname}`;
    navigator.clipboard.writeText(cmd);
    if (soundEnabled) sounds.playCopy();
    onShowToast(t.toastCopiedInvite.replace('{text}', cmd));
  };

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isMyGroup
          ? 'card-fantasy border-amber-500/70 shadow-[0_0_18px_rgba(212,175,55,0.25)]'
          : 'card-fantasy border-[#c2a363]/30 shadow-xl'
      }`}
    >
      {/* Group Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-[#1a2130] via-[#141926] to-[#0f131f] border-b border-[#c2a363]/25 flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-amber-400 font-bold font-cinzel text-sm sm:text-base truncate">
              {group.title}
            </span>
            {isMyGroup && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 shrink-0">
                {t.yourPartyBadge}
              </span>
            )}
            {isFull && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                {t.partyFullBadge}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              PL: {group.rlNickname} ({group.rlClan})
            </span>
            <span>·</span>
            {group.discordVoice && (
              <span className="flex items-center gap-1 text-purple-300 truncate">
                <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{group.discordVoice}</span>
              </span>
            )}
          </div>
        </div>

        {/* Member Count & Goal */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {goalInfo && (
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-[11px] sm:text-xs font-semibold border border-amber-500/40 text-amber-300 bg-amber-950/30">
              {t[goalInfo.key as keyof typeof t] || group.goal}
            </span>
          )}

          <div className="px-2.5 py-1 rounded-md bg-[#090c12] border border-amber-500/30 text-amber-200 font-mono font-bold text-xs flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {group.members.length} / {group.maxMembers}
            </span>
          </div>
        </div>
      </div>

      {/* Group Members List */}
      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-[#0d1017]/90">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
          <span>{t.partyCountBadge.replace('{count}', String(group.members.length))}</span>

          {/* Master Copy Batch Invites */}
          {group.members.length > 0 && (
            <button
              onClick={handleCopyBatchInvites}
              className={`w-full xs:w-auto px-3 py-2 sm:py-1.5 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[34px] ${
                copiedBatch
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-gradient-to-r from-[#aa8222] to-[#8c7241] text-slate-950 border-amber-400/50 hover:brightness-110 active:scale-95'
              }`}
              title="Copy /invite for all party members"
            >
              {copiedBatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{t.btnCopyAllInvites}</span>
            </button>
          )}
        </div>

        {group.members.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
            {t.emptyGroupsTitle}
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {group.members.map((member) => {
              const l2ClassObj = L2_CLASSES_LIST.find((c) => c.id === member.l2Class);
              const isPL = member.nickname.toLowerCase() === group.rlNickname.toLowerCase();
              const canKickThisMember = canManageGroup || member.ownerId === mySessionId;

              return (
                <div
                  key={member.id}
                  className="p-2 sm:p-2.5 rounded-lg bg-[#141824] border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors min-h-[48px]"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Role Icon */}
                    <div
                      className={`p-1.5 rounded border shrink-0 ${
                        member.role === 'Tank'
                          ? 'bg-blue-950/80 border-blue-500/50 text-blue-400'
                          : member.role === 'Heal'
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                          : member.role === 'Buffer'
                          ? 'bg-purple-950/80 border-purple-500/50 text-purple-400'
                          : member.role === 'Summoner'
                          ? 'bg-amber-950/80 border-amber-500/50 text-amber-400'
                          : 'bg-red-950/80 border-red-500/50 text-red-400'
                      }`}
                    >
                      {member.role === 'Tank' && <Shield className="w-3.5 h-3.5" />}
                      {member.role === 'Heal' && <Heart className="w-3.5 h-3.5" />}
                      {member.role === 'Buffer' && <Sparkles className="w-3.5 h-3.5" />}
                      {member.role === 'Summoner' && <PawPrint className="w-3.5 h-3.5" />}
                      {member.role === 'DD' && <Sword className="w-3.5 h-3.5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                          {member.nickname}
                        </span>
                        {isPL && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30 shrink-0">
                            PL
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {member.level} lvl
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                        {member.clan} · <span className="text-amber-300 font-medium">{l2ClassObj?.shortCode || member.l2Class}</span> · {member.equipGrade}
                      </div>
                    </div>
                  </div>

                  {/* Quick Copy for single member & kick back to queue */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopySingleMember(member.nickname)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1f2638] hover:bg-[#2a344d] active:scale-95 border border-slate-700 text-xs sm:text-[11px] font-mono text-amber-300 flex items-center gap-1 min-h-[36px]"
                      title="Copy /invite"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">/invite</span>
                    </button>

                    {!isPL && (
                      canKickThisMember ? (
                        <button
                          onClick={() => onReturnPlayer(group.id, member.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Return player to queue"
                          aria-label="Kick to queue"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="p-2 text-slate-700 opacity-50 cursor-not-allowed">
                          <Lock className="w-4 h-4" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group Footer Actions */}
        <div className="pt-2 sm:pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {!isFull ? (
            canManageGroup ? (
              <button
                onClick={() => onAddPlayerFromQueue(group)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#1a2130] hover:bg-[#232d42] active:scale-95 border border-[#c2a363]/40 text-amber-200 transition-all flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px]"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>{t.btnAddFromQueue}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.notYourGroup}</span>
              </span>
            )
          ) : (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>{t.partyCompleted}</span>
            </span>
          )}

          {canManageGroup && (
            <button
              onClick={() => onDisbandGroup(group.id)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/50 active:scale-95 border border-red-500/30 text-red-300 transition-colors flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px]"
              title={t.btnDisbandParty}
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.btnDisbandParty}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
