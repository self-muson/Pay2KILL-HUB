'use client';

import React, { useState } from 'react';
import { BookOpen, Shield, Sword, Sparkles, Clock, Edit2, Trash2, Plus, Check, X } from 'lucide-react';
import { KbTopic } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface KnowledgeBaseTabProps {
  lang: Language;
  isAdmin?: boolean;
  kbTopics?: KbTopic[];
  onUpdateTopic?: (id: string, title: string, subtitle: string, content: string) => Promise<void>;
  onAddTopic?: (title: string, subtitle: string, category: 'party_comp' | 'epics' | 'aoe_spots' | 'pl_commands', content: string) => Promise<void>;
  onDeleteTopic?: (id: string) => Promise<void>;
}

export function KnowledgeBaseTab({
  lang,
  isAdmin = false,
  kbTopics = [],
  onUpdateTopic,
  onAddTopic,
  onDeleteTopic,
}: KnowledgeBaseTabProps) {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState<'party_comp' | 'epics' | 'aoe_spots' | 'pl_commands'>('party_comp');

  // Editing state
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const filteredTopics = kbTopics.filter((topic) => topic.category === selectedCategory);

  const startEdit = (topic: KbTopic) => {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
    setEditSubtitle(topic.subtitle);
    setEditContent(topic.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (onUpdateTopic && editTitle.trim()) {
      await onUpdateTopic(id, editTitle.trim(), editSubtitle.trim(), editContent.trim());
      setEditingTopicId(null);
    }
  };

  const handleSaveAdd = async () => {
    if (onAddTopic && newTitle.trim()) {
      await onAddTopic(newTitle.trim(), newSubtitle.trim(), selectedCategory, newContent.trim());
      setIsAdding(false);
      setNewTitle('');
      setNewSubtitle('');
      setNewContent('');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KB Hero Banner */}
      <div className="card-fantasy rounded-xl p-4 sm:p-6 border border-[#c2a363]/30 bg-gradient-to-r from-[#181d2a] via-[#121620] to-[#0d1017] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold font-cinzel text-slate-100 gold-gradient-text">
              {t.navKb} — Pay2KILL Alliance
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Lineage 2 Knowledge Base: 9-man Party setups, Epic Boss respawn timers, AoE trains, and macro commands.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Добавить топик</span>
          </button>
        )}
      </div>

      {/* Category Buttons - 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <button
          onClick={() => setSelectedCategory('party_comp')}
          className={`p-3 sm:p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            selectedCategory === 'party_comp'
              ? 'bg-gradient-to-b from-[#221c12] to-[#141824] border-[#c2a363] text-amber-200 shadow-lg'
              : 'bg-[#0f121a] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold font-cinzel text-xs sm:text-sm text-slate-100 mb-1">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">9-man Party</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">Mage / Archer / Melee CP Formations</p>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] font-mono font-bold text-amber-400 uppercase">
            Setups & Buffs →
          </div>
        </button>

        <button
          onClick={() => setSelectedCategory('epics')}
          className={`p-3 sm:p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            selectedCategory === 'epics'
              ? 'bg-gradient-to-b from-[#221c12] to-[#141824] border-[#c2a363] text-amber-200 shadow-lg'
              : 'bg-[#0f121a] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold font-cinzel text-xs sm:text-sm text-slate-100 mb-1">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">Epic Bosses</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">Baium, Antharas, Valakas, Zaken</p>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] font-mono font-bold text-amber-400 uppercase">
            Timers & Quests →
          </div>
        </button>

        <button
          onClick={() => setSelectedCategory('aoe_spots')}
          className={`p-3 sm:p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            selectedCategory === 'aoe_spots'
              ? 'bg-gradient-to-b from-[#221c12] to-[#141824] border-[#c2a363] text-amber-200 shadow-lg'
              : 'bg-[#0f121a] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold font-cinzel text-xs sm:text-sm text-slate-100 mb-1">
              <Sword className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">AoE Spots</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">Catacombs, IT, FOG, Stakato</p>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] font-mono font-bold text-amber-400 uppercase">
            Spots & Spoil →
          </div>
        </button>

        <button
          onClick={() => setSelectedCategory('pl_commands')}
          className={`p-3 sm:p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            selectedCategory === 'pl_commands'
              ? 'bg-gradient-to-b from-[#221c12] to-[#141824] border-[#c2a363] text-amber-200 shadow-lg'
              : 'bg-[#0f121a] border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 font-bold font-cinzel text-xs sm:text-sm text-slate-100 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">PL Macros</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2">In-game party & CC invite macros</p>
          </div>
          <div className="mt-2 sm:mt-3 text-[10px] font-mono font-bold text-amber-400 uppercase">
            L2 Macros →
          </div>
        </button>
      </div>

      {/* Add New Topic Modal / Inline Box if Admin */}
      {isAdding && (
        <div className="p-4 sm:p-5 rounded-xl border border-purple-500/50 bg-[#161224] space-y-3">
          <div className="font-bold text-sm text-purple-300 flex items-center justify-between">
            <span>+ Новый Топик в категории [{selectedCategory}]</span>
            <button onClick={() => setIsAdding(false)} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Заголовок..."
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-100 min-h-[44px]"
          />
          <input
            type="text"
            value={newSubtitle}
            onChange={(e) => setNewSubtitle(e.target.value)}
            placeholder="Подзаголовок..."
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-300 min-h-[44px]"
          />
          <textarea
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Текст статьи или гайда..."
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-200 font-mono"
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

      {/* Topic Content Cards */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => (
          <div key={topic.id} className="card-fantasy rounded-xl p-4 sm:p-6 border border-[#c2a363]/30 bg-[#0e111a] space-y-3">
            {editingTopicId === topic.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-amber-500/50 rounded text-base sm:text-sm font-bold text-amber-200 min-h-[44px]"
                />
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-300 min-h-[44px]"
                />
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-700 rounded text-base sm:text-xs text-slate-200 font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingTopicId(null)} className="px-3 py-2 text-xs text-slate-400 min-h-[40px]">
                    Отмена
                  </button>
                  <button
                    onClick={() => handleSaveEdit(topic.id)}
                    className="px-4 py-2 bg-amber-600 text-slate-950 font-bold text-xs rounded flex items-center gap-1 min-h-[40px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start sm:items-center justify-between border-b border-slate-800 pb-2 mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold font-cinzel text-amber-300">
                      {topic.title}
                    </h3>
                    {topic.subtitle && (
                      <p className="text-xs text-slate-400 italic">{topic.subtitle}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(topic)}
                        className="p-2 text-amber-400 hover:bg-slate-800 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Редактировать топик"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTopic && onDeleteTopic(topic.id)}
                        className="p-2 text-red-400 hover:bg-red-950/40 rounded transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Удалить топик"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line bg-[#080b12] p-3 sm:p-4 rounded-lg border border-slate-800/80 overflow-x-auto">
                  {topic.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
