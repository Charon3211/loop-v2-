import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { formatTime12, parseTime12 } from '../lib/date';
import { categoryLabel, createActivityId } from '../lib/routine';
import type { Category, RoutineActivity, TimerKind } from '../lib/types';

interface RoutinePageProps {
  routine: RoutineActivity[];
  onChange: (routine: RoutineActivity[]) => void;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const categories: Category[] = ['sleep', 'nutrition', 'study', 'gaming', 'coaching', 'rest', 'workout', 'personal'];

const timeInput = (minutes: number) => formatTime12(minutes);
const inputMinutes = (value: string, fallback: number) => parseTime12(value, fallback);

function blankActivity(order: number): RoutineActivity {
  return { id: createActivityId(), title: '', description: '', timeMinutes: 540, durationMinutes: 30, category: 'personal', icon: '•', days: [0, 1, 2, 3, 4, 5, 6], checklist: [], action: null, enabled: true, order };
}

export default function RoutinePage({ routine, onChange }: RoutinePageProps) {
  const sorted = useMemo(() => [...routine].sort((a, b) => a.order - b.order), [routine]);
  const [editing, setEditing] = useState<RoutineActivity | null | undefined>(undefined);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((activity, itemIndex) => ({ ...activity, order: itemIndex + 1 })));
  };

  const saveActivity = (activity: RoutineActivity) => {
    if (!activity.title.trim()) return;
    const exists = routine.some((item) => item.id === activity.id);
    onChange(exists ? routine.map((item) => item.id === activity.id ? { ...activity, title: activity.title.trim() } : item) : [...routine, { ...activity, title: activity.title.trim(), order: routine.length + 1 }]);
    setEditing(undefined);
  };

  const remove = (activity: RoutineActivity) => {
    if (!window.confirm(`Remove ${activity.title} from your routine?`)) return;
    onChange(routine.filter((item) => item.id !== activity.id).map((item, index) => ({ ...item, order: index + 1 })));
  };

  return (
    <div className="page page-routine">
      <div className="page-heading"><div><span className="eyebrow">Plan</span><h1>Routine<span className="heading-dot">.</span></h1><p className="page-subtitle">Shape the rhythm. Keep the important parts visible.</p></div><button className="button button-primary" type="button" onClick={() => setEditing(blankActivity(routine.length + 1))}>+ Add activity</button></div>
      <section className="routine-intro surface-card"><div className="routine-intro-mark">☷</div><div><span className="eyebrow">Recurring schedule</span><h2>One system, every day</h2><p className="muted">Your timeline adapts by weekday. Coaching is already limited to Monday, Wednesday, and Saturday.</p></div><div className="routine-count"><strong>{routine.filter((item) => item.enabled).length}</strong><span>active blocks</span></div></section>
      <section className="routine-list" aria-label="Routine activities">
        {sorted.map((activity, index) => <article className={`routine-row surface-card ${activity.enabled ? '' : 'is-disabled'}`} key={activity.id}><div className="routine-order"><button type="button" className="icon-button tiny" onClick={() => move(index, -1)} aria-label={`Move ${activity.title} up`}>↑</button><span>{String(index + 1).padStart(2, '0')}</span><button type="button" className="icon-button tiny" onClick={() => move(index, 1)} aria-label={`Move ${activity.title} down`}>↓</button></div><div className="routine-icon">{activity.icon}</div><div className="routine-main"><div className="routine-row-heading"><h3>{activity.title || 'Untitled activity'}</h3><span className="category-chip">{categoryLabel(activity.category)}</span></div><p className="muted">{formatTime12(activity.timeMinutes)} <span>·</span> {activity.durationMinutes} min <span>·</span> {activity.days.length === 7 ? 'Every day' : activity.days.map((day) => dayLabels[day]).join(' ')}</p>{activity.description && <p className="routine-description">{activity.description}</p>}</div><div className="routine-actions"><button className="text-button" type="button" onClick={() => setEditing({ ...activity, checklist: activity.checklist.map((item) => ({ ...item })) })}>Edit</button><button className="text-button danger-text" type="button" onClick={() => remove(activity)}>Delete</button></div></article>)}
      </section>
      {editing !== undefined && <RoutineEditor activity={editing} onClose={() => setEditing(undefined)} onSave={saveActivity} />}
    </div>
  );
}

function RoutineEditor({ activity: initial, onClose, onSave }: { activity: RoutineActivity | null; onClose: () => void; onSave: (activity: RoutineActivity) => void }) {
  const [activity, setActivity] = useState<RoutineActivity>(initial ?? blankActivity(1));
  const set = <K extends keyof RoutineActivity>(key: K, value: RoutineActivity[K]) => setActivity((previous) => ({ ...previous, [key]: value }));
  const isCoaching = activity.id === 'coaching' && activity.title === 'Coaching';
  return <Modal title={initial ? 'Edit activity' : 'New activity'} eyebrow="Routine editor" onClose={onClose} wide>
    <div className="form-grid form-grid-two">
      <label className="field-label">Name<input className="input" value={activity.title} onChange={(event) => set('title', event.target.value)} placeholder="Study block" autoFocus /></label>
      <label className="field-label">Time<input className="input" type="text" inputMode="text" placeholder="10:30 AM" value={timeInput(activity.timeMinutes)} onChange={(event) => set('timeMinutes', inputMinutes(event.target.value, activity.timeMinutes))} /></label>
      <label className="field-label">Duration (minutes)<input className="input" type="number" min="5" max="1440" value={activity.durationMinutes} onChange={(event) => set('durationMinutes', Number(event.target.value) || 5)} /></label>
      <label className="field-label">Category<select className="input" value={activity.category} onChange={(event) => set('category', event.target.value as Category)}>{categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}</select></label>
      <label className="field-label">Icon<input className="input" value={activity.icon} maxLength={4} onChange={(event) => set('icon', event.target.value)} /></label>
      <label className="field-label">Focus action<select className="input" value={activity.action ?? ''} onChange={(event) => set('action', (event.target.value || null) as TimerKind | null)}><option value="">No timer</option><option value="study">Study timer</option><option value="gaming">Gaming timer</option><option value="coaching">Coaching timer</option><option value="workout">Workout timer</option></select></label>
    </div>
    <label className="field-label">Description<textarea className="textarea" rows={2} value={activity.description} onChange={(event) => set('description', event.target.value)} placeholder="What does this block protect?" /></label>
    <fieldset className="days-fieldset"><legend className="field-label">Days</legend><div className="day-checkboxes">{dayNames.map((name, index) => <label className="day-checkbox" key={name}><input type="checkbox" checked={activity.days.includes(index)} disabled={isCoaching} onChange={() => set('days', activity.days.includes(index) ? activity.days.filter((day) => day !== index) : [...activity.days, index].sort())} /><span>{dayLabels[index]}</span><small>{name}</small></label>)}</div>{isCoaching && <p className="helper-text">Coaching stays on Monday, Wednesday, and Saturday by default. You can change this once it’s renamed.</p>}</fieldset>
    <label className="field-label">Checklist items <span className="muted">one per line</span><textarea className="textarea" rows={4} value={activity.checklist.map((item) => item.title).join('\n')} onChange={(event) => set('checklist', event.target.value.split('\n').map((title, index) => ({ id: activity.checklist[index]?.id ?? `${activity.id}-item-${index + 1}`, title: title.trim() })).filter((item) => item.title))} placeholder={'Drink water\nOpen notes'} /></label>
    <label className="switch-row"><span><strong>Active in routine</strong><small className="muted">Hide without deleting this block.</small></span><input type="checkbox" checked={activity.enabled} onChange={(event) => set('enabled', event.target.checked)} /><span className="switch" /></label>
    <div className="modal-footer"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={() => onSave(activity)} disabled={!activity.title.trim()}>Save activity</button></div>
  </Modal>;
}
