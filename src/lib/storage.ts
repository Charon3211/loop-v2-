import { getLocalDateKey, isValidDateKey } from './date';
import { createDefaultRoutine } from './routine';
import type { AppData, Category, DayRecord, Mood, Profile, RoutineActivity, SessionRecord, Settings, TimerKind, WorkoutExerciseLog, WorkoutRecord } from './types';
import { CATEGORIES, TIMER_KINDS } from './types';

export const STORAGE_KEY = 'pulseboard-data-v1';
export const SCHEMA_VERSION = 1;

const defaultProfile: Profile = {
  name: 'Alex',
  tagline: 'Build the day you want to repeat.',
  avatarDataUrl: '',
  wakeTime: 540,
  sleepTime: 90,
  waterGoalMl: 2000,
};

const defaultSettings: Settings = {
  remindersEnabled: false,
  notificationsEnabled: false,
  reduceMotion: false,
};

export function createEmptyDayRecord(dateKey = getLocalDateKey()): DayRecord {
  return { dateKey, completedActivityIds: [], skippedActivityIds: [], checkedItems: {}, waterMl: 0, mood: null, note: '' };
}

export function createDefaultData(): AppData {
  return {
    version: SCHEMA_VERSION,
    profile: { ...defaultProfile },
    settings: { ...defaultSettings },
    routine: createDefaultRoutine(),
    days: {},
    sessions: [],
    workouts: [],
    reviews: {},
    activeTimer: null,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const uniqueStrings = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter(isString))] : [];
const safeKind = (value: unknown): TimerKind | null => TIMER_KINDS.includes(value as TimerKind) ? value as TimerKind : null;
const safeCategory = (value: unknown): Category => CATEGORIES.includes(value as Category) ? value as Category : 'personal';
const safeMood = (value: unknown): Mood | null => ['low', 'neutral', 'good', 'fire'].includes(value as string) ? value as Mood : null;

function normalizeRoutine(raw: unknown): RoutineActivity[] {
  if (!Array.isArray(raw)) return createDefaultRoutine();
  const activities = raw.flatMap((entry, index) => {
    if (!isRecord(entry) || !isString(entry.id) || !isString(entry.title)) return [];
    const checklist = Array.isArray(entry.checklist)
      ? entry.checklist.flatMap((item, itemIndex) => isRecord(item) && isString(item.id) && isString(item.title) ? [{ id: item.id, title: item.title.slice(0, 120) }] : [{ id: `${entry.id}-item-${itemIndex}`, title: isString(item) ? item.slice(0, 120) : '' }]).filter((item) => item.title)
      : [];
    const days = Array.isArray(entry.days) ? [...new Set(entry.days.filter((day): day is number => isNumber(day) && day >= 0 && day <= 6).map(Math.floor))] : [0, 1, 2, 3, 4, 5, 6];
    return [{
      id: entry.id.slice(0, 80),
      title: entry.title.slice(0, 80),
      description: isString(entry.description) ? entry.description.slice(0, 240) : '',
      timeMinutes: isNumber(entry.timeMinutes) ? clamp(Math.floor(entry.timeMinutes), 0, 1439) : 540,
      durationMinutes: isNumber(entry.durationMinutes) ? clamp(Math.floor(entry.durationMinutes), 5, 1440) : 30,
      category: safeCategory(entry.category),
      icon: isString(entry.icon) ? entry.icon.slice(0, 4) : '•',
      days: days.length ? days : [0, 1, 2, 3, 4, 5, 6],
      checklist,
      action: safeKind(entry.action),
      enabled: entry.enabled !== false,
      order: isNumber(entry.order) ? entry.order : index + 1,
    } satisfies RoutineActivity];
  });
  return activities.length ? activities.sort((a, b) => a.order - b.order) : createDefaultRoutine();
}

function normalizeDay(raw: unknown, dateKey: string): DayRecord {
  if (!isRecord(raw)) return createEmptyDayRecord(dateKey);
  const checkedItems: Record<string, boolean> = {};
  if (isRecord(raw.checkedItems)) {
    Object.entries(raw.checkedItems).forEach(([key, value]) => { if (typeof value === 'boolean') checkedItems[key] = value; });
  }
  return {
    dateKey,
    completedActivityIds: uniqueStrings(raw.completedActivityIds),
    skippedActivityIds: uniqueStrings(raw.skippedActivityIds),
    checkedItems,
    waterMl: isNumber(raw.waterMl) ? clamp(Math.floor(raw.waterMl), 0, 20000) : 0,
    mood: safeMood(raw.mood),
    note: isString(raw.note) ? raw.note.slice(0, 2000) : '',
  };
}

function normalizeProfile(raw: unknown): Profile {
  const value = isRecord(raw) ? raw : {};
  return {
    name: isString(value.name) && value.name.trim() ? value.name.trim().slice(0, 60) : defaultProfile.name,
    tagline: isString(value.tagline) ? value.tagline.slice(0, 120) : defaultProfile.tagline,
    avatarDataUrl: isString(value.avatarDataUrl) && value.avatarDataUrl.startsWith('data:image/') ? value.avatarDataUrl : '',
    wakeTime: isNumber(value.wakeTime) ? clamp(Math.floor(value.wakeTime), 0, 1439) : defaultProfile.wakeTime,
    sleepTime: isNumber(value.sleepTime) ? clamp(Math.floor(value.sleepTime), 0, 1439) : defaultProfile.sleepTime,
    waterGoalMl: isNumber(value.waterGoalMl) ? clamp(Math.floor(value.waterGoalMl), 250, 10000) : defaultProfile.waterGoalMl,
  };
}

export function normalizeAppData(input: unknown): AppData {
  const fallback = createDefaultData();
  if (!isRecord(input)) return fallback;
  const days: Record<string, DayRecord> = {};
  if (isRecord(input.days)) {
    Object.entries(input.days).forEach(([dateKey, value]) => { if (isValidDateKey(dateKey)) days[dateKey] = normalizeDay(value, dateKey); });
  }
  const sessions: SessionRecord[] = Array.isArray(input.sessions) ? input.sessions.flatMap((entry) => {
    const kind = isRecord(entry) ? safeKind(entry.kind) : null;
    if (!isRecord(entry) || !isString(entry.id) || !isString(entry.title) || !isValidDateKey(entry.dateKey) || !kind) return [];
    const startedAt = isNumber(entry.startedAt) ? entry.startedAt : 0;
    const endedAt = isNumber(entry.endedAt) ? Math.max(startedAt, entry.endedAt) : startedAt;
    return [{ id: entry.id, kind, title: entry.title.slice(0, 100), dateKey: entry.dateKey, startedAt, endedAt, durationSeconds: clamp(isNumber(entry.durationSeconds) ? Math.floor(entry.durationSeconds) : Math.floor((endedAt - startedAt) / 1000), 0, 86400) }];
  }) : [];
  const workouts: WorkoutRecord[] = Array.isArray(input.workouts) ? input.workouts.filter(isRecord).flatMap((entry) => {
    if (!isString(entry.id) || !isValidDateKey(entry.dateKey) || !isString(entry.title)) return [];
    const exercises: WorkoutExerciseLog[] = Array.isArray(entry.exercises) ? entry.exercises.filter(isRecord).flatMap((exercise, index) => {
      if (!isString(exercise.name)) return [];
      return [{ id: isString(exercise.id) ? exercise.id : `${entry.id}-exercise-${index + 1}`, name: exercise.name.slice(0, 100), sets: isNumber(exercise.sets) ? clamp(Math.floor(exercise.sets), 1, 100) : 3, reps: isNumber(exercise.reps) ? clamp(Math.floor(exercise.reps), 1, 500) : 10, weight: isNumber(exercise.weight) ? clamp(exercise.weight, 0, 2000) : 0, notes: isString(exercise.notes) ? exercise.notes.slice(0, 500) : '' }];
    }) : [];
    return [{ id: entry.id, dateKey: entry.dateKey, title: entry.title.slice(0, 100), startedAt: isNumber(entry.startedAt) ? entry.startedAt : 0, endedAt: isNumber(entry.endedAt) ? entry.endedAt : null, durationSeconds: clamp(isNumber(entry.durationSeconds) ? Math.floor(entry.durationSeconds) : 0, 0, 86400), exercises }];
  }) : [];
  const reviews: AppData['reviews'] = {};
  if (isRecord(input.reviews)) Object.entries(input.reviews).forEach(([dateKey, review]) => { if (isValidDateKey(dateKey) && isRecord(review)) reviews[dateKey] = { mood: safeMood(review.mood), note: isString(review.note) ? review.note.slice(0, 2000) : '' }; });
  const activeTimerKind = isRecord(input.activeTimer) ? safeKind(input.activeTimer.kind) : null;
  const activeTimer = isRecord(input.activeTimer) && activeTimerKind && isValidDateKey(input.activeTimer.dateKey) && isNumber(input.activeTimer.startedAt)
    ? { kind: activeTimerKind, title: isString(input.activeTimer.title) ? input.activeTimer.title.slice(0, 100) : 'Focus session', dateKey: input.activeTimer.dateKey, startedAt: input.activeTimer.startedAt, pausedAt: isNumber(input.activeTimer.pausedAt) ? input.activeTimer.pausedAt : null, pausedSeconds: isNumber(input.activeTimer.pausedSeconds) ? clamp(input.activeTimer.pausedSeconds, 0, 86400) : 0 }
    : null;
  const value = isRecord(input.settings) ? input.settings : {};
  return {
    version: SCHEMA_VERSION,
    profile: normalizeProfile(input.profile),
    settings: { remindersEnabled: value.remindersEnabled === true, notificationsEnabled: value.notificationsEnabled === true, reduceMotion: value.reduceMotion === true },
    routine: normalizeRoutine(input.routine), days, sessions, workouts, reviews, activeTimer,
  };
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return createDefaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeAppData(JSON.parse(raw)) : createDefaultData();
  } catch {
    return createDefaultData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable or full; the UI still remains usable. */ }
}
