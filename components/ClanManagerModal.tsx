'use client';

import React, { useState } from 'react';
import { X, Shield, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { ClanInfo } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface ClanManagerModalProps {
  isOpen: boolean;
  clans: ClanInfo[];
  lang: Language;
  onClose: () => void;
  onAddClan: (name: string) => Promise<void>;
  onDeleteClan: (id: string) => Promise<void>;
}

export function ClanManagerModal({
  isOpen,
  clans,
  lang,
  onClose,
  onAddClan,
  onDeleteClan,
}: ClanManagerModalProps) {
  const t = translations[lang] || translations.ru;
  const [newClanName, setNewClanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onAddClan(newClanName.trim());
      setNewClanName('');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ошибка добавления клана');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-md card-fantasy rounded-t-2xl sm:rounded-xl border border-purple-500/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden safe-area-bottom">
        {/* Mobile handle indicator */}
        <div className="w-10 h-1.5 bg-slate-600/80 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/30 bg-gradient-to-r from-[#1e172a] to-[#121620] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cinzel text-slate-100">
                Кланы Альянса
              </h2>
              <p className="text-[11px] sm:text-xs text-purple-300 font-mono">
                [Режим Администратора]
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

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Add Clan Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newClanName}
              onChange={(e) => setNewClanName(e.target.value)}
              placeholder="Название нового клана..."
              className="flex-1 px-3.5 py-2.5 bg-[#0d1017] border border-purple-500/40 rounded-lg text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 min-h-[44px]"
            />
            <button
              type="submit"
              disabled={loading || !newClanName.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 transition-all shadow flex items-center gap-1 disabled:opacity-50 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </form>

          {error && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Clans List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Текущие кланы альянса ({clans.length}):
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {clans.map((clan) => (
                <div
                  key={clan.id}
                  className="p-3 rounded-lg bg-[#141824] border border-slate-800 flex items-center justify-between text-xs text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span className="font-bold">{clan.name}</span>
                  </div>
                  <button
                    onClick={() => onDeleteClan(clan.id)}
                    className="p-2 rounded text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Удалить клан"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-right pb-1">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors min-h-[44px]"
            >
              {t.btnCancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
