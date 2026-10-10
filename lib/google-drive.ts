'use client';

import { getAccessToken } from './firebase-auth';
import { L2Boss, BossState, L2ClassArchetype } from './l2-spot-types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * List files from user's Google Drive matching query or recent spreadsheet/json/txt files
 */
export async function listDriveFiles(searchTerm?: string): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive не авторизован. Пожалуйста, выполните вход через Google.');
  }

  let q = "trashed = false and mimeType != 'application/vnd.google-apps.folder'";
  if (searchTerm && searchTerm.trim()) {
    const escaped = searchTerm.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size)');
  url.searchParams.set('pageSize', '30');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Ошибка Google Drive API (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Fetch text/raw content of a file from Google Drive
 */
export async function fetchDriveFileContent(fileId: string, mimeType?: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Google Drive не авторизован');
  }

  // If it's a Google Doc or Google Sheet, export as plain text or CSV
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Не удалось экспортировать Google Таблицу в CSV');
    return await res.text();
  }

  if (mimeType === 'application/vnd.google-apps.document') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Не удалось экспортировать Google Документ');
    return await res.text();
  }

  // Normal binary/text file download (JSON, CSV, TXT)
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Ошибка загрузки файла из Google Drive (${res.status})`);
  }

  return await res.text();
}

/**
 * Fetch public or shared Google Spreadsheet CSV directly by URL or Sheet ID
 */
export async function fetchSpreadsheetByUrl(urlOrId: string): Promise<string> {
  let sheetId = urlOrId.trim();

  // Extract ID if full URL provided: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit
  const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    sheetId = match[1];
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  // Try fetching publicly first
  try {
    const res = await fetch(exportUrl);
    if (res.ok) {
      return await res.text();
    }
  } catch {
    // ignore
  }

  // If public fetch failed, try authenticated with token
  const token = await getAccessToken();
  if (token) {
    return await fetchDriveFileContent(sheetId, 'application/vnd.google-apps.spreadsheet');
  }

  throw new Error(
    'Не удалось получить доступ к таблице. Убедитесь, что ссылка открыта для просмотра («Доступ по ссылке») или выполнен вход через Google.'
  );
}

/**
 * Helper to compute respawn window from TOD (Time of Death) and Cooldown Hours
 */
function calculateWindowFromTod(
  todStr: string,
  cooldownHours: number
): { windowStart: string; windowEnd: string; status: BossState } {
  // Extract hours and minutes from strings like "14:20" or "2026-09-30 14:20"
  const timeMatch = todStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return { windowStart: '18:00', windowEnd: '21:00', status: 'DEAD' };
  }

  const todH = parseInt(timeMatch[1], 10);
  const todM = parseInt(timeMatch[2], 10);

  // Lineage 2 Classic/UE5 RB Mechanics:
  // Respawn window usually opens at TOD + Cooldown (or Cooldown - RandomWindow)
  // Typically, random window is 2 to 3 hours
  const randomWindowHours = 3;
  const startTotalMinutes = (todH * 60 + todM + cooldownHours * 60) % 1440;
  const endTotalMinutes = (startTotalMinutes + randomWindowHours * 60) % 1440;

  const startH = Math.floor(startTotalMinutes / 60);
  const startM = startTotalMinutes % 60;
  const endH = Math.floor(endTotalMinutes / 60);
  const endM = endTotalMinutes % 60;

  const windowStart = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
  const windowEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Evaluate current status relative to now
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let status: BossState = 'DEAD';
  // Check if current time is within [startTotalMinutes, endTotalMinutes]
  if (startTotalMinutes <= endTotalMinutes) {
    if (currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes) {
      status = 'WINDOW_OPEN';
    } else if (currentMinutes > endTotalMinutes) {
      status = 'ALIVE'; // If window ended and not marked dead, it spawned
    } else {
      status = 'DEAD';
    }
  } else {
    // Overnight window (e.g. 23:00 to 02:00)
    if (currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes) {
      status = 'WINDOW_OPEN';
    } else {
      status = 'DEAD';
    }
  }

  return { windowStart, windowEnd, status };
}

/**
 * Smart Parser to extract Boss Time of Death (TOD), status, and respawn windows from Google Sheets (CSV/JSON/Lines)
 */
export function parseBossDatabaseContent(
  rawText: string,
  existingBosses: L2Boss[]
): { updatedBosses: L2Boss[]; importedCount: number; message: string; deathTimesFound: Record<string, string> } {
  const trimmed = rawText.trim();
  const deathTimesFound: Record<string, string> = {};

  // 1. Try parsing JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const items: unknown[] = Array.isArray(parsed) ? parsed : parsed.bosses || [parsed];
      let matchCount = 0;

      const updated = existingBosses.map((boss) => {
        const found = items.find((item: unknown) => {
          if (!item || typeof item !== 'object') return false;
          const obj = item as Record<string, unknown>;
          const n = String(obj.name || obj.boss || obj.id || '').toLowerCase();
          return n.includes(boss.name.toLowerCase()) || boss.name.toLowerCase().includes(n);
        }) as Record<string, unknown> | undefined;

        if (found) {
          matchCount++;
          const tod = String(
            found.timeOfDeath ||
              found.tod ||
              found.deathTime ||
              found.death ||
              found.time_of_death ||
              found.время_смерти ||
              found.время ||
              ''
          ).trim();

          let calculatedWindowStart = boss.windowStart;
          let calculatedWindowEnd = boss.windowEnd;
          let calculatedStatus = (found.status as BossState) || boss.status;

          if (tod) {
            deathTimesFound[boss.name] = tod;
            const computed = calculateWindowFromTod(tod, boss.respawnCooldownHours);
            calculatedWindowStart = String(found.windowStart || computed.windowStart);
            calculatedWindowEnd = String(found.windowEnd || computed.windowEnd);
            if (!found.status) {
              calculatedStatus = computed.status;
            }
          }

          return {
            ...boss,
            timeOfDeath: tod || boss.timeOfDeath,
            status: calculatedStatus,
            windowStart: calculatedWindowStart,
            windowEnd: calculatedWindowEnd,
            respawnCooldownHours: Number(found.respawnCooldownHours || found.cooldown || boss.respawnCooldownHours),
            spotter: found.scout || found.spotter
              ? {
                  id: 'scout_' + boss.id,
                  nickname: String(found.scout || (found.spotter as Record<string, unknown>)?.nickname || 'Scout'),
                  className: String((found.spotter as Record<string, unknown>)?.className || 'Silver Ranger'),
                  classArchetype: 'ARCHER' as L2ClassArchetype,
                  clanName: 'Pay2KILL',
                  level: 22,
                  sinceTimestamp: Date.now() - 10 * 60 * 1000,
                  note: 'Синхронизировано из таблицы Google Диска',
                }
              : boss.spotter,
          };
        }
        return boss;
      });

      return {
        updatedBosses: updated,
        importedCount: matchCount,
        deathTimesFound,
        message: `Успешно обновлено ${matchCount} боссов (время смерти и респаун из JSON Google Диска)`,
      };
    } catch {
      // Fall through to CSV
    }
  }

  // 2. Comprehensive CSV / Spreadsheet Table Parser
  // Supports formats from Google Sheets exports:
  // e.g.:
  // Босс, Время смерти, Окно, Статус
  // Revenant of Sir Calibus, 14:20, 06:20 - 09:20, DEAD
  // Zombie Lord Ferkel, 02:45, 18:45 - 21:45, WINDOW_OPEN
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return {
      updatedBosses: existingBosses,
      importedCount: 0,
      deathTimesFound: {},
      message: 'Таблица пуста',
    };
  }

  // Detect header columns if present
  const headerLine = lines[0].toLowerCase();
  const headerCols = headerLine.split(/[,;\t|]/).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const hasHeader =
    headerCols.some((c) =>
      ['босс', 'boss', 'name', 'имя', 'рб', 'tod', 'время', 'смерть', 'death'].includes(c)
    );

  const dataRows = hasHeader ? lines.slice(1) : lines;
  let matchCount = 0;

  // Map boss aliases for resilient matching
  const matchBossName = (text: string, boss: L2Boss): boolean => {
    const t = text.toLowerCase();
    const bn = boss.name.toLowerCase();
    if (t.includes(bn)) return true;

    // Short nicknames (Calibus, Ferkel, Bifrons, etc.)
    const firstWord = bn.split(' ')[0];
    const keyWords: Record<string, string[]> = {
      calibus: ['calibus', 'калибус', 'сир калибус', 'revenant'],
      ferkel: ['ferkel', 'феркель', 'феркел', 'зомби лорд', 'zombie lord'],
      madness_beast: ['madness', 'beast', 'безуми', 'зверь безумия'],
      bifrons: ['bifrons', 'бифронс', 'демон-змея', 'serpent demon'],
      wererat: ['wererat', 'sukar', 'крысокод', 'крысолюд', 'вождь крыс'],
      malex: ['malex', 'малекс', 'дагониэль', 'dagoniel'],
      kaysha: ['kaysha', 'кайша', 'икарус', 'icarus'],
      kutus: ['kutus', 'кутус', 'серых когтей', 'greyclaw'],
      sharuk: ['sharuk', 'шарук', 'tracker leader', 'ящеров'],
      kuroboros: ['kuroboros', 'куроборос', 'жрец'],
    };

    const aliases = keyWords[boss.id] || [firstWord];
    return aliases.some((alias) => t.includes(alias));
  };

  const updated = existingBosses.map((boss) => {
    // Find matching row for this boss
    const matchingRow = dataRows.find((row) => matchBossName(row, boss));
    if (!matchingRow) return boss;

    matchCount++;
    const cells = matchingRow
      .split(/[,;\t|]/)
      .map((c) => c.trim().replace(/^["']|["']$/g, ''));

    // Extract any time pattern HH:MM or HH:MM:SS or full datetime
    let foundTod = '';
    let foundWindow = '';
    let foundStatus: BossState | undefined;

    // Search cells for Time of Death (TOD)
    for (const cell of cells) {
      // Check for explicit time format: HH:MM or HH:MM:SS
      const timeMatch = cell.match(/(?:^|\s|\b)(\d{1,2}:\d{2}(?::\d{2})?)(?:\s|\b|$)/);
      if (timeMatch && !foundTod) {
        // If not a window range (which contains "-" or "–")
        if (!cell.includes('-') && !cell.includes('–')) {
          foundTod = timeMatch[1];
        }
      }

      // Check for window range: e.g. "18:00 - 21:00"
      if (cell.includes('-') || cell.includes('–')) {
        const rangeMatch = cell.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
        if (rangeMatch) {
          foundWindow = `${rangeMatch[1]} – ${rangeMatch[2]}`;
        }
      }

      // Check for status words
      const lower = cell.toLowerCase();
      if (lower.includes('alive') || lower.includes('реснулся') || lower.includes('жив')) {
        foundStatus = 'ALIVE';
      } else if (lower.includes('window') || lower.includes('окно')) {
        foundStatus = 'WINDOW_OPEN';
      } else if (lower.includes('dead') || lower.includes('убит') || lower.includes('кд')) {
        foundStatus = 'DEAD';
      } else if (lower.includes('pvp') || lower.includes('пвп')) {
        foundStatus = 'PVP_ENGAGED';
      }
    }

    // If TOD is found, calculate accurate respawn window
    let windowStart = boss.windowStart;
    let windowEnd = boss.windowEnd;
    let status = foundStatus || boss.status;

    if (foundTod) {
      deathTimesFound[boss.name] = foundTod;
      const computed = calculateWindowFromTod(foundTod, boss.respawnCooldownHours);
      windowStart = computed.windowStart;
      windowEnd = computed.windowEnd;
      if (!foundStatus) {
        status = computed.status;
      }
    }

    if (foundWindow) {
      const parts = foundWindow.split(/[-–]/).map((p) => p.trim());
      if (parts.length >= 2) {
        windowStart = parts[0];
        windowEnd = parts[1];
      }
    }

    return {
      ...boss,
      timeOfDeath: foundTod || boss.timeOfDeath,
      windowStart,
      windowEnd,
      status,
    };
  });

  return {
    updatedBosses: updated,
    importedCount: matchCount,
    deathTimesFound,
    message: `Успешно загружено время смерти для ${matchCount} боссов из таблицы Google Диска`,
  };
}
