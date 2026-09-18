import { useEffect, useMemo, useState } from 'react';
import { formatCompactDuration, formatDateTitle, formatDurationSeconds, formatTimeFromDate, formatTime12, getLocalDateKey } from '../lib/date';
import type { AppData, TimerKind, WorkoutExerciseLog } from '../lib/types';

interface WorkoutPageProps {
  data: AppData;
  now: Date;
  onStartTimer: (kind: TimerKind, title: string) => void;
  onUpdateWorkout: (recordId: string | null, exercises: WorkoutExerciseLog[]) => void;
}

const starterExercises = ['Lat Pulldown', 'Pull-Ups', 'Single-Arm Cable Pulldown', 'Chest-Supported Row', 'Cable Lateral Raise', 'Machine Lateral Raise', 'Reverse Pec Deck'];
const emptyExercise = (name = 'New exercise'): WorkoutExerciseLog => ({ id: `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, sets: 3, reps: 10, weight: 0, notes: '' });

export default function WorkoutPage({ data, now, onStartTimer, onUpdateWorkout }: WorkoutPageProps) {
  const dateKey = getLocalDateKey(now);
  const todayWorkout = data.workouts.filter((workout) => workout.dateKey === dateKey).sort((a, b) => b.startedAt - a.startedAt)[0];
  const [exercises, setExercises] = useState<WorkoutExerciseLog[]>(todayWorkout?.exercises.length ? todayWorkout.exercises : starterExercises.map(emptyExercise));
  const [restSeconds, setRestSeconds] = useState(0);
  const [resting, setResting] = useState(false);

  useEffect(() => {
    setExercises(todayWorkout?.exercises.length ? todayWorkout.exercises : starterExercises.map(emptyExercise));
  }, [todayWorkout?.id]);

  useEffect(() => {
    if (!resting) return undefined;
    const interval = window.setInterval(() => setRestSeconds((seconds) => { if (seconds <= 1) { setResting(false); return 0; } return seconds - 1; }), 1000);
    return () => window.clearInterval(interval);
  }, [resting]);

  const totalWorkoutSeconds = useMemo(() => data.workouts.filter((workout) => workout.dateKey === dateKey).reduce((sum, workout) => sum + workout.durationSeconds, 0), [data.workouts, dateKey]);
  const updateExercise = (id: string, patch: Partial<WorkoutExerciseLog>) => setExercises((current) => current.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise));

  return (
    <div className="page page-workout">
      <div className="page-heading"><div><span className="eyebrow">Train</span><h1>Workout<span className="heading-dot">.</span></h1><p className="page-subtitle">{formatDateTitle(now)} <span className="subtitle-separator">·</span> {formatTimeFromDate(now)}</p></div><button className="button button-primary" type="button" onClick={() => onStartTimer('workout', 'V-Taper')}>Start workout</button></div>
      <section className="workout-hero surface-card"><div className="workout-hero-copy"><span className="eyebrow">Tonight at 7:00 PM</span><h2>V-Taper</h2><p className="muted">A focused pull and shoulder session. Log enough to learn from the work.</p><div className="workout-meta"><span><strong>{exercises.length}</strong> exercises</span><span><strong>{formatCompactDuration(totalWorkoutSeconds)}</strong> today</span><span><strong>90s</strong> default rest</span></div></div><div className="workout-emblem">╳</div></section>
      <section className="workout-toolbar"><div><span className="eyebrow">Session log</span><h2>Track the work</h2></div><div className="toolbar-actions"><button className={`button ${resting ? 'button-done' : 'button-secondary'}`} type="button" onClick={() => { setRestSeconds(resting ? 0 : 90); setResting(!resting); }}>{resting ? `Rest ${Math.floor(restSeconds / 60)}:${String(restSeconds % 60).padStart(2, '0')}` : 'Start rest · 90s'}</button><button className="button button-secondary" type="button" onClick={() => setExercises((current) => [...current, emptyExercise()])}>+ Add exercise</button></div></section>
      <section className="exercise-list" aria-label="Workout exercises">
        {exercises.map((exercise, index) => <article className="exercise-row surface-card" key={exercise.id}><div className="exercise-index">{String(index + 1).padStart(2, '0')}</div><div className="exercise-fields"><input className="input exercise-name" value={exercise.name} onChange={(event) => updateExercise(exercise.id, { name: event.target.value })} aria-label={`Exercise ${index + 1} name`} /><div className="exercise-inputs"><label>Sets<input className="input" type="number" min="1" value={exercise.sets} onChange={(event) => updateExercise(exercise.id, { sets: Number(event.target.value) || 1 })} /></label><label>Reps<input className="input" type="number" min="1" value={exercise.reps} onChange={(event) => updateExercise(exercise.id, { reps: Number(event.target.value) || 1 })} /></label><label>Weight<input className="input" type="number" min="0" value={exercise.weight} onChange={(event) => updateExercise(exercise.id, { weight: Number(event.target.value) || 0 })} /></label></div><input className="input exercise-notes" value={exercise.notes} onChange={(event) => updateExercise(exercise.id, { notes: event.target.value })} placeholder="Notes, tempo, how it felt" aria-label={`${exercise.name} notes`} /></div><button className="icon-button danger-icon" type="button" onClick={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))} aria-label={`Remove ${exercise.name}`}>×</button></article>)}
      </section>
      <div className="save-bar"><span className="muted">{todayWorkout ? `Last logged ${formatTime12(new Date(todayWorkout.startedAt).getHours() * 60 + new Date(todayWorkout.startedAt).getMinutes())}` : 'No workout logged today yet'}</span><button className="button button-primary" type="button" onClick={() => onUpdateWorkout(todayWorkout?.id ?? null, exercises)}>Save workout log</button></div>
      <section className="past-workouts"><div className="section-heading-inline"><div><span className="eyebrow">History</span><h2>Recent sessions</h2></div></div>{data.workouts.length === 0 ? <div className="empty-state surface-card"><span className="empty-icon">╳</span><h3>No workout recorded yet.</h3><p>Start your first V-Taper session and it will appear here.</p><button className="button button-primary" type="button" onClick={() => onStartTimer('workout', 'V-Taper')}>Start workout</button></div> : <div className="history-list">{data.workouts.slice(-5).reverse().map((workout) => <div className="history-row surface-card" key={workout.id}><span className="history-date">{workout.dateKey}</span><strong>{workout.title}</strong><span className="muted">{formatDurationSeconds(workout.durationSeconds)} · {workout.exercises.length} exercises</span></div>)}</div>}</section>
    </div>
  );
}
