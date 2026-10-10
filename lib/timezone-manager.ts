'use client';

export interface TimezoneOption {
  id: string;
  label: string;
  shortLabel: string;
  offsetMinutes: number; // e.g. 180 for UTC+3
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'UTC+3', label: 'МСК (UTC+3, Москва / Минск)', shortLabel: 'МСК (UTC+3)', offsetMinutes: 180 },
  { id: 'UTC+2', label: 'UTC+2 (Калининград / Киев / Кишинев)', shortLabel: 'UTC+2', offsetMinutes: 120 },
  { id: 'UTC+4', label: 'UTC+4 (Самара / Баку / Тбилиси)', shortLabel: 'UTC+4', offsetMinutes: 240 },
  { id: 'UTC+5', label: 'UTC+5 (Екатеринбург / Ташкент / Астана)', shortLabel: 'UTC+5', offsetMinutes: 300 },
  { id: 'UTC+6', label: 'UTC+6 (Омск / Бишкек / Алматы)', shortLabel: 'UTC+6', offsetMinutes: 360 },
  { id: 'UTC+7', label: 'UTC+7 (Новосибирск / Красноярск / Бангкок)', shortLabel: 'UTC+7', offsetMinutes: 420 },
  { id: 'UTC+8', label: 'UTC+8 (Иркутск / Пекин)', shortLabel: 'UTC+8', offsetMinutes: 480 },
  { id: 'UTC+9', label: 'UTC+9 (Якутск / Токио)', shortLabel: 'UTC+9', offsetMinutes: 540 },
  { id: 'UTC+0', label: 'UTC+0 (Лондон / GMT)', shortLabel: 'UTC+0', offsetMinutes: 0 },
  { id: 'UTC-5', label: 'UTC-5 (EST / Нью-Йорк)', shortLabel: 'UTC-5', offsetMinutes: -300 },
];

export const DEFAULT_TIMEZONE_ID = 'UTC+3';

export function getTimezoneOption(id: string): TimezoneOption {
  const found = TIMEZONE_OPTIONS.find((tz) => tz.id === id);
  return found || TIMEZONE_OPTIONS[0];
}

/**
 * Formats a UTC millisecond timestamp into HH:MM or HH:MM:SS in the given timezone offset
 */
export function formatTimeInTimezone(
  timestamp: number | undefined,
  offsetMinutes: number = 180,
  withSeconds = false
): string {
  if (!timestamp || isNaN(timestamp)) return '--:--';
  const targetDate = new Date(timestamp + offsetMinutes * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = pad(targetDate.getUTCHours());
  const m = pad(targetDate.getUTCMinutes());
  if (withSeconds) {
    const s = pad(targetDate.getUTCSeconds());
    return `${h}:${m}:${s}`;
  }
  return `${h}:${m}`;
}

/**
 * Converts a string like "14:30" or "14:30:25" entered by a user in `offsetMinutes`
 * into an absolute UTC timestamp (in milliseconds).
 */
export function parseTimeToUtcTimestamp(
  timeStr: string,
  offsetMinutes: number = 180,
  baseDate = new Date()
): number {
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;

  const nowUtc = Date.now();
  // Find current date components in the specified timezone
  const currentInZone = new Date(nowUtc + offsetMinutes * 60 * 1000);

  // Construct target timestamp as UTC, then subtract the offset
  const targetInZoneUtc = Date.UTC(
    currentInZone.getUTCFullYear(),
    currentInZone.getUTCMonth(),
    currentInZone.getUTCDate(),
    h,
    m,
    s
  );

  let resultTimestamp = targetInZoneUtc - offsetMinutes * 60 * 1000;

  // If user entered a time in the future today, it was death time from yesterday
  if (resultTimestamp > nowUtc + 60000) {
    resultTimestamp -= 24 * 3600 * 1000;
  }

  return resultTimestamp;
}
