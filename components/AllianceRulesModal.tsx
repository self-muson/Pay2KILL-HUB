'use client';

import React, { useState } from 'react';
import { ScrollText, ShieldCheck, Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import { CharterRule } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface AllianceRulesTabProps {
  lang?: Language;
  isAdmin?: boolean;
  charterRules?: CharterRule[];
  onUpdateRule?: (id: string, title: string, desc: string) => Promise<void>;
  onAddRule?: (title: string, desc: string) => Promise<void>;
  onDeleteRule?: (id: string) => Promise<void>;
}

export function AllianceRulesTab({
  lang = 'ru',
  isAdmin = false,
  charterRules = [],
  onUpdateRule,
  onAddRule,
  onDeleteRule,
}: AllianceRulesTabProps) {
  const t = translations[lang] || translations.ru;

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const startEdit = (rule: CharterRule) => {
    setEditingRuleId(rule.id);
    setEditTitle(rule.title);
    setEditDesc(rule.desc);
  };

  const handleSaveEdit = async (id: string) => {
    if (onUpdateRule && editTitle.trim()) {
      await onUpdateRule(id, editTitle.trim(), editDesc.trim());
      setEditingRuleId(null);
    }
  };

  const handleSaveAdd = async () => {
    if (onAddRule && newTitle.trim()) {
      await onAddRule(newTitle.trim(), newDesc.trim());
      setIsAdding(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="card-fantasy rounded-xl p-4 sm:p-6 border border-[#c2a363]/30 bg-gradient-to-r from-[#181d2a] via-[#121622] to-[#0d1017] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <ScrollText className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold font-cinzel text-slate-100 gold-gradient-text">
              {lang === 'ru' ? 'Устав и Правила Альянса Pay2KILL (Lineage 2)' : `${t.navRules} — Pay2KILL Alliance`}
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'ru'
              ? 'Свод правил взаимодействия членов альянса Pay2KILL, ПЛ-ов и игроков во время сбора 9-man паков, осадах и эпических боссах.'
              : 'Rules and conduct guidelines for Pay2KILL alliance members, party leaders, and players during 9-man party forming, sieges, and epic bosses.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Правило</span>
          </button>
        )}
      </div>

      {/* Add New Rule Form */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-xl border border-purple-500/50 bg-[#161224] space-y-3">
          <div className="font-bold text-sm text-purple-300 flex items-center justify-between">
            <span>+ Добавить новое правило Устава</span>
            <button onClick={() => setIsAdding(false)} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название правила..."
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-100 min-h-[44px]"
          />
          <textarea
            rows={3}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Описание правила Устава..."
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-200"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-xs text-slate-400 min-h-[40px]">
              Отмена
            </button>
            <button
              onClick={handleSaveAdd}
              className="px-4 py-2 bg-purple-700 text-white font-bold text-xs rounded hover:bg-purple-600 flex items-center gap-1 min-h-[40px]"
            >
              <Check className="w-3.5 h-3.5" />
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs">
        {charterRules.map((rule) => (
          <div key={rule.id} className="p-4 sm:p-5 rounded-xl card-fantasy border border-slate-800 space-y-2 relative">
            {editingRuleId === rule.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-amber-500/50 rounded text-base sm:text-xs font-bold text-amber-200 min-h-[44px]"
                />
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-200"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingRuleId(null)} className="px-3 py-2 text-xs text-slate-400 min-h-[40px]">
                    Отмена
                  </button>
                  <button
                    onClick={() => handleSaveEdit(rule.id)}
                    className="px-4 py-2 bg-amber-600 text-slate-950 font-bold text-xs rounded flex items-center gap-1 min-h-[40px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start sm:items-center justify-between font-bold font-cinzel text-xs sm:text-sm text-amber-300 mb-2 gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{rule.num}. {rule.title}</span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(rule)}
                        className="p-1.5 sm:p-2 text-amber-400 hover:bg-slate-800 rounded transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Редактировать правило"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteRule && onDeleteRule(rule.id)}
                        className="p-1.5 sm:p-2 text-red-400 hover:bg-red-950/40 rounded transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Удалить правило"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">{rule.desc}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
