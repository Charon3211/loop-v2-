import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './components/Modal';
import { Navigation } from './components/Navigation';
import { TimerOverlay } from './components/TimerOverlay';
import { formatTimeFromDate, getLocalDateKey } from './lib/date';
import { getActiveTimerElapsed } from './lib/timer';
import { getActivitiesForDate } from './lib/routine';
import { createEmptyDayRecord, createDefaultData, loadAppData, normalizeAppData, saveAppData } from './lib/storage';
import type { ActiveTimer, AppData, DayRecord, RoutineActivity, Settings, TimerKind, View, WorkoutExerciseLog } from './lib/types';
import TodayPage from './pages/TodayPage';
import RoutinePage from './pages/RoutinePage';
import WorkoutPage from './pages/WorkoutPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [view, setView] = useState<View>('today');
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateKey());
  const [now, setNow] = useState(() => new Date());
  const [timerExpanded, setTimerExpanded] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const sentReminders = useRef(new Set<string>());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data.settings.remindersEnabled || !data.settings.notificationsEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const dateKey = getLocalDateKey(now);
    const minute = now.getHours() * 60 + now.getMinutes();
    const activity = getActivitiesForDate(data.routine, now).find((item) => item.timeMinutes === minute);
    if (!activity) return;
    const reminderKey = `${dateKey}:${activity.id}`;
    if (sentReminders.current.has(reminderKey)) return;
    sentReminders.current.add(reminderKey);
    new Notification(`${activity.title} · ${formatTimeFromDate(now)}`, { body: activity.description || 'Your next block is ready.', icon: '/icon.svg' });
  }, [data.routine, data.settings.notificationsEnabled, data.settings.remindersEnabled, now]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const commit = useCallback((updater: (previous: AppData) => AppData) => {
    setData((previous) => {
      const next = updater(previous);
      saveAppData(next);
      return next;
    });
  }, []);

  const updateDay = useCallback((dateKey: string, updater: (day: DayRecord) => DayRecord) => {
    commit((previous) => {
      const day = previous.days[dateKey] ?? createEmptyDayRecord(dateKey);
      return { ...previous, days: { ...previous.days, [dateKey]: updater(day) } };
    });
  }, [commit]);

  const updateProfile = useCallback((profile: AppData['profile']) => commit((previous) => ({ ...previous, profile })), [commit]);
  const updateSettings = useCallback((settings: Settings) => commit((previous) => ({ ...previous, settings })), [commit]);
  const updateWater = useCallback((dateKey: string, waterMl: number) => updateDay(dateKey, (day) => ({ ...day, waterMl: Math.max(0, waterMl) })), [updateDay]);

  const startTimer = useCallback((kind: TimerKind, title: string) => {
    if (data.activeTimer) {
      setToast('Finish the active session before starting another.');
      setTimerExpanded(true);
      return;
    }
    const timer: ActiveTimer = { kind, title, dateKey: getLocalDateKey(), startedAt: Date.now(), pausedAt: null, pausedSeconds: 0 };
    commit((previous) => ({ ...previous, activeTimer: timer }));
    setTimerExpanded(true);
    setToast(`${title} started`);
  }, [commit, data.activeTimer]);

  const pauseTimer = useCallback(() => {
    if (!data.activeTimer || data.activeTimer.pausedAt) return;
    commit((previous) => previous.activeTimer ? ({ ...previous, activeTimer: { ...previous.activeTimer, pausedAt: Date.now() } }) : previous);
  }, [commit, data.activeTimer]);

  const resumeTimer = useCallback(() => {
    if (!data.activeTimer?.pausedAt) return;
    const pausedSeconds = data.activeTimer.pausedSeconds + Math.floor((Date.now() - data.activeTimer.pausedAt) / 1000);
    commit((previous) => previous.activeTimer ? ({ ...previous, activeTimer: { ...previous.activeTimer, pausedAt: null, pausedSeconds } }) : previous);
  }, [commit, data.activeTimer]);

  const finishTimer = useCallback(() => {
    const timer = data.activeTimer;
    if (!timer) return;
    const endedAt = Date.now();
    const durationSeconds = getActiveTimerElapsed(timer, endedAt);
    const session = { id: createId('session'), kind: timer.kind, title: timer.title, dateKey: timer.dateKey, startedAt: timer.startedAt, endedAt, durationSeconds };
    commit((previous) => ({
      ...previous,
      activeTimer: null,
      sessions: [...previous.sessions, session],
      workouts: timer.kind === 'workout' ? [...previous.workouts, { id: createId('workout'), dateKey: timer.dateKey, title: timer.title, startedAt: timer.startedAt, endedAt, durationSeconds, exercises: [] }] : previous.workouts,
    }));
    setTimerExpanded(false);
    setToast(`${timer.title} saved · ${Math.max(1, Math.round(durationSeconds / 60))} min`);
  }, [commit, data.activeTimer]);

  const toggleActivity = useCallback((dateKey: string, activity: RoutineActivity) => {
    updateDay(dateKey, (day) => {
      const isComplete = day.completedActivityIds.includes(activity.id);
      const completedActivityIds = isComplete ? day.completedActivityIds.filter((id) => id !== activity.id) : [...day.completedActivityIds, activity.id];
      const skippedActivityIds = day.skippedActivityIds.filter((id) => id !== activity.id);
      const checkedItems = { ...day.checkedItems };
      activity.checklist.forEach((item) => { checkedItems[`${activity.id}:${item.id}`] = !isComplete; });
      return { ...day, completedActivityIds, skippedActivityIds, checkedItems };
    });
  }, [updateDay]);

  const toggleChecklistItem = useCallback((dateKey: string, activity: RoutineActivity, itemId: string) => {
    updateDay(dateKey, (day) => {
      const key = `${activity.id}:${itemId}`;
      const checkedItems = { ...day.checkedItems, [key]: !day.checkedItems[key] };
      const allChecked = activity.checklist.length > 0 && activity.checklist.every((item) => checkedItems[`${activity.id}:${item.id}`]);
      const completedActivityIds = allChecked ? [...new Set([...day.completedActivityIds, activity.id])] : day.completedActivityIds.filter((id) => id !== activity.id);
      return { ...day, checkedItems, completedActivityIds, skippedActivityIds: day.skippedActivityIds.filter((id) => id !== activity.id) };
    });
  }, [updateDay]);

  const skipActivity = useCallback((dateKey: string, activity: RoutineActivity) => {
    updateDay(dateKey, (day) => {
      const isSkipped = day.skippedActivityIds.includes(activity.id);
      return { ...day, skippedActivityIds: isSkipped ? day.skippedActivityIds.filter((id) => id !== activity.id) : [...day.skippedActivityIds, activity.id], completedActivityIds: isSkipped ? day.completedActivityIds : day.completedActivityIds.filter((id) => id !== activity.id) };
    });
  }, [updateDay]);

  const saveReview = useCallback((dateKey: string, mood: DayRecord['mood'], note: string) => {
    updateDay(dateKey, (day) => ({ ...day, mood, note }));
    commit((previous) => ({ ...previous, reviews: { ...previous.reviews, [dateKey]: { mood, note } } }));
    setToast('Daily review saved');
  }, [commit, updateDay]);

  const updateWorkout = useCallback((recordId: string | null, exercises: WorkoutExerciseLog[]) => {
    commit((previous) => {
      if (recordId) return { ...previous, workouts: previous.workouts.map((workout) => workout.id === recordId ? { ...workout, exercises } : workout) };
      const dateKey = getLocalDateKey();
      return { ...previous, workouts: [...previous.workouts, { id: createId('workout'), dateKey, title: 'V-Taper', startedAt: Date.now(), endedAt: null, durationSeconds: 0, exercises }] };
    });
    setToast('Workout log saved');
  }, [commit]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pulseboard-backup-${getLocalDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast('Backup exported');
  }, [data]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalizeAppData(JSON.parse(String(reader.result)));
        if (!window.confirm('Replace your current Pulseboard data with this backup?')) return;
        commit(() => parsed);
        setImportDialogOpen(false);
        setToast('Backup imported safely');
      } catch {
        setToast('That backup could not be read. Your current data is safe.');
      }
    };
    reader.onerror = () => setToast('The backup file could not be opened.');
    reader.readAsText(file);
  }, [commit]);

  const resetData = useCallback(() => {
    if (!window.confirm('Reset all Pulseboard data? This cannot be undone.')) return;
    const fresh = createDefaultData();
    commit(() => fresh);
    setSelectedDateKey(getLocalDateKey());
    setToast('Pulseboard reset to the default routine');
  }, [commit]);

  const activeView = useMemo(() => {
    switch (view) {
      case 'routine': return <RoutinePage routine={data.routine} onChange={(routine) => commit((previous) => ({ ...previous, routine }))} />;
      case 'workout': return <WorkoutPage data={data} now={now} onStartTimer={startTimer} onUpdateWorkout={updateWorkout} />;
      case 'stats': return <StatsPage data={data} onOpenDay={(dateKey) => { setSelectedDateKey(dateKey); setView('today'); }} />;
      case 'profile': return <ProfilePage data={data} onProfileChange={updateProfile} onSettingsChange={updateSettings} onExport={exportData} onImport={() => setImportDialogOpen(true)} onReset={resetData} onToast={setToast} />;
      case 'today':
      default:
        return <TodayPage data={data} dateKey={selectedDateKey} now={now} onDateChange={setSelectedDateKey} onToggleActivity={toggleActivity} onToggleItem={toggleChecklistItem} onSkipActivity={skipActivity} onStartTimer={startTimer} onSaveWater={updateWater} onSaveReview={saveReview} onOpenRoutine={() => setView('routine')} />;
    }
  }, [data, exportData, now, resetData, selectedDateKey, startTimer, toggleActivity, toggleChecklistItem, skipActivity, updateWater, saveReview, updateProfile, updateSettings, updateWorkout, commit, view]);

  return (
    <div className={`app-shell ${data.settings.reduceMotion ? 'reduce-motion' : ''}`}>
      <aside className="desktop-rail">
        <div className="brand-mark"><span className="brand-symbol">✓</span><span>pulseboard</span></div>
        <div className="rail-caption">Your personal day OS</div>
        <Navigation activeView={view} onNavigate={setView} />
        <div className="rail-footer"><span className="status-dot" />Local-first · always yours</div>
      </aside>
      <main className="main-content">
        <header className="mobile-topbar">
          <div className="brand-mark"><span className="brand-symbol">✓</span><span>pulseboard</span></div>
          <button className="avatar-button" type="button" onClick={() => setView('profile')} aria-label="Open profile">
            {data.profile.avatarDataUrl ? <img src={data.profile.avatarDataUrl} alt="" /> : <span>{data.profile.name.charAt(0).toUpperCase()}</span>}
          </button>
        </header>
        {activeView}
      </main>
      {data.activeTimer && <TimerOverlay timer={data.activeTimer} now={now.getTime()} expanded={timerExpanded} onPause={pauseTimer} onResume={resumeTimer} onFinish={finishTimer} onMinimize={() => setTimerExpanded((expanded) => !expanded)} />}
      <Navigation activeView={view} onNavigate={setView} />
      {toast && <div className="toast" role="status">{toast}</div>}
      {importDialogOpen && (
        <Modal title="Import backup" eyebrow="Data safety" onClose={() => setImportDialogOpen(false)}>
          <p className="modal-copy">Your valid records will be restored and malformed records will be ignored. Existing data will be replaced.</p>
          <label className="file-drop">
            <span className="file-drop-icon">↑</span>
            <strong>Choose a JSON backup</strong>
            <span className="muted">Validated before it touches your data</span>
            <input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importData(file); }} />
          </label>
        </Modal>
      )}
    </div>
  );
}

export default App;
