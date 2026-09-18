import { getActivitiesForDate } from './routine';
import { getActivityStartOffset, getLocalDateKey, getRoutineMinutes, getWeekDates } from './date';
import type { AppData, DayRecord, RoutineActivity, SessionRecord, TimelineActivity, TimerKind } from './types';

export function getDayRecord(data: AppData, dateKey: string): DayRecord {
  return data.days[dateKey] ?? { dateKey, completedActivityIds: [], skippedActivityIds: [], checkedItems: {}, waterMl: 0, mood: null, note: '' };
}

export function getActivityCompletion(activity: RoutineActivity, day: DayRecord): { completed: number; total: number } {
  if (activity.checklist.length === 0) return { completed: day.completedActivityIds.includes(activity.id) ? 1 : 0, total: 1 };
  const completed = activity.checklist.filter((item) => day.checkedItems[`${activity.id}:${item.id}`] === true).length;
  return { completed, total: activity.checklist.length };
}

export function getDailyProgress(activities: RoutineActivity[], day: DayRecord): { completed: number; total: number; percentage: number } {
  const result = activities.reduce((summary, activity) => {
    const completion = getActivityCompletion(activity, day);
    summary.completed += completion.completed;
    summary.total += completion.total;
    return summary;
  }, { completed: 0, total: 0 });
  return { ...result, percentage: result.total ? Math.round((result.completed / result.total) * 100) : 0 };
}

export function buildTimeline(activities: RoutineActivity[], day: DayRecord, now: Date, wakeTime: number, dateKey: string): TimelineActivity[] {
  const currentDateKey = getLocalDateKey(now);
  const nowOffset = dateKey === currentDateKey ? getRoutineMinutes(now, wakeTime) : dateKey < currentDateKey ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  return activities.map((activity) => {
    const completion = getActivityCompletion(activity, day);
    const startOffset = getActivityStartOffset(activity, wakeTime);
    const endOffset = startOffset + activity.durationMinutes;
    let status: TimelineActivity['status'];
    if (day.skippedActivityIds.includes(activity.id)) status = 'skipped';
    else if (completion.completed === completion.total) status = 'completed';
    else if (nowOffset >= startOffset && nowOffset < endOffset) status = 'current';
    else if (nowOffset < startOffset) status = 'upcoming';
    else status = 'missed';
    return { ...activity, status, completedItems: completion.completed, totalItems: completion.total };
  });
}

export function getSessionsForDate(sessions: SessionRecord[], dateKey: string, kind?: TimerKind): SessionRecord[] {
  return sessions.filter((session) => session.dateKey === dateKey && (!kind || session.kind === kind));
}

export function getSessionSeconds(sessions: SessionRecord[], dateKey: string, kind?: TimerKind): number {
  return getSessionsForDate(sessions, dateKey, kind).reduce((sum, session) => sum + session.durationSeconds, 0);
}

export function getWeekProgress(data: AppData, referenceDate = new Date()): Array<{ dateKey: string; label: string; percentage: number; waterMl: number; studySeconds: number; workout: boolean; coachingSeconds: number }> {
  return getWeekDates(referenceDate).map((date) => {
    const dateKey = getLocalDateKey(date);
    const activities = getActivitiesForDate(data.routine, date);
    const progress = getDailyProgress(activities, getDayRecord(data, dateKey));
    return {
      dateKey,
      label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      percentage: progress.percentage,
      waterMl: getDayRecord(data, dateKey).waterMl,
      studySeconds: getSessionSeconds(data.sessions, dateKey, 'study'),
      workout: data.workouts.some((workout) => workout.dateKey === dateKey),
      coachingSeconds: getSessionSeconds(data.sessions, dateKey, 'coaching'),
    };
  });
}

export function getStreak(data: AppData, kind: 'routine' | 'study' | 'workout' | 'water' | 'coaching'): number {
  let streak = 0;
  const cursor = new Date();
  for (let offset = 0; offset < 365; offset += 1) {
    cursor.setDate(cursor.getDate() - (offset === 0 ? 0 : 1));
    const dateKey = getLocalDateKey(cursor);
    const day = getDayRecord(data, dateKey);
    const progress = getDailyProgress(getActivitiesForDate(data.routine, cursor), day);
    const hasValue = kind === 'routine' ? progress.percentage >= 70
      : kind === 'study' ? getSessionSeconds(data.sessions, dateKey, 'study') >= 20 * 60
        : kind === 'workout' ? data.workouts.some((workout) => workout.dateKey === dateKey)
          : kind === 'water' ? day.waterMl >= data.profile.waterGoalMl
            : getSessionSeconds(data.sessions, dateKey, 'coaching') >= 30 * 60;
    if (!hasValue) break;
    streak += 1;
  }
  return streak;
}

export function calculateAchievements(data: AppData): Array<{ title: string; description: string; icon: string; unlocked: boolean }> {
  const week = getWeekProgress(data);
  const completedDays = week.filter((day) => day.percentage >= 70).length;
  const studyHours = data.sessions.filter((session) => session.kind === 'study').reduce((sum, session) => sum + session.durationSeconds, 0) / 3600;
  const workoutCount = data.workouts.length;
  return [
    { title: 'First week', description: 'Complete your routine for 7 days.', icon: '01', unlocked: completedDays >= 7 },
    { title: 'Consistency', description: 'Build a 30-day routine record.', icon: '30', unlocked: getStreak(data, 'routine') >= 30 },
    { title: 'Study mode', description: 'Complete 10 hours of study.', icon: '⌁', unlocked: studyHours >= 10 },
    { title: 'Iron', description: 'Complete 20 gym sessions.', icon: '╳', unlocked: workoutCount >= 20 },
    { title: 'Locked in', description: 'Keep a high-completion week.', icon: '✦', unlocked: week.every((day) => day.percentage >= 80) },
  ];
}
