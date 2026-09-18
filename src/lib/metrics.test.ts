import { describe, expect, it } from 'vitest';
import { createDefaultRoutine } from './routine';
import { buildTimeline } from './metrics';
import { createEmptyDayRecord } from './storage';

const day = new Date(2026, 8, 16, 15, 30);

describe('routine metrics', () => {
  it('only includes coaching on Monday, Wednesday, and Saturday', () => {
    const routine = createDefaultRoutine();
    expect(routine.find((activity) => activity.id === 'coaching')?.days).toEqual([1, 3, 6]);
  });

  it('marks the activity at the current local time as current', () => {
    const routine = createDefaultRoutine();
    const dateKey = '2026-09-16';
    const timeline = buildTimeline(routine.filter((activity) => activity.days.includes(day.getDay())), createEmptyDayRecord(dateKey), day, 540, dateKey);
    expect(timeline.find((activity) => activity.id === 'coaching')?.status).toBe('current');
  });
});
