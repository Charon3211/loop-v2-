import { formatCompactDuration, formatDateShort, formatDurationSeconds, formatTime12 } from '../lib/date';
import { calculateAchievements, getSessionSeconds, getStreak, getWeekProgress } from '../lib/metrics';
import type { AppData } from '../lib/types';

interface StatsPageProps {
  data: AppData;
  onOpenDay: (dateKey: string) => void;
}

export default function StatsPage({ data, onOpenDay }: StatsPageProps) {
  const week = getWeekProgress(data);
  const totalStudy = week.reduce((sum, day) => sum + day.studySeconds, 0);
  const totalCoaching = week.reduce((sum, day) => sum + day.coachingSeconds, 0);
  const workoutSessions = data.workouts.filter((workout) => week.some((day) => day.dateKey === workout.dateKey));
  const averageCompletion = Math.round(week.reduce((sum, day) => sum + day.percentage, 0) / week.length);
  const averageWater = Math.round(week.reduce((sum, day) => sum + day.waterMl, 0) / week.length);
  const plannedSleepMinutes = (data.profile.wakeTime - data.profile.sleepTime + 1440) % 1440;
  const achievements = calculateAchievements(data);
  const maxStudy = Math.max(1, ...week.map((day) => day.studySeconds));

  return (
    <div className="page page-stats">
      <div className="page-heading"><div><span className="eyebrow">Review</span><h1>Stats<span className="heading-dot">.</span></h1><p className="page-subtitle">Useful signals from the way you spend your days.</p></div><div className="stats-period">This week <span>⌄</span></div></div>
      <section className="stats-overview"><div className="overview-main surface-card"><span className="eyebrow">Routine average</span><div className="overview-number">{averageCompletion}<small>%</small></div><div className="overview-rail"><span style={{ width: `${averageCompletion}%` }} /></div><p className="muted">Across {week.filter((day) => day.percentage > 0).length || 0} days with activity</p></div><div className="mini-stat surface-card"><span className="eyebrow">Study</span><strong>{formatCompactDuration(totalStudy)}</strong><span className="muted">{Math.round(totalStudy / 3600 * 10) / 10} hours this week</span></div><div className="mini-stat surface-card"><span className="eyebrow">Gym</span><strong>{workoutSessions.length}</strong><span className="muted">sessions logged</span></div></section>

      <section className="stats-section"><div className="section-heading-inline"><div><span className="eyebrow">Weekly dashboard</span><h2>Every day leaves a trace</h2></div><span className="muted">Tap a day to open it</span></div><div className="weekly-chart surface-card">{week.map((day) => <button type="button" className="chart-day" key={day.dateKey} onClick={() => onOpenDay(day.dateKey)} aria-label={`Open ${day.label} ${formatDateShort(new Date(`${day.dateKey}T12:00:00`))}, ${day.percentage}% complete`}><span className="chart-bar-wrap"><i className="chart-bar-soft" style={{ height: `${Math.max(8, day.percentage)}%` }} /><i className="chart-bar-fill" style={{ height: `${Math.max(3, day.percentage)}%` }} /></span><strong>{day.percentage}%</strong><small>{day.label}</small></button>)}</div></section>

      <section className="stats-section"><div className="section-heading-inline"><div><span className="eyebrow">Focus rhythm</span><h2>Study time</h2></div><span className="muted">{formatDurationSeconds(totalStudy)} total</span></div><div className="focus-chart surface-card">{week.map((day) => <div className="focus-chart-day" key={day.dateKey}><div className="focus-chart-track"><span style={{ height: `${Math.max(day.studySeconds ? 5 : 0, (day.studySeconds / maxStudy) * 100)}%` }} /></div><strong>{day.studySeconds ? formatCompactDuration(day.studySeconds) : '—'}</strong><small>{day.label}</small></div>)}</div></section>

      <section className="stat-card-grid"><StatCard eyebrow="Coaching" value={formatCompactDuration(totalCoaching)} detail={`${Math.round(totalCoaching / 3600 * 10) / 10} hours · ${week.filter((day) => day.coachingSeconds > 0).length} sessions`} /><StatCard eyebrow="Water" value={`${(averageWater / 1000).toFixed(1)}L`} detail={`Average per day · ${Math.round((averageWater / data.profile.waterGoalMl) * 100)}% of goal`} /><StatCard eyebrow="Sleep plan" value={formatDurationSeconds(plannedSleepMinutes * 60)} detail={`${formatTime12(data.profile.sleepTime)} → ${formatTime12(data.profile.wakeTime)} · edit in Profile`} /></section>

      <section className="streaks-section"><div className="section-heading-inline"><div><span className="eyebrow">Keep the thread</span><h2>Streaks</h2></div><span className="muted">No pressure, just signal</span></div><div className="streak-grid"><Streak icon="✦" label="Daily routine" count={getStreak(data, 'routine')} /><Streak icon="⌁" label="Study" count={getStreak(data, 'study')} /><Streak icon="╳" label="Gym" count={getStreak(data, 'workout')} /><Streak icon="drop" label="Water" count={getStreak(data, 'water')} /></div></section>

      <section className="achievements-section"><div className="section-heading-inline"><div><span className="eyebrow">Milestones</span><h2>Achievements</h2></div></div><div className="achievement-grid">{achievements.map((achievement) => <div className={`achievement surface-card ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}`} key={achievement.title}><span className="achievement-icon">{achievement.icon}</span><div><strong>{achievement.title}</strong><p>{achievement.description}</p></div><span className="achievement-state">{achievement.unlocked ? 'Unlocked' : 'Locked'}</span></div>)}</div></section>
    </div>
  );
}

function StatCard({ eyebrow, value, detail }: { eyebrow: string; value: string; detail: string }) {
  return <div className="stat-card surface-card"><span className="eyebrow">{eyebrow}</span><strong>{value}</strong><span className="muted">{detail}</span></div>;
}

function Streak({ icon, label, count }: { icon: string; label: string; count: number }) {
  return <div className="streak-card surface-card"><span className="streak-icon">{icon === 'drop' ? '⌄' : icon}</span><strong>{count}<small> days</small></strong><span className="muted">{label}</span></div>;
}
