'use client';

import React, { useState } from 'react';
import {
  X,
  Video,
  Plus,
  Copy,
  Check,
  Lock,
  User,
  Shield,
  Trash2,
  FolderPlus,
  Key,
  Users,
  CheckCircle,
  Edit2,
  AlertTriangle,
  Folder,
  ChevronDown,
} from 'lucide-react';
import { useBossTrackerStore } from '@/lib/boss-tracker-store';
import {
  CAMERA_ACCOUNTS,
  CameraAccount,
  findAccountByCamCode,
} from '@/lib/camera-accounts-data';
import { CameraAccountCharacter } from '@/lib/boss-tracker-types';
import { useL2SpotStore } from '@/lib/l2-spot-store';

interface CameraAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export function CameraAccountsModal({
  isOpen,
  onClose,
  onShowToast,
}: CameraAccountsModalProps) {
  const {
    role,
    customAccounts,
    addCustomAccount,
    deleteCustomAccount,
    deleteAuthorGroup,
    updateCustomAccount,
    accountOccupancies,
    occupyAccount,
    releaseAccount,
    bosses,
  } = useBossTrackerStore();

  const isScoutOrAdmin = role === 'scout' || role === 'admin';

  const { characters, activeCharacterId } = useL2SpotStore();
  const activeChar =
    characters.find((c) => c.id === activeCharacterId) ||
    characters.find((c) => c.isMain) ||
    characters[0];

  // Tab for active author group filter: 'ALL' or group name
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('ALL');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);

  // Group deletion confirmation
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  // Form state
  const [authorGroupInput, setAuthorGroupInput] = useState('Qox');
  const [isCustomGroup, setIsCustomGroup] = useState(false);
  const [customGroupNameInput, setCustomGroupNameInput] = useState('');
  const [accountNameInput, setAccountNameInput] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [charRows, setCharRows] = useState<
    { id: string; characterName: string; bossId: string; camCode: string }[]
  >([{ id: 'c1', characterName: '', bossId: bosses[0]?.id || 'ferkel_20', camCode: '' }]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !isScoutOrAdmin) return null;

  // Combine default accounts with custom accounts
  const allAccounts: CameraAccount[] = [...CAMERA_ACCOUNTS, ...customAccounts];

  // Get unique author groups
  const authorGroups = Array.from(
    new Set(allAccounts.map((a) => a.authorGroup || 'Qox'))
  );

  const displayedAccounts =
    selectedGroupTab === 'ALL'
      ? allAccounts
      : allAccounts.filter((a) => (a.authorGroup || 'Qox') === selectedGroupTab);

  const handleCopy = (text: string, key: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (onShowToast) onShowToast(`${label} скопирован в буфер: ${text}`);
    }
  };

  const handleCopyLogin = (acc: CameraAccount) => {
    handleCopy(acc.login, `login_${acc.groupId}`, 'Логин');
    const userChar = activeChar || {
      nickname: role === 'admin' ? 'КЛ (Админ)' : 'Скаут',
      className: 'Watcher',
      levelNumber: 75,
      clanName: 'Pay2KILL',
    };
    occupyAccount(acc.groupId, acc.camCodes?.[0] || 'cam', {
      nickname: userChar.nickname,
      className: userChar.className,
      level: userChar.levelNumber || 75,
      clanName: userChar.clanName || 'Pay2KILL',
    });
  };

  const handleStartAddNew = (prefillGroup?: string) => {
    setIsAddingNew(true);
    setEditingAccountId(null);
    const grp = prefillGroup && prefillGroup !== 'ALL' ? prefillGroup : (selectedGroupTab !== 'ALL' ? selectedGroupTab : 'Qox');
    setAuthorGroupInput(grp);
    setIsCustomGroup(false);
    setCustomGroupNameInput('');
    setAccountNameInput('');
    setLoginInput('');
    setPasswordInput('');
    setCharRows([
      { id: `c_${Date.now()}_1`, characterName: '', bossId: bosses[0]?.id || 'ferkel_20', camCode: '' },
    ]);
  };

  const handleStartEdit = (acc: CameraAccount) => {
    setIsAddingNew(false);
    setEditingAccountId(acc.groupId);
    setAuthorGroupInput(acc.authorGroup || 'Qox');
    setIsCustomGroup(!authorGroups.includes(acc.authorGroup));
    setCustomGroupNameInput(acc.authorGroup || '');
    setAccountNameInput(acc.groupName || '');
    setLoginInput(acc.login || '');
    setPasswordInput(acc.password || '');

    if (acc.characters && acc.characters.length > 0) {
      setCharRows(
        acc.characters.map((c, i) => ({
          id: c.id || `c_${Date.now()}_${i}`,
          characterName: c.characterName || '',
          bossId: c.bossId || bosses[0]?.id || '',
          camCode: c.camCode || '',
        }))
      );
    } else {
      setCharRows([
        { id: `c_${Date.now()}_1`, characterName: '', bossId: bosses[0]?.id || 'ferkel_20', camCode: '' },
      ]);
    }
  };

  const handleAddCharacterRow = () => {
    setCharRows((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}_${Math.random()}`,
        characterName: '',
        bossId: bosses[0]?.id || 'ferkel_20',
        camCode: '',
      },
    ]);
  };

  const handleRemoveCharacterRow = (idx: number) => {
    if (charRows.length <= 1) return;
    setCharRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) return;

    const finalGroup = isCustomGroup
      ? customGroupNameInput.trim() || 'Custom'
      : authorGroupInput.trim() || 'Qox';

    const validChars: CameraAccountCharacter[] = charRows
      .filter((c) => c.characterName.trim())
      .map((c) => {
        const foundBoss = bosses.find((b) => b.id === c.bossId);
        return {
          id: c.id,
          characterName: c.characterName.trim(),
          bossId: c.bossId,
          bossName: foundBoss?.name,
          camCode: c.camCode.trim() || foundBoss?.camCode || '',
        };
      });

    if (editingAccountId !== null) {
      // Update existing account
      updateCustomAccount(editingAccountId, {
        authorGroup: finalGroup,
        groupName: accountNameInput.trim() || `Аккаунт #${editingAccountId}`,
        login: loginInput.trim(),
        password: passwordInput.trim(),
        characters: validChars,
        description: `${finalGroup}: ${validChars.map((c) => c.characterName).join(', ')}`,
      });
      if (onShowToast) onShowToast(`Аккаунт [${accountNameInput || loginInput}] успешно обновлен!`);
      setEditingAccountId(null);
    } else {
      // Add new account
      addCustomAccount({
        authorGroup: finalGroup,
        groupName: accountNameInput.trim() || `Аккаунт #${allAccounts.length + 1}`,
        login: loginInput.trim(),
        password: passwordInput.trim(),
        characters: validChars,
      });
      if (onShowToast) onShowToast(`Новый аккаунт в группе [${finalGroup}] успешно добавлен!`);
      setIsAddingNew(false);
    }
  };

  const handleConfirmDeleteAccount = (groupId: number) => {
    deleteCustomAccount(groupId);
    setAccountToDelete(null);
    if (onShowToast) onShowToast('Аккаунт успешно удален');
  };

  const handleConfirmDeleteGroup = (groupName: string) => {
    deleteAuthorGroup(groupName);
    setGroupToDelete(null);
    setSelectedGroupTab('ALL');
    if (onShowToast) onShowToast(`Группа [${groupName}] и все её аккаунты удалены`);
  };

  const handleOccupyAccount = (acc: CameraAccount) => {
    const userChar = activeChar || {
      nickname: 'Scout_Me',
      className: 'Silver Ranger',
      levelNumber: 75,
      clanName: 'Pay2KILL',
    };

    const firstCam =
      (acc.characters && acc.characters[0]?.camCode) ||
      acc.camCodes[0] ||
      'cam';

    occupyAccount(acc.groupId, firstCam, {
      nickname: userChar.nickname,
      className: userChar.className,
      level: userChar.levelNumber || 75,
      clanName: userChar.clanName || 'Pay2KILL',
    });

    handleCopy(acc.login, `login_${acc.groupId}`, 'Логин');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans">
      <div className="w-full max-w-4xl bg-[#0a0d14] border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#0c1420] via-[#142033] to-[#0c1420] border-b border-cyan-500/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/80 flex items-center justify-center text-cyan-300 shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-cyan-100 uppercase tracking-wider flex items-center gap-2">
                <span>ОБЩИЕ АККАУНТЫ КАМЕР НАБЛЮДАТЕЛЕЙ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-cyan-300">
                  {allAccounts.length} АКК
                </span>
              </h3>
              <p className="text-[11px] text-cyan-300/80 font-mono">
                Управление группами палилок, логинами и расстановкой персонажей на спотах
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isScoutOrAdmin && !isAddingNew && editingAccountId === null && (
              <button
                type="button"
                onClick={() => handleStartAddNew()}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Добавить аккаунт / группу</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Group Filter Tabs & Group Actions */}
        {!isAddingNew && editingAccountId === null && (
          <div className="px-4 py-2.5 bg-[#080b11] border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase mr-1 shrink-0">
                Группы палилок:
              </span>
              <button
                type="button"
                onClick={() => setSelectedGroupTab('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  selectedGroupTab === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Все ({allAccounts.length})
              </button>
              {authorGroups.map((grp) => {
                const count = allAccounts.filter(
                  (a) => (a.authorGroup || 'Qox') === grp
                ).length;
                return (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setSelectedGroupTab(grp)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      selectedGroupTab === grp
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    <span>📁 {grp}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Delete Group button if a specific group tab is selected and user is Scout/Admin */}
            {isScoutOrAdmin && selectedGroupTab !== 'ALL' && (
              <button
                type="button"
                onClick={() => setGroupToDelete(selectedGroupTab)}
                className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-300 font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                title={`Удалить группу [${selectedGroupTab}] и все её аккаунты`}
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Удалить группу [{selectedGroupTab}]</span>
              </button>
            )}
          </div>
        )}

        {/* Group Delete Confirmation Modal */}
        {groupToDelete && (
          <div className="p-4 bg-red-950/90 border-b border-red-500 flex items-center justify-between gap-3 text-xs font-mono text-red-100 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>
                Вы действительно хотите удалить группу <b>[{groupToDelete}]</b> и все входящие в неё аккаунты?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleConfirmDeleteGroup(groupToDelete)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Да, удалить
              </button>
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Account Delete Confirmation Modal */}
        {accountToDelete !== null && (
          <div className="p-4 bg-red-950/90 border-b border-red-500 flex items-center justify-between gap-3 text-xs font-mono text-red-100 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>
                Удалить этот аккаунт камеры и всех закрепленных персонажей?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleConfirmDeleteAccount(accountToDelete)}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
              >
                Удалить
              </button>
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 font-sans">
          {/* ADD / EDIT ACCOUNT FORM */}
          {isAddingNew || editingAccountId !== null ? (
            <form
              onSubmit={handleSaveAccount}
              className="p-4 rounded-xl bg-[#0f1522] border-2 border-cyan-500/70 space-y-4 text-xs font-sans animate-fade-in shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-cyan-400" />
                  <h4 className="font-bold text-sm text-cyan-200 uppercase font-serif">
                    {editingAccountId !== null ? 'Редактирование аккаунта и палилок' : 'Добавление нового аккаунта и палилок'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingAccountId(null);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Author Group Selection / Custom Group */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold text-[11px]">
                    ГРУППА АККАУНТОВ (ПАЛИЛОК): <span className="text-red-400">*</span>
                  </label>
                  {!isCustomGroup ? (
                    <div className="flex gap-1.5">
                      <select
                        value={authorGroupInput}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            setIsCustomGroup(true);
                            setCustomGroupNameInput('');
                          } else {
                            setAuthorGroupInput(e.target.value);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-cyan-300 font-mono font-bold text-xs focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {authorGroups.map((grp) => (
                          <option key={grp} value={grp}>
                            📁 {grp}
                          </option>
                        ))}
                        <option value="__NEW__">+ Создать новую группу...</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomGroup(true);
                          setCustomGroupNameInput('');
                        }}
                        className="px-2.5 py-2 rounded-lg bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold text-[10px] hover:bg-cyan-900 cursor-pointer"
                        title="Создать новую группу"
                      >
                        + Новая
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={customGroupNameInput}
                        onChange={(e) => setCustomGroupNameInput(e.target.value)}
                        placeholder="Название новой группы (напр. Кекс, Кокс, Sniper)"
                        className="flex-1 px-3 py-2 bg-[#06080e] border border-cyan-400 rounded-lg text-amber-300 font-mono font-bold text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomGroup(false)}
                        className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] hover:bg-slate-700 cursor-pointer"
                      >
                        Отмена
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Выберите существующую группу или создайте новую для группировки палилок.
                  </p>
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold text-[11px]">
                    НАЗВАНИЕ АККАУНТА:
                  </label>
                  <input
                    type="text"
                    value={accountNameInput}
                    onChange={(e) => setAccountNameInput(e.target.value)}
                    placeholder={`Например: Аккаунт #${allAccounts.length + 1} или Палилки 20-35`}
                    className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Login */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold text-[11px]">
                    ЛОГИН АККАУНТА: <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Логин для входа в игру"
                    className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-amber-300 font-mono font-bold text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-slate-300 font-bold text-[11px]">
                    ПАРОЛЬ АККАУНТА: <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Пароль от аккаунта"
                    className="w-full px-3 py-2 bg-[#06080e] border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Characters Section (Палилки на спотах с боссами) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ПЕРСОНАЖИ (ПАЛИЛКИ) НА СПОТАХ С БОССАМИ:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCharacterRow}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/70 text-cyan-200 text-xs font-bold font-mono hover:bg-cyan-900 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Добавить персонажа</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5 scrollbar-thin">
                  {charRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="p-2.5 rounded-lg bg-[#07090f] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      {/* Character Nickname */}
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          Имя персонажа (никнейм):
                        </span>
                        <input
                          type="text"
                          required
                          value={row.characterName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCharRows((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, characterName: val } : c
                              )
                            );
                          }}
                          placeholder="Например: FerkelCam или КрасивыйНик"
                          className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-slate-700 rounded text-xs font-mono font-bold text-amber-200 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {/* Boss Selection */}
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          Рейд-босс на споте:
                        </span>
                        <select
                          value={row.bossId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCharRows((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, bossId: val } : c
                              )
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#0f1420] border border-slate-700 rounded text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                          {bosses.map((b) => (
                            <option key={b.id} value={b.id}>
                              [{b.level} ур.] {b.name} {b.camCode ? `(${b.camCode})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Optional Cam Code */}
                      <div className="w-24 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Код камеры:
                        </span>
                        <input
                          type="text"
                          value={row.camCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCharRows((prev) =>
                              prev.map((c, i) =>
                                i === idx ? { ...c, camCode: val } : c
                              )
                            );
                          }}
                          placeholder="cam..."
                          className="w-full px-2 py-1.5 bg-[#0f1420] border border-slate-700 rounded text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      {charRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCharacterRow(idx)}
                          className="p-2 text-slate-500 hover:text-red-400 self-end sm:self-center cursor-pointer"
                          title="Удалить эту строку"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 text-white font-bold font-serif uppercase tracking-wider text-xs shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {editingAccountId !== null
                      ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ АККАУНТА'
                      : 'СОХРАНИТЬ НОВЫЙ АККАУНТ И ПЕРСОНАЖЕЙ'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingAccountId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : null}

          {/* ACCOUNTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
            {displayedAccounts.map((acc) => {
              const occ = accountOccupancies[acc.groupId];
              const isOccupied = !!occ;

              return (
                <div
                  key={acc.groupId}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all shadow-md ${
                    isOccupied
                      ? 'bg-[#180b0e] border-red-500/70 shadow-lg ring-1 ring-red-500/40'
                      : 'bg-[#0e131d] border-slate-700/80 hover:border-cyan-500/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top Group / Status Header */}
                    <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase truncate flex items-center gap-1">
                          <Folder className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>Группа: {acc.authorGroup || 'Qox'}</span>
                        </div>
                        <div className="font-bold text-slate-100 text-xs truncate">
                          {acc.groupName}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isOccupied ? (
                          <span className="text-[9px] text-red-300 font-bold bg-red-950 px-1.5 py-0.5 rounded border border-red-600">
                            🔴 ЗАНЯТ
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600/50">
                            🟢 СВОБОДЕН
                          </span>
                        )}

                        {/* Edit & Delete icons for Scout/Admin */}
                        {isScoutOrAdmin && (
                          <div className="flex items-center gap-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(acc)}
                              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Редактировать аккаунт и персонажей"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAccountToDelete(acc.groupId)}
                              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Удалить аккаунт"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Occupied Banner if in use */}
                    {isOccupied && (
                      <div className="p-2 rounded-lg bg-black/50 border border-red-800/80 space-y-0.5">
                        <div className="text-[11px] font-bold text-red-100 flex items-center justify-between">
                          <span className="truncate">{occ.occupiedBy.nickname}</span>
                          <span className="text-amber-300 font-mono text-[10px] font-black bg-red-950 px-1.5 rounded border border-red-600">
                            {occ.activeCamCode}
                          </span>
                        </div>
                        <div className="text-[9px] text-red-300/80 font-mono truncate">
                          {occ.occupiedBy.className} ({occ.occupiedBy.level} ур.)
                        </div>
                      </div>
                    )}

                    {/* Associated Characters / Bosses */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans font-bold flex items-center justify-between">
                        <span>Персонажи на спотах с боссами:</span>
                        <span className="text-[9px] text-cyan-400 font-mono font-normal">
                          {acc.characters?.length || 0} палилок
                        </span>
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
                        {acc.characters && acc.characters.length > 0 ? (
                          acc.characters.map((ch) => (
                            <div
                              key={ch.id}
                              className={`px-2 py-1 rounded text-[10px] flex items-center justify-between gap-1 transition-colors ${
                                isOccupied
                                  ? 'bg-red-950/50 border border-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                  : 'bg-[#07090f] border border-slate-800'
                              }`}
                            >
                              <span
                                className={`font-bold truncate max-w-[120px] flex items-center gap-1.5 ${
                                  isOccupied ? 'text-red-200' : 'text-amber-300'
                                }`}
                                title={ch.characterName}
                              >
                                <span>👤 {ch.characterName}</span>
                                {isOccupied && (
                                  <span className="text-[8px] bg-red-600 text-white font-mono px-1 py-0.5 rounded font-black tracking-wide">
                                    ЗАНЯТ
                                  </span>
                                )}
                              </span>
                              <span
                                className={`truncate max-w-[110px] text-right ${
                                  isOccupied ? 'text-red-300/80' : 'text-slate-400'
                                }`}
                                title={ch.bossName || ch.bossId}
                              >
                                {ch.bossName || ch.bossId}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {acc.description || acc.camCodes.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Login & Password Badges */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between p-1.5 rounded bg-[#06080e] border border-slate-800 text-[11px]">
                        <span className="text-[10px] text-slate-400 font-sans">
                          Логин:
                        </span>
                        <span className="font-bold text-amber-300 select-all truncate max-w-[120px]">
                          {acc.login}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLogin(acc)}
                          className="text-amber-400 hover:text-white p-1 cursor-pointer"
                          title="Скопировать логин и занять аккаунт"
                        >
                          {copiedKey === `login_${acc.groupId}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded bg-[#06080e] border border-slate-800 text-[11px]">
                        <span className="text-[10px] text-slate-400 font-sans">
                          Пароль:
                        </span>
                        <span className="text-slate-300 select-all truncate max-w-[120px]">
                          {acc.password}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              acc.password,
                              `pass_${acc.groupId}`,
                              'Пароль'
                            )
                          }
                          className="text-amber-400 hover:text-white p-1 cursor-pointer"
                          title="Скопировать пароль"
                        >
                          {copiedKey === `pass_${acc.groupId}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isOccupied ? (
                      <button
                        type="button"
                        onClick={() => releaseAccount(acc.groupId)}
                        className="w-full py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/80 text-red-200 text-xs font-bold font-sans transition-colors cursor-pointer"
                      >
                        Освободить аккаунт
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOccupyAccount(acc)}
                        className="w-full py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 text-xs font-bold font-sans transition-colors cursor-pointer"
                      >
                        Занять аккаунт
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
