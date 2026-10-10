'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Cloud,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText,
  FileCode,
  Check,
  AlertCircle,
  LogOut,
  ExternalLink,
  Skull,
  Link,
  Clock,
} from 'lucide-react';
import { useL2SpotStore } from '@/lib/l2-spot-store';
import { googleSignIn, logoutGoogle } from '@/lib/firebase-auth';
import { listDriveFiles, DriveFileItem } from '@/lib/google-drive';

interface L2GoogleDriveModalProps {
  onClose: () => void;
}

export function L2GoogleDriveModal({ onClose }: L2GoogleDriveModalProps) {
  const {
    bosses,
    isDriveConnected,
    driveUserEmail,
    setDriveStatus,
    syncFromDriveFile,
    syncFromSpreadsheetUrl,
    setBossTimeOfDeath,
    isSyncingDrive,
    lastDriveSyncTime,
    driveSyncMessage,
    clearDriveSyncMessage,
  } = useL2SpotStore();

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Direct sheet URL state
  const [sheetUrl, setSheetUrl] = useState('');
  const [isSyncingUrl, setIsSyncingUrl] = useState(false);

  // Load files when connected
  const loadFiles = async (query?: string) => {
    setLoadingFiles(true);
    setErrorMessage(null);
    try {
      const fileList = await listDriveFiles(query);
      setFiles(fileList);
      if (fileList.length > 0 && !selectedFileId) {
        setSelectedFileId(fileList[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось получить файлы с Google Диска';
      setErrorMessage(msg);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isDriveConnected) {
      listDriveFiles().then(
        (fileList) => {
          if (!isMounted) return;
          setFiles(fileList);
          if (fileList.length > 0) {
            setSelectedFileId(fileList[0].id);
          }
        },
        (err: unknown) => {
          if (!isMounted) return;
          const msg = err instanceof Error ? err.message : 'Не удалось получить файлы с Google Диска';
          setErrorMessage(msg);
        }
      );
    }
    return () => {
      isMounted = false;
    };
  }, [isDriveConnected]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveStatus(true, result.user.email);
        await loadFiles();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации Google';
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setDriveStatus(false, null);
    setFiles([]);
    setSelectedFileId(null);
  };

  const handleSyncSelected = async (file: DriveFileItem) => {
    setSelectedFileId(file.id);
    await syncFromDriveFile(file.id, file.mimeType);
  };

  const handleSyncUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setIsSyncingUrl(true);
    setErrorMessage(null);
    try {
      await syncFromSpreadsheetUrl(sheetUrl.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки по ссылке';
      setErrorMessage(msg);
    } finally {
      setIsSyncingUrl(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    }
    if (mimeType.includes('json') || mimeType.includes('code')) {
      return <FileCode className="w-4 h-4 text-amber-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-[#0f131a] border-2 border-[#c2a363]/70 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans select-none max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#1c1813] via-[#2a2217] to-[#1c1813] border-b border-[#c2a363]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b2d18] border border-[#c2a363] flex items-center justify-center text-amber-300 shadow-md">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-amber-100 uppercase tracking-wider">
                СИНХРОНИЗАЦИЯ С ТАБЛИЦЕЙ НА ДИСКЕ (ВРЕМЯ СМЕРТИ / TOD)
              </h3>
              <p className="text-xs text-[#c2a363] font-mono">
                Импорт актуального времени смерти боссов и автоматический расчет респауна
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearDriveSyncMessage();
              onClose();
            }}
            className="p-1 rounded text-amber-300/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 font-mono text-xs">
          {/* Status Banner */}
          {driveSyncMessage && (
            <div
              className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                driveSyncMessage.startsWith('Ошибка')
                  ? 'bg-red-950/70 border-red-500 text-red-200'
                  : 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md'
              }`}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{driveSyncMessage}</span>
              </div>
              <button onClick={clearDriveSyncMessage} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-500/80 rounded-lg text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Direct Google Sheet Link / ID input option */}
          <div className="bg-[#141924] p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
              <Link className="w-3.5 h-3.5 text-amber-400" />
              <span>ПРЯМОЙ ИМПОРТ ПО ССЫЛКЕ НА GOOGLE ТАБЛИЦУ:</span>
            </div>

            <form onSubmit={handleSyncUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Вставьте ссылку на Google Таблицу (https://docs.google.com/spreadsheets/d/...)"
                className="flex-1 px-3 py-2 bg-[#090b0e] border border-slate-700 rounded text-amber-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-xs"
              />
              <button
                type="submit"
                disabled={isSyncingUrl || !sheetUrl.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-xs uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSyncingUrl ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>ЗАГРУЗКА...</span>
                  </>
                ) : (
                  <>
                    <Skull className="w-3.5 h-3.5 text-slate-950" />
                    <span>ЗАГРУЗИТЬ ВРЕМЯ СМЕРТИ</span>
                  </>
                )}
              </button>
            </form>
            <p className="text-[10px] text-slate-500">
              Таблица должна содержать столбцы с именем босса и временем смерти (например, «Revenant of Sir Calibus, 14:20»).
            </p>
          </div>

          {/* Connection state for Google Drive files */}
          {!isDriveConnected ? (
            <div className="bg-[#141822] p-5 rounded-xl border border-slate-800 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-[#c2a363]/40 flex items-center justify-center text-amber-300">
                <Cloud className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <h4 className="text-xs font-serif font-bold text-amber-100 mb-0.5">
                  Или выберите файл прямо из вашего Google Диска
                </h4>
                <p className="text-[11px] text-slate-400 font-sans">
                  Авторизуйтесь в Google для просмотра списка ваших таблиц и файлов на Диске.
                </p>
              </div>

              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-sans font-medium text-xs shadow-lg transition-all flex items-center gap-2 border border-slate-300 active:scale-95 disabled:opacity-50"
              >
                <span>{isSigningIn ? 'ВХОД В GOOGLE...' : 'ВЫБРАТЬ ИЗ GOOGLE ДИСКА'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 bg-[#121622] p-3.5 rounded-xl border border-slate-800">
              {/* Account summary bar */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400">ДИСК: </span>
                  <span className="text-amber-300 font-bold">{driveUserEmail}</span>
                </div>

                <div className="flex items-center gap-2">
                  {lastDriveSyncTime && (
                    <span className="text-[10px] text-slate-400">
                      Синхронизировано: {lastDriveSyncTime}
                    </span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="p-1 rounded bg-slate-900 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 transition-colors"
                    title="Отключить аккаунт Google"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Search drive files */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-amber-400/70 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadFiles(searchTerm)}
                    placeholder="Поиск таблицы респауна боссов..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#090b0e] border border-slate-700 rounded text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={() => loadFiles(searchTerm)}
                  disabled={loadingFiles}
                  className="px-3 py-1.5 bg-[#1b2230] hover:bg-[#253045] border border-slate-700 rounded text-xs text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>НАЙТИ</span>
                </button>
              </div>

              {/* Files List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {loadingFiles ? (
                  <div className="text-center py-6 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Загрузка файлов из Google Диска...
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 bg-[#0c0f14] rounded border border-slate-800 text-[11px]">
                    Файлы не найдены.
                  </div>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        selectedFileId === file.id
                          ? 'bg-[#1b2333] border-[#c2a363] text-amber-100'
                          : 'bg-[#111620] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(file.mimeType)}
                        <div className="truncate">
                          <span className="font-bold block truncate text-xs">{file.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString()
                              : ''}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSyncSelected(file)}
                        disabled={isSyncingDrive}
                        className="px-3 py-1 bg-gradient-to-r from-[#94773c] via-[#c2a363] to-[#94773c] hover:brightness-110 text-slate-950 font-serif font-black rounded text-[10px] uppercase tracking-wider transition-all shrink-0 flex items-center gap-1 shadow-md disabled:opacity-50"
                      >
                        {isSyncingDrive && selectedFileId === file.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                            <span>СИНХРОНИЗАЦИЯ...</span>
                          </>
                        ) : (
                          <>
                            <Skull className="w-3 h-3 text-slate-950" />
                            <span>ИМПОРТИРОВАТЬ TOD</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* CURRENT DEATH TIME (TOD) LIVE PREVIEW TABLE */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-[#10141e] p-3.5 rounded-xl border border-[#c2a363]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-amber-200 text-xs flex items-center gap-1.5 uppercase">
                <Skull className="w-3.5 h-3.5 text-red-400" />
                АКТУАЛЬНОЕ ВРЕМЯ СМЕРТИ БОССОВ (ТЕКУЩЕЕ В БАЗЕ САЙТА):
              </span>
              <span className="text-[10px] text-slate-400">
                Всего: {bosses.length} боссов
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-1 px-2">БОСС (ДО 23 УР.)</th>
                    <th className="py-1 px-2 text-red-300">ВРЕМЯ СМЕРТИ (TOD)</th>
                    <th className="py-1 px-2 text-amber-300">РАСЧЕТНОЕ ОКНО</th>
                    <th className="py-1 px-2">СТАТУС</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bosses.map((boss) => (
                    <tr key={boss.id} className="hover:bg-[#161c2b] transition-colors">
                      <td className="py-1 px-2 font-bold text-amber-100 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Lv{boss.level}</span>
                        <span>{boss.name}</span>
                      </td>
                      <td className="py-1 px-2 font-black text-red-300">
                        {boss.timeOfDeath ? (
                          <span className="bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/40">
                            {boss.timeOfDeath}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-amber-200/90 font-mono">
                        {boss.windowStart} – {boss.windowEnd}
                      </td>
                      <td className="py-1 px-2">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            boss.status === 'ALIVE'
                              ? 'bg-red-600 text-white border-red-400'
                              : boss.status === 'WINDOW_OPEN'
                              ? 'bg-amber-600 text-amber-950 border-amber-300'
                              : boss.status === 'PVP_ENGAGED'
                              ? 'bg-purple-700 text-purple-100 border-purple-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {boss.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0c1017] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>LINEAGE 2 CLAN RAID TIME OF DEATH SYNCHRONIZER</span>
          <button
            onClick={() => {
              clearDriveSyncMessage();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}
