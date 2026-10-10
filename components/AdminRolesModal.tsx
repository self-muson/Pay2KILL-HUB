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
  Clock,
  Swords,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { UserRole, UserPermissions } from '@/lib/user-types';

interface AdminRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

function formatLastActive(timestamp?: number): { text: string; isOnline: boolean } {
  if (!timestamp) return { text: 'Неизвестно', isOnline: false };
  const diff = Date.now() - timestamp;
  if (diff < 5 * 60 * 1000) return { text: 'Онлайн', isOnline: true };
  if (diff < 60 * 60 * 1000) return { text: `${Math.floor(diff / 60000)} мин назад`, isOnline: false };
  if (diff < 24 * 60 * 60 * 1000) return { text: `${Math.floor(diff / 3600000)} ч назад`, isOnline: false };
  return {
    text: new Date(timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    isOnline: false,
  };
}

export function AdminRolesModal({ isOpen, onClose, onShowToast }: AdminRolesModalProps) {
  const { user, allUsers, loadAllUsers, updateUserPermissions, removeUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void loadAllUsers();
    }
  }, [isOpen, loadAllUsers]);

  if (!isOpen) return null;

  const isCurrentUserAdmin = user?.role === 'admin' || Boolean(user?.permissions?.canManageUsers);

  const filteredUsers = allUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.clanName.toLowerCase().includes(q) ||
      (u.discordTag && u.discordTag.toLowerCase().includes(q))
    );
  });

  const handleTogglePermission = async (
    targetUserId: string,
    targetName: string,
    permKey: keyof UserPermissions,
    currentValue: boolean
  ) => {
    setUpdatingId(targetUserId);
    try {
      const ok = await updateUserPermissions(targetUserId, {
        [permKey]: !currentValue,
      });
      if (ok) {
        const permNames: Record<keyof UserPermissions, string> = {
          canManageUsers: 'Права Администратора (КЛ)',
          canEditBosses: 'Редактирование боссов (TOD / респаун)',
          canViewBosses: 'Просмотр таблицы боссов',
          canManageLfg: 'Управление группами LFG',
          canViewLfg: 'Просмотр LFG хаба',
        };
        const actionLabel = !currentValue ? 'выданы' : 'отозваны';
        if (onShowToast) {
          onShowToast(`Права "${permNames[permKey]}" ${actionLabel} для [${targetName}]`);
        }
      } else {
        if (onShowToast) onShowToast('Не удалось обновить права');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0a0d14] border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden font-mono flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0d121c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-serif text-amber-100 uppercase tracking-wide">
                  МОНИТОРИНГ И РАЗДАЧА ПРАВ МЕМБЕРАМ
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600 font-bold">
                  {allUsers.length} пользователей
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Контролируйте активность и отмечайте чекбоксы функций напротив ников участников
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles & Checkbox Legend Bar */}
        <div className="p-3 bg-[#080b12] border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-amber-300">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <b>Админ</b> (КЛ)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-yellow-300">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <b>Редактор Боссов</b> (TOD / таймеры)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-cyan-300">
              <Swords className="w-3.5 h-3.5 text-cyan-400" />
              <b>Управление LFG</b> (Лидер пати)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <b>Просмотр</b> (Доступ к экранам)
            </span>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск мембера по нику..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#05070d] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Column Headers for Table */}
        <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-[#06080e] border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <div className="col-span-5">Участник / Статус / Персонаж</div>
          <div className="col-span-6 text-center">Чекбоксы прав доступа</div>
          <div className="col-span-1 text-right">Действия</div>
        </div>

        {/* Users List with Checkboxes */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Зарегистрированных пользователей не найдено
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isCurrentUser = user?.id === u.id;
              const mainChar = u.characters?.find((c) => c.isMain) || u.characters?.[0];
              const { text: activeText, isOnline } = formatLastActive(u.lastActiveAt);

              const perms: UserPermissions = u.permissions || {
                canViewBosses: true,
                canEditBosses: u.role === 'admin' || u.role === 'scout',
                canViewLfg: true,
                canManageLfg: u.role === 'admin' || u.role === 'scout',
                canManageUsers: u.role === 'admin',
              };

              const isUserUpdating = updatingId === u.id;

              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border flex flex-col md:grid md:grid-cols-12 gap-3 items-center transition-all ${
                    perms.canManageUsers
                      ? 'bg-[#180e11] border-red-900/60'
                      : perms.canEditBosses
                      ? 'bg-[#181308] border-yellow-800/60'
                      : 'bg-[#0b0e17] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: User info & Online status (col-span-5) */}
                  <div className="w-full md:col-span-5 flex items-center gap-3 min-w-0">
                    {/* Status & Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-sm ${
                          perms.canManageUsers
                            ? 'bg-red-950 border-red-500 text-amber-300 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                            : perms.canEditBosses
                            ? 'bg-yellow-950 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                            : 'bg-slate-900 border-slate-700 text-slate-300'
                        }`}
                      >
                        {perms.canManageUsers ? (
                          <Crown className="w-5 h-5 text-amber-400" />
                        ) : perms.canEditBosses ? (
                          <ShieldCheck className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <Users className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      {/* Online dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0d14] ${
                          isOnline
                            ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                            : 'bg-slate-600'
                        }`}
                        title={activeText}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
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
                          {u.clanName || 'Pay2KILL'}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {activeText}
                        </span>
                        {mainChar && (
                          <span className="text-slate-400">
                            • {mainChar.nickname} ({mainChar.approxLevel || mainChar.levelNumber} ур.)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Checkboxes right next to the nickname (col-span-6) */}
                  <div className="w-full md:col-span-6 flex items-center justify-start md:justify-center gap-2 sm:gap-3 flex-wrap bg-[#070910] p-2 rounded-lg border border-slate-800/80">
                    {/* Checkbox 1: Admin */}
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold cursor-pointer select-none transition-all border ${
                        perms.canManageUsers
                          ? 'bg-red-950/80 border-red-500 text-red-200 shadow-sm'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Полный доступ, админ-панель и раздача прав"
                    >
                      <input
                        type="checkbox"
                        disabled={isUserUpdating || !isCurrentUserAdmin || (isCurrentUser && perms.canManageUsers)}
                        checked={perms.canManageUsers}
                        onChange={() =>
                          handleTogglePermission(
                            u.id,
                            u.displayName || u.username,
                            'canManageUsers',
                            perms.canManageUsers
                          )
                        }
                        className="w-3.5 h-3.5 accent-red-500 rounded cursor-pointer"
                      />
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Админ</span>
                    </label>

                    {/* Checkbox 2: Edit Bosses */}
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold cursor-pointer select-none transition-all border ${
                        perms.canEditBosses
                          ? 'bg-yellow-950/80 border-yellow-400 text-yellow-200 shadow-sm'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Право устанавливать TOD (время смерти), респаун боссов и управлять таймерами"
                    >
                      <input
                        type="checkbox"
                        disabled={isUserUpdating || !isCurrentUserAdmin}
                        checked={perms.canEditBosses}
                        onChange={() =>
                          handleTogglePermission(
                            u.id,
                            u.displayName || u.username,
                            'canEditBosses',
                            perms.canEditBosses
                          )
                        }
                        className="w-3.5 h-3.5 accent-yellow-500 rounded cursor-pointer"
                      />
                      <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
                      <span>Таймеры Боссов</span>
                    </label>

                    {/* Checkbox 3: View Bosses */}
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold cursor-pointer select-none transition-all border ${
                        perms.canViewBosses
                          ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Доступ к просмотру таблицы и радара боссов"
                    >
                      <input
                        type="checkbox"
                        disabled={isUserUpdating || !isCurrentUserAdmin}
                        checked={perms.canViewBosses}
                        onChange={() =>
                          handleTogglePermission(
                            u.id,
                            u.displayName || u.username,
                            'canViewBosses',
                            perms.canViewBosses
                          )
                        }
                        className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                      />
                      <Eye className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>Боссы</span>
                    </label>

                    {/* Checkbox 4: Manage LFG */}
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold cursor-pointer select-none transition-all border ${
                        perms.canManageLfg
                          ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Создание, редактирование и роспуск групп в LFG хабе"
                    >
                      <input
                        type="checkbox"
                        disabled={isUserUpdating || !isCurrentUserAdmin}
                        checked={perms.canManageLfg}
                        onChange={() =>
                          handleTogglePermission(
                            u.id,
                            u.displayName || u.username,
                            'canManageLfg',
                            perms.canManageLfg
                          )
                        }
                        className="w-3.5 h-3.5 accent-purple-500 rounded cursor-pointer"
                      />
                      <Swords className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Лидер LFG</span>
                    </label>

                    {/* Checkbox 5: View LFG */}
                    <label
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold cursor-pointer select-none transition-all border ${
                        perms.canViewLfg
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm'
                          : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title="Доступ к просмотру поиска группы и очереди"
                    >
                      <input
                        type="checkbox"
                        disabled={isUserUpdating || !isCurrentUserAdmin}
                        checked={perms.canViewLfg}
                        onChange={() =>
                          handleTogglePermission(
                            u.id,
                            u.displayName || u.username,
                            'canViewLfg',
                            perms.canViewLfg
                          )
                        }
                        className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                      />
                      <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>LFG</span>
                    </label>
                  </div>

                  {/* Right: Actions (col-span-1) */}
                  <div className="w-full md:col-span-1 flex items-center justify-end">
                    {!isCurrentUser && isCurrentUserAdmin && (
                      <button
                        type="button"
                        disabled={deletingId === u.id}
                        onClick={() => handleDeleteUser(u.id, u.displayName || u.username)}
                        className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 hover:text-red-200 transition-colors cursor-pointer"
                        title="Удалить аккаунт мембера"
                      >
                        <Trash2 className="w-4 h-4" />
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
            💡 Отмечайте галочки для выдачи прав. Изменения сохраняются моментально на сервере.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
