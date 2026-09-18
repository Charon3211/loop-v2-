import type { ActiveTimer } from './types';

export function getActiveTimerElapsed(timer: ActiveTimer, now = Date.now()): number {
  const pausedSeconds = timer.pausedSeconds + (timer.pausedAt ? Math.max(0, Math.floor((now - timer.pausedAt) / 1000)) : 0);
  return Math.max(0, Math.floor((now - timer.startedAt) / 1000) - pausedSeconds);
}
