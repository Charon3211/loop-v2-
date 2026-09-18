import type { RoutineActivity } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

export function getLocalDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = dateKeyToDate(value);
  return !Number.isNaN(date.getTime()) && getLocalDateKey(date) === value;
}

export function formatDateTitle(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatDayName(date: Date, long = false): string {
  return new Intl.DateTimeFormat('en-US', { weekday: long ? 'long' : 'short' }).format(date);
}

export function formatTime12(minutes: number): string {
  const safeMinutes = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${pad(minute)} ${period}`;
}

export function parseTime12(value: string, fallback = 0): number {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return fallback;
  const period = match[3].toUpperCase();
  return ((hour % 12) + (period === 'PM' ? 12 : 0)) * 60 + minute;
}

export function formatTimeFromDate(date = new Date()): string {
  return formatTime12(date.getHours() * 60 + date.getMinutes());
}

export function getMinutesFromDate(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function getRoutineMinutes(date: Date, wakeTime: number): number {
  const minutes = getMinutesFromDate(date);
  return minutes < wakeTime ? minutes + 1440 : minutes;
}

export function getActivityStartOffset(activity: RoutineActivity, wakeTime: number): number {
  return activity.timeMinutes < wakeTime ? activity.timeMinutes + 1440 : activity.timeMinutes;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
}

export function formatCompactDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${minutes}m`;
}

export function startOfWeekMonday(date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const day = result.getDay();
  const distance = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - distance);
  return result;
}

export function getWeekDates(date = new Date()): Date[] {
  const monday = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getDateDiffDays(older: string, newer: string): number {
  const start = dateKeyToDate(older).getTime();
  const end = dateKeyToDate(newer).getTime();
  return Math.round((end - start) / 86400000);
}
