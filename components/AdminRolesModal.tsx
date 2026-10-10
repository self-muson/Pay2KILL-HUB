'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  Shield,
  Crown,
  Eye,
  ShieldCheck,
  Search,
  Check,
  Trash2,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { UserRole } from '@/lib/user-store';

interface AdminRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function AdminRolesModal({ isOpen, onClose, onShowToast }: AdminRolesModalProps) {
  const { user, allUsers, loadAllUsers, changeUserRole, removeUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadAllUsers();
    }
  }, [isOpen, loadAllUsers]);

  if (!isOpen) return null;

  const isCurrentUserAdmin = user?.role === 'admin';

  const filteredUsers = allUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.clanName.toLowerCase().includes(q) ||
      (u.discordTag && u.discordTag.toLowerCase().includes(q))
    );
  });

  const handleRoleChange = async (targetUserId: string, targetName: string, newRole: UserRole) => {
    setUpdatingId(targetUserId);
    try {
      const ok = await changeUserRole(targetUserId, newRole);
      if (ok) {
        const roleLabel =
          newRole === 'admin' ? 'Лидер Клана (КЛ)' : newRole === 'scout' ? 'Скаут / РЛ' : 'Наблюдатель (Мембер)';
        if (onShowToast) onShowToast(`Роль пользователя [${targetName}] изменена на: ${roleLabel}`);
      } else {
        if (onShowToast) onShowToast('Не удалось изменить роль пользователя');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (targetUserId: string, targetName: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить аккаунт мембера "${targetName}"?`)) {
      return;
    }
    setDeletingId(targetUserId);
    try {
      const ok = await removeUser(targetUserId);
      if (ok) {
        if (onShowToast) onShowToast(`Пользователь [${targetName}] удален`);
      } else {
        if (onShowToast) onShowToast('Не удалось удалить пользователя');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0a0d14] border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-serif text-amber-100 uppercase tracking-wide">
                  УПРАВЛЕНИЕ РОЛЯМИ И КЛАНОМ
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                  {allUsers.length} мемберов
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Раздача прав доступа и ролей для зарегистрированных пользователей
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Roles Legend / Info Bar */}
        <div className="p-3 bg-[#080b12] border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-red-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <b>КЛ:</b> Полный доступ + управление ролями
            </span>
            <span className="flex items-center gap-1 text-[11px] text-yellow-300">
              <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
              <b>Скаут:</b> Камеры, логины, выставление TOD
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <b>Мембер:</b> Просмотр таймеров и спотов
            </span>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск мембера..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#05070d] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Users List Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Зарегистрированных пользователей не найдено
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isCurrentUser = user?.id === u.id;
              const charsCount = u.characters?.length || 0;
              const mainChar = u.characters?.find((c) => c.isMain) || u.characters?.[0];

              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    u.role === 'admin'
                      ? 'bg-[#180e11] border-red-900/60'
                      : u.role === 'scout'
                      ? 'bg-[#181308] border-yellow-800/60'
                      : 'bg-[#0b0e17] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: User info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        u.role === 'admin'
                          ? 'bg-red-950 border-red-500 text-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : u.role === 'scout'
                          ? 'bg-yellow-950 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {u.role === 'admin' ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : u.role === 'scout' ? (
                        <ShieldCheck className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-100 truncate">
                          {u.displayName || u.username}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          (@{u.username})
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
                            Вы
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap pt-0.5">
                        <span className="text-amber-400/90 font-bold">
                          Клан: {u.clanName || 'Pay2KILL'}
                        </span>
                        {u.discordTag && (
                          <span className="text-slate-400">
                            DC: {u.discordTag}
                          </span>
                        )}
                        <span className="text-slate-500">
                          Персонажей: <b className="text-slate-300">{charsCount}</b>
                          {mainChar && ` (Мейн: ${mainChar.nickname})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Role Dropdown & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-slate-400 hidden xs:inline">
                        Роль:
                      </label>
                      <select
                        disabled={updatingId === u.id || !isCurrentUserAdmin}
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, u.displayName || u.username, e.target.value as UserRole)
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono border focus:outline-none cursor-pointer transition-colors ${
                          u.role === 'admin'
                            ? 'bg-red-950/90 border-red-500 text-amber-200'
                            : u.role === 'scout'
                            ? 'bg-yellow-950/90 border-yellow-400 text-yellow-200'
                            : 'bg-[#070910] border-slate-700 text-slate-300'
                        }`}
                      >
                        <option value="member">👁️ Наблюдатель (Мембер)</option>
                        <option value="scout">🛡️ Скаут / Рейд Лидер</option>
                        <option value="admin">👑 Лидер Клана (КЛ)</option>
                      </select>
                    </div>

                    {!isCurrentUser && isCurrentUserAdmin && (
                      <button
                        type="button"
                        disabled={deletingId === u.id}
                        onClick={() => handleDeleteUser(u.id, u.displayName || u.username)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
                        title="Удалить аккаунт пользователя"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#070910] flex items-center justify-between text-xs text-slate-400">
          <span>
            Изменение роли вступает в силу сразу на сервере и синхронизируется у всех участников.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
