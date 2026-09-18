import { describe, expect, it } from 'vitest';
import { formatTime12, getRoutineMinutes, getLocalDateKey, parseTime12 } from './date';

// These small tests guard the AM/PM and local-calendar boundaries that drive the routine engine.
describe('date helpers', () => {
  it('formats midnight and noon using a 12-hour clock', () => {
    expect(formatTime12(0)).toBe('12:00 AM');
    expect(formatTime12(720)).toBe('12:00 PM');
    expect(formatTime12(15 * 60)).toBe('3:00 PM');
  });

  it('parses editable 12-hour times without confusing noon and midnight', () => {
    expect(parseTime12('12:00 AM')).toBe(0);
    expect(parseTime12('12:00 PM')).toBe(720);
    expect(parseTime12('1:30 AM')).toBe(90);
    expect(parseTime12('not a time', 540)).toBe(540);
  });

  it('keeps after-midnight routine activities in the wake-to-sleep day', () => {
    const justAfterMidnight = new Date(2026, 8, 17, 1, 45);
    expect(getRoutineMinutes(justAfterMidnight, 9 * 60)).toBe(105 + 1440);
  });

  it('uses the local calendar date rather than UTC conversion', () => {
    const localDate = new Date(2026, 8, 17, 23, 59);
    expect(getLocalDateKey(localDate)).toBe('2026-09-17');
  });
});
