import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { formatDateTitle, formatDateShort, formatDurationSeconds, formatTime12, formatTimeFromDate, getLocalDateKey, dateKeyToDate, getWeekDates } from '../lib/date';
import { buildTimeline, getDailyProgress, getDayRecord, getSessionSeconds, getWeekProgress } from '../lib/metrics';
import { getActivitiesForDate } from '../lib/routine';
import type { AppData, DayRecord, Mood, RoutineActivity, TimerKind } from '../lib/types';

interface TodayPageProps {
  data: AppData;
  dateKey: string;
  now: Date;
  onDateChange: (dateKey: string) => void;
  onToggleActivity: (dateKey: string, activity: RoutineActivity) => void;
  onToggleItem: (dateKey: string, activity: RoutineActivity, itemId: string) => void;
  onSkipActivity: (dateKey: string, activity: RoutineActivity) => void;
  onStartTimer: (kind: TimerKind, title: string) => void;
  onSaveWater: (dateKey: string, waterMl: number) => void;
  onSaveReview: (dateKey: string, mood: Mood | null, note: string) => void;
  onOpenRoutine: () => void;
}

const moodOptions: Array<{ value: Mood; label: string; icon: string }> = [
  { value: 'low', label: 'Not great', icon: '—' },
  { value: 'neutral', label: 'Okay', icon: '·' },
  { value: 'good', label: 'Good', icon: '◡' },
  { value: 'fire', label: 'Locked in', icon: '✦' },
];

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function statusLabel(status: string): string {
  return status === 'current' ? 'Current' : status === 'completed' ? 'Completed' : status === 'skipped' ? 'Skipped' : status === 'missed' ? 'Missed' : 'Upcoming';
}

export default function TodayPage({ data, dateKey, now, onDateChange, onToggleActivity, onToggleItem, onSkipActivity, onStartTimer, onSaveWater, onSaveReview, onOpenRoutine }: TodayPageProps) {
  const selectedDate = dateKeyToDate(dateKey);
  const todayKey = getLocalDateKey(now);
  const isToday = dateKey === todayKey;
  const day = getDayRecord(data, dateKey);
  const activities = useMemo(() => getActivitiesForDate(data.routine, selectedDate), [data.routine, dateKey]);
  const timeline = useMemo(() => buildTimeline(activities, day, now, data.profile.wakeTime, dateKey), [activities, day, now, data.profile.wakeTime, dateKey]);
  const progress = getDailyProgress(activities, day);
  const week = getWeekProgress(data, selectedDate);
  const [reviewMood, setReviewMood] = useState<Mood | null>(day.mood);
  const [reviewNote, setReviewNote] = useState(day.note);

  useEffect(() => {
    setReviewMood(day.mood);
    setReviewNote(day.note);
  }, [dateKey, day.mood, day.note]);

  const current = timeline.find((activity) => activity.status === 'current');
  const next = timeline.find((activity) => activity.status === 'upcoming');
  const waterProgress = Math.min(100, Math.round((day.waterMl / data.profile.waterGoalMl) * 100));
  const waterGlasses = Math.round(day.waterMl / 250);
  const waterGoalGlasses = Math.round(data.profile.waterGoalMl / 250);
  const quote = ['Small promises, kept daily.', 'Make the next block count.', 'Consistency is a quiet superpower.', 'You do not need a perfect day.'][selectedDate.getDay() % 4];
  const studyToday = getSessionSeconds(data.sessions, dateKey, 'study');

  return (
    <div className="page page-today">
      <div className="page-heading today-heading">
        <div>
          <span className="eyebrow">{isToday ? greeting(now.getHours()) : 'Daily review'}</span>
          <h1>{data.profile.name}<span className="heading-dot">.</span></h1>
          <p className="page-subtitle">{formatDateTitle(selectedDate)} <span className="subtitle-separator">·</span> {isToday ? formatTimeFromDate(now) : 'Past timeline'}</p>
        </div>
        <div className="date-stamp" aria-label="Current date"><span>{selectedDate.getDate()}</span><small>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(selectedDate).toUpperCase()}</small></div>
      </div>

      <section className="week-strip" aria-label="This week">
        <div className="section-label">This week</div>
        <div className="week-days">
          {week.map((item, index) => {
            const date = getWeekDates(selectedDate)[index];
            const selected = item.dateKey === dateKey;
            return (
              <button className={`week-day ${selected ? 'is-selected' : ''}`} type="button" key={item.dateKey} onClick={() => onDateChange(item.dateKey)} aria-label={`${item.label} ${formatDateShort(date)}, ${item.percentage}% complete`}>
                <span>{item.label}</span>
                <strong>{date.getDate()}</strong>
                <i><b style={{ height: `${Math.max(4, item.percentage)}%` }} /></i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hero-grid">
        <div className="hero-progress surface-card">
          <div className="hero-progress-copy">
            <span className="eyebrow">Today’s progress</span>
            <strong>{progress.percentage}<small>%</small></strong>
            <span className="muted">{progress.completed} / {progress.total} actions complete</span>
          </div>
          <div className="progress-orb" style={{ '--progress': `${progress.percentage}%` } as CSSProperties} aria-label={`${progress.percentage}% complete`}><span>{progress.percentage}%</span></div>
        </div>
        <div className="quote-card surface-card">
          <span className="quote-mark">“</span>
          <p>{quote}</p>
          <span className="muted">A note for the day</span>
        </div>
      </section>

      <section className="focus-row">
        <div className="section-heading-inline"><div><span className="eyebrow">Right now</span><h2>Plan the next move</h2></div><span className="live-indicator"><i />{isToday ? 'Live' : 'Archive'}</span></div>
        <div className="focus-grid">
          <div className={`focus-card surface-card ${current ? 'focus-card-current' : ''}`}>
            <div className="focus-card-top"><span className="focus-label">Current</span><span className="focus-icon">{current?.icon ?? '·'}</span></div>
            {current ? <><h3>{current.title}</h3><p>{current.description}</p><span className="focus-time">{formatTime12(current.timeMinutes)} <span>→ {formatTime12(current.timeMinutes + current.durationMinutes)}</span></span><ActionButton activity={current} onStartTimer={onStartTimer} /></> : <><h3>Between blocks</h3><p>Take a breath. The next block will be ready when you are.</p></>}
          </div>
          <div className="focus-card surface-card focus-card-next">
            <div className="focus-card-top"><span className="focus-label">Next up</span><span className="focus-icon">→</span></div>
            {next ? <><h3>{next.title}</h3><p>{next.description}</p><span className="focus-time">{formatTime12(next.timeMinutes)} <span>in your timeline</span></span></> : <><h3>Day complete</h3><p>Review the day and set tomorrow up well.</p></>}
          </div>
        </div>
      </section>

      <section className="quick-grid">
        <div className="water-card surface-card">
          <div className="card-heading"><div><span className="eyebrow">Hydration</span><h2>Water</h2></div><span className="card-value">{(day.waterMl / 1000).toFixed(1)}<small> L</small></span></div>
          <div className="water-rail"><span style={{ width: `${waterProgress}%` }} /></div>
          <div className="water-meta"><span>{waterGlasses ? `${waterGlasses} / ${waterGoalGlasses} glasses` : 'Start with a glass'}</span><span>{waterProgress}%</span></div>
          <div className="water-actions"><button className="button button-primary button-small" type="button" onClick={() => onSaveWater(dateKey, day.waterMl + 250)}>+250 ml</button><button className="button button-secondary button-small" type="button" onClick={() => onSaveWater(dateKey, day.waterMl + 500)}>+500 ml</button><button className="button button-quiet button-small" type="button" onClick={() => onSaveWater(dateKey, Math.max(0, day.waterMl - 250))}>Undo</button></div>
        </div>
        <div className="quick-stat surface-card"><span className="eyebrow">Study today</span><strong>{formatDurationSeconds(studyToday)}</strong><span className="muted">Focus sessions logged</span><button className="text-link" type="button" onClick={() => onStartTimer('study', 'Study session')}>Start a session →</button></div>
      </section>

      <section className="timeline-section">
        <div className="section-heading-inline"><div><span className="eyebrow">The day, in order</span><h2>{isToday ? 'Daily timeline' : `${new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(selectedDate)} timeline`}</h2></div><button className="text-link" type="button" onClick={onOpenRoutine}>Edit routine →</button></div>
        <div className="timeline" role="list">
          {timeline.map((activity) => <TimelineItem key={activity.id} activity={activity} day={day} dateKey={dateKey} onToggleActivity={onToggleActivity} onToggleItem={onToggleItem} onSkipActivity={onSkipActivity} onStartTimer={onStartTimer} />)}
        </div>
      </section>

      <section className="review-card surface-card">
        <div><span className="eyebrow">Plan → Do → Track → Review</span><h2>How was the day?</h2><p className="muted">A two-minute check-in keeps the system honest.</p></div>
        <div className="mood-picker" role="group" aria-label="Day mood">
          {moodOptions.map((mood) => <button className={`mood-button ${reviewMood === mood.value ? 'is-selected' : ''}`} type="button" key={mood.value} onClick={() => setReviewMood(mood.value)} aria-label={mood.label} aria-pressed={reviewMood === mood.value}><span>{mood.icon}</span><small>{mood.label}</small></button>)}
        </div>
        <label className="field-label" htmlFor="review-note">Today was…</label>
        <textarea id="review-note" className="textarea" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="What helped? What gets easier tomorrow?" rows={3} />
        <div className="review-footer"><span className="muted">Saved locally on this device</span><button className="button button-primary" type="button" onClick={() => onSaveReview(dateKey, reviewMood, reviewNote)}>Save review</button></div>
      </section>
    </div>
  );
}

function ActionButton({ activity, onStartTimer }: { activity: RoutineActivity; onStartTimer: (kind: TimerKind, title: string) => void }) {
  if (!activity.action) return null;
  return <button className="button button-primary button-small" type="button" onClick={() => onStartTimer(activity.action as TimerKind, activity.title)}>Start {activity.action}</button>;
}

function TimelineItem({ activity, day, dateKey, onToggleActivity, onToggleItem, onSkipActivity, onStartTimer }: { activity: ReturnType<typeof buildTimeline>[number]; day: DayRecord; dateKey: string; onToggleActivity: (dateKey: string, activity: RoutineActivity) => void; onToggleItem: (dateKey: string, activity: RoutineActivity, itemId: string) => void; onSkipActivity: (dateKey: string, activity: RoutineActivity) => void; onStartTimer: (kind: TimerKind, title: string) => void }) {
  const allChecked = activity.totalItems > 0 && activity.completedItems === activity.totalItems;
  return (
    <article className={`timeline-item status-${activity.status}`} role="listitem">
      <div className="timeline-marker" aria-hidden="true"><span>{activity.icon}</span></div>
      <div className="timeline-time"><span>{formatTime12(activity.timeMinutes)}</span><small>{activity.durationMinutes} min</small></div>
      <div className="timeline-content surface-card">
        <div className="timeline-title-row"><div><span className="timeline-category">{activity.category}</span><h3>{activity.title}</h3></div><span className={`status-badge status-badge-${activity.status}`}>{statusLabel(activity.status)}</span></div>
        <p>{activity.description}</p>
        {activity.checklist.length > 0 && <div className="checklist">{activity.checklist.map((item) => { const checked = day.checkedItems[`${activity.id}:${item.id}`] === true; return <label className={`check-row ${checked ? 'is-checked' : ''}`} key={item.id}><input type="checkbox" checked={checked} onChange={() => onToggleItem(dateKey, activity, item.id)} /><span className="custom-check" aria-hidden="true">{checked ? '✓' : ''}</span><span>{item.title}</span></label>; })}</div>}
        <div className="timeline-actions"><button className={`button ${allChecked || activity.status === 'completed' ? 'button-done' : 'button-primary'} button-small`} type="button" onClick={() => onToggleActivity(dateKey, activity)}>{allChecked || activity.status === 'completed' ? 'Undo' : 'Complete'}</button>{activity.action && <button className="button button-secondary button-small" type="button" onClick={() => onStartTimer(activity.action as TimerKind, activity.title)}>Start {activity.action}</button>}<button className="text-button" type="button" onClick={() => onSkipActivity(dateKey, activity)}>{activity.status === 'skipped' ? 'Restore' : 'Skip'}</button></div>
      </div>
    </article>
  );
}
