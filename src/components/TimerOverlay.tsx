import { useMemo } from 'react';
import { formatDurationSeconds } from '../lib/date';
import { getActiveTimerElapsed } from '../lib/timer';
import type { ActiveTimer, TimerKind } from '../lib/types';

interface TimerOverlayProps {
  timer: ActiveTimer;
  now: number;
  expanded: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onMinimize: () => void;
}

const kindLabels: Record<TimerKind, string> = { study: 'Study', gaming: 'Gaming', coaching: 'Coaching', workout: 'Workout' };

export function TimerOverlay({ timer, now, expanded, onPause, onResume, onFinish, onMinimize }: TimerOverlayProps) {
  const elapsed = useMemo(() => getActiveTimerElapsed(timer, now), [timer, now]);
  const label = kindLabels[timer.kind];
  if (!expanded) {
    return (
      <button className="timer-mini" type="button" onClick={onMinimize} aria-label={`Open ${label} timer`}>
        <span className="timer-mini-dot" />
        <span>{label}</span>
        <strong>{formatDurationSeconds(elapsed)}</strong>
      </button>
    );
  }
  return (
    <div className="timer-overlay" role="dialog" aria-modal="false" aria-label={`${label} focus mode`}>
      <div className="timer-panel">
        <div className="timer-panel-topline">
          <span className="eyebrow">Focus mode</span>
          <button className="icon-button" type="button" onClick={onMinimize} aria-label="Minimize timer">×</button>
        </div>
        <div className="timer-panel-copy">
          <span className="timer-kicker">{label}</span>
          <strong className="timer-value" aria-live="polite">{formatDurationSeconds(elapsed)}</strong>
          <span className="muted">Stay with the block. Finish when you’re ready.</span>
        </div>
        <div className="timer-track" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(10, (elapsed / 3600) * 100))}%` }} /></div>
        <div className="timer-actions">
          {timer.pausedAt ? (
            <button className="button button-primary" type="button" onClick={onResume}>Resume</button>
          ) : (
            <button className="button button-secondary" type="button" onClick={onPause}>Pause</button>
          )}
          <button className="button button-quiet" type="button" onClick={onFinish}>Finish session</button>
        </div>
      </div>
    </div>
  );
}
