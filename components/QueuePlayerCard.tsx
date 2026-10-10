'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  Shield,
  Heart,
  Sparkles,
  Sword,
  Clock,
  RefreshCw,
  Trash2,
  Copy,
  UserPlus,
  CheckCircle2,
  Lock,
  UserCheck,
  Zap,
  MessageSquare,
  AlertTriangle,
  PawPrint,
} from 'lucide-react';
import { QueuePlayer, L2_CLASSES_LIST, GOALS_LIST } from '@/lib/types';
import { sounds } from '@/lib/sound-effects';
import { Language, translations } from '@/lib/i18n';

function subscribeToMinutes(callback: () => void) {
  const interval = setInterval(callback, 30000);
  return () => clearInterval(interval);
}

function getMinutesSnapshot() {
  return Math.floor(Date.now() / 60000);
}

function getMinutesServerSnapshot() {
  return 0;
}

interface QueuePlayerCardProps {
  player: QueuePlayer;
  mySessionId: string;
  isAdmin: boolean;
  lang: Language;
  onTakeToGroup: (player: QueuePlayer) => void;
  onRefresh: (id: string) => void;
  onRemove: (id: string) => void;
  soundEnabled: boolean;
  onShowToast: (msg: string) => void;
}

export function QueuePlayerCard({
  player,
  mySessionId,
  isAdmin,
  lang,
  onTakeToGroup,
  onRefresh,
  onRemove,
  soundEnabled,
  onShowToast,
}: QueuePlayerCardProps) {
  const t = translations[lang];

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const currentMinute = useSyncExternalStore(subscribeToMinutes, getMinutesSnapshot, getMinutesServerSnapshot);

  const isMyCard = player.ownerId === mySessionId;
  const canManage = isMyCard || isAdmin || player.ownerId.startsWith('demo_');

  // Expiration calculation: 60 minutes
  const playerMinute = Math.floor(player.updatedAt / 60000);
  const timeAgoMinutes = currentMinute > 0 ? Math.max(0, currentMinute - playerMinute) : 0;
  const isExpiringSoon = timeAgoMinutes >= 45 && timeAgoMinutes < 60;

  const l2ClassObj = L2_CLASSES_LIST.find((c) => c.id === player.l2Class);
  const goalInfo = GOALS_LIST.find((g) => g.id === player.goal);

  // Role visual colors
  const getRoleVisual = () => {
    switch (player.role) {
      case 'Tank':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
          label: t.roleTank,
          classes: 'bg-blue-950/80 border-blue-500/50 text-blue-300',
        };
      case 'Heal':
        return {
          icon: <Heart className="w-3.5 h-3.5 text-emerald-400" />,
          label: t.roleHeal,
          classes: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
        };
      case 'Buffer':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          label: t.roleBuffer,
          classes: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
        };
      case 'Summoner':
        return {
          icon: <PawPrint className="w-3.5 h-3.5 text-amber-400" />,
          label: t.roleSummoner || 'САММОНЕР',
          classes: 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]',
        };
      case 'DD':
      default:
        return {
          icon: <Sword className="w-3.5 h-3.5 text-red-400" />,
          label: t.roleDd,
          classes: 'bg-red-950/80 border-red-500/50 text-red-300',
        };
    }
  };

  const roleInfo = getRoleVisual();

  // Copy PM quoted nickname
  const handleCopyQuoteNick = () => {
    const text = `"${player.nickname}"`;
    navigator.clipboard.writeText(text);
    if (soundEnabled) sounds.playCopy();
    setCopiedQuote(true);
    onShowToast(t.toastCopiedPm.replace('{text}', text));
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  // Copy L2 /invite command
  const handleCopyInviteCmd = () => {
    const text = `/invite ${player.nickname}`;
    navigator.clipboard.writeText(text);
    if (soundEnabled) sounds.playCopy();
    setCopiedInvite(true);
    onShowToast(t.toastCopiedInvite.replace('{text}', text));
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isMyCard
          ? 'card-fantasy border-amber-500/70 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
          : 'card-fantasy border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Expiring Banner */}
      {isExpiringSoon && (
        <div className="bg-amber-950/90 text-amber-200 border-b border-amber-500/40 px-3 py-1 text-[11px] flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{t.expiringWarning.replace('{mins}', String(60 - timeAgoMinutes))}</span>
          </div>
          {canManage && (
            <button
              onClick={() => onRefresh(player.id)}
              className="text-amber-300 font-bold hover:underline ml-2"
            >
              [{t.btnExtend}]
            </button>
          )}
        </div>
      )}

      <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
        {/* Row 1: Role, Nick, Clan, Level + Ownership Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Role Badge */}
            <div
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 ${roleInfo.classes}`}
            >
              {roleInfo.icon}
              <span>{roleInfo.label}</span>
            </div>

            {/* Nick & Clan */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-slate-100 font-cinzel tracking-wide truncate max-w-[150px] sm:max-w-none">
                  {player.nickname}
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                  {player.level} lvl
                </span>
                {isMyCard && (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-0.5 shrink-0">
                    <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    <span>{t.yourCardBadge}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                <span className="text-amber-400/80 font-medium truncate">{player.clan}</span>
                <span>·</span>
                <span className="text-emerald-400 font-medium shrink-0">{player.equipGrade}</span>
              </div>
            </div>
          </div>

          {/* Time & Controls (Only owner or admin can delete/refresh) */}
          <div className="flex items-center gap-1 shrink-0">
            <div
              className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5 mr-0.5"
              title="Last updated"
            >
              <Clock className="w-3 h-3 text-slate-600" />
              <span>{timeAgoMinutes}m</span>
            </div>

            {canManage ? (
              <>
                <button
                  onClick={() => onRefresh(player.id)}
                  className="p-1.5 sm:p-2 rounded-lg text-amber-300 hover:bg-slate-800 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title={t.btnExtend}
                  aria-label="Refresh card"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onRemove(player.id)}
                  className="p-1.5 sm:p-2 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title={t.btnDeleteCard}
                  aria-label="Delete card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div
                className="p-1.5 rounded text-slate-600 opacity-60 cursor-not-allowed"
                title={t.notYourCard}
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Standard L2 Class Name & Goal Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
          <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[#181e2b] border border-amber-500/30 text-amber-200 font-bold flex items-center gap-1.5 text-[11px] sm:text-xs">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{l2ClassObj?.nameEn || player.l2Class}</span>
            {player.subClass && (
              <span className="text-slate-400 font-normal truncate"> (Sub: {player.subClass})</span>
            )}
          </div>

          {goalInfo && (
            <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border font-medium text-[10px] sm:text-[11px] border-amber-500/40 text-amber-300 bg-amber-950/30 shrink-0">
              {t[goalInfo.key as keyof typeof t] || player.goal}
            </div>
          )}
        </div>

        {/* Row 3: Notes if present */}
        {player.notes && (
          <div className="text-xs text-slate-300 bg-[#090c12]/80 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400/80 mt-0.5 shrink-0" />
            <p className="leading-relaxed italic break-words">{player.notes}</p>
          </div>
        )}

        {/* Row 4: Action Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Copy Buttons */}
          <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={handleCopyQuoteNick}
              className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-[11px] font-mono font-bold transition-all border flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
                copiedQuote
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-[#181d2a] hover:bg-[#22293b] active:scale-95 border-slate-700/80 text-amber-200'
              }`}
              title="Копировать ник в кавычках для ПМ"
            >
              {copiedQuote ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="truncate max-w-[120px]">&quot;{player.nickname}&quot;</span>
            </button>

            <button
              onClick={handleCopyInviteCmd}
              className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs sm:text-[11px] font-mono font-bold transition-all border flex items-center justify-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
                copiedInvite
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-[#181d2a] hover:bg-[#22293b] active:scale-95 border-slate-700/80 text-purple-200'
              }`}
              title="Копировать /invite команду"
            >
              {copiedInvite ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              <span>/invite</span>
            </button>
          </div>

          {/* Button 3: Take to Party */}
          <button
            onClick={() => onTakeToGroup(player)}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-lg text-xs sm:text-xs font-bold bg-gradient-to-r from-[#aa8222] via-[#c2a363] to-[#8c7241] hover:brightness-110 active:scale-95 text-slate-950 transition-all shadow-md flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[36px]"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.btnTakeToParty}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
