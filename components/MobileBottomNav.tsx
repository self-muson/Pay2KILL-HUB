'use client';

import React from 'react';
import { Users, BookOpen, ScrollText, UserPlus, Crown, Skull } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface MobileBottomNavProps {
  activeTab: 'lfg' | 'kb' | 'rules';
  setActiveTab: (tab: 'lfg' | 'kb' | 'rules') => void;
  currentApp?: 'lfg' | 'boss_tracker';
  onSwitchApp?: (app: 'lfg' | 'boss_tracker') => void;
  activeQueueCount: number;
  activeGroupsCount: number;
  onOpenPlayerForm: () => void;
  onOpenGroupForm: () => void;
  lang: Language;
}

export function MobileBottomNav({
  activeTab,
  setActiveTab,
  currentApp = 'lfg',
  onSwitchApp,
  activeQueueCount,
  activeGroupsCount,
  onOpenPlayerForm,
  onOpenGroupForm,
  lang,
}: MobileBottomNavProps) {
  const t = translations[lang] || translations.ru;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b0e]/95 backdrop-blur-md border-t border-[#c2a363]/30 px-2 py-1 shadow-2xl safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around gap-1 max-w-md mx-auto">
        {/* Tab 1: LFG Queue & Groups */}
        <button
          onClick={() => {
            if (onSwitchApp) onSwitchApp('lfg');
            setActiveTab('lfg');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors relative min-h-[48px] ${
            currentApp === 'lfg' && activeTab === 'lfg'
              ? 'text-amber-300 bg-amber-950/40 border border-amber-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Users className="w-4 h-4" />
            {(activeQueueCount > 0 || activeGroupsCount > 0) && (
              <span className="absolute -top-1.5 -right-3 text-[9px] font-mono font-bold px-1 rounded-full bg-amber-500 text-slate-950">
                {activeQueueCount + activeGroupsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 truncate max-w-full">
            {lang === 'ru' ? 'LFG' : 'Queue'}
          </span>
        </button>

        {/* Tab 2: Boss Tracker (РБ 20–56) */}
        <button
          onClick={() => {
            if (onSwitchApp) onSwitchApp('boss_tracker');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors min-h-[48px] ${
            currentApp === 'boss_tracker'
              ? 'text-red-300 bg-red-950/60 border border-red-500/60 font-bold shadow-[0_0_10px_rgba(239,68,68,0.25)]'
              : 'text-slate-400 hover:text-red-300'
          }`}
        >
          <Skull className="w-4 h-4 text-red-400" />
          <span className="text-[10px] mt-1 truncate max-w-full">
            Боссы
          </span>
        </button>

        {/* Action 1: Fast "+ Заявка" Button (Center highlighted) */}
        <button
          onClick={onOpenPlayerForm}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-lg bg-gradient-to-r from-[#aa8222] via-[#c2a363] to-[#8c7241] text-slate-950 font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[48px]"
          title={t.btnSearchParty}
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span className="text-[10px] tracking-tight leading-none mt-1">
            + {lang === 'ru' ? 'Поиск' : 'LFG'}
          </span>
        </button>

        {/* Action 2: Fast "+ Пати (ПЛ)" Button */}
        <button
          onClick={onOpenGroupForm}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-amber-200 bg-[#161d2b] border border-[#c2a363]/40 hover:bg-[#1f293d] transition-all min-h-[48px]"
          title={t.btnCreateParty}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] mt-1 truncate max-w-full">
            + {lang === 'ru' ? 'Пати' : 'Party'}
          </span>
        </button>

        {/* Tab 3: Knowledge Base / Wiki */}
        <button
          onClick={() => {
            if (onSwitchApp) onSwitchApp('lfg');
            setActiveTab('kb');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-colors min-h-[48px] ${
            currentApp === 'lfg' && activeTab === 'kb'
              ? 'text-purple-300 bg-purple-950/40 border border-purple-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] mt-1 truncate max-w-full">
            {lang === 'ru' ? 'База' : 'Wiki'}
          </span>
        </button>
      </div>
    </nav>
  );
}
