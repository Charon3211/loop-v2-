export const NAV_ITEMS = ['today', 'routine', 'workout', 'stats', 'profile'] as const;
export type View = (typeof NAV_ITEMS)[number];

export const CATEGORIES = ['sleep', 'nutrition', 'study', 'gaming', 'coaching', 'rest', 'workout', 'personal'] as const;
export type Category = (typeof CATEGORIES)[number];

export const TIMER_KINDS = ['study', 'gaming', 'coaching', 'workout'] as const;
export type TimerKind = (typeof TIMER_KINDS)[number];
export type Mood = 'low' | 'neutral' | 'good' | 'fire';

export interface ChecklistItem {
  id: string;
  title: string;
}

export interface RoutineActivity {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  durationMinutes: number;
  category: Category;
  icon: string;
  days: number[];
  checklist: ChecklistItem[];
  action: TimerKind | null;
  enabled: boolean;
  order: number;
}

export interface DayRecord {
  dateKey: string;
  completedActivityIds: string[];
  skippedActivityIds: string[];
  checkedItems: Record<string, boolean>;
  waterMl: number;
  mood: Mood | null;
  note: string;
}

export interface SessionRecord {
  id: string;
  kind: TimerKind;
  title: string;
  dateKey: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
}

export interface WorkoutExerciseLog {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

export interface WorkoutRecord {
  id: string;
  dateKey: string;
  title: string;
  startedAt: number;
  endedAt: number | null;
  durationSeconds: number;
  exercises: WorkoutExerciseLog[];
}

export interface Profile {
  name: string;
  tagline: string;
  avatarDataUrl: string;
  wakeTime: number;
  sleepTime: number;
  waterGoalMl: number;
}

export interface Settings {
  remindersEnabled: boolean;
  notificationsEnabled: boolean;
  reduceMotion: boolean;
}

export interface ActiveTimer {
  kind: TimerKind;
  title: string;
  dateKey: string;
  startedAt: number;
  pausedAt: number | null;
  pausedSeconds: number;
}

export interface AppData {
  version: number;
  profile: Profile;
  settings: Settings;
  routine: RoutineActivity[];
  days: Record<string, DayRecord>;
  sessions: SessionRecord[];
  workouts: WorkoutRecord[];
  reviews: Record<string, { mood: Mood | null; note: string }>;
  activeTimer: ActiveTimer | null;
}

export interface TimelineActivity extends RoutineActivity {
  status: 'completed' | 'current' | 'upcoming' | 'missed' | 'skipped';
  completedItems: number;
  totalItems: number;
}
