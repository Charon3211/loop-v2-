import { useEffect, useState } from 'react';
import { formatTime12, parseTime12 } from '../lib/date';
import type { AppData, Profile, Settings } from '../lib/types';

interface ProfilePageProps {
  data: AppData;
  onProfileChange: (profile: Profile) => void;
  onSettingsChange: (settings: Settings) => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onToast: (message: string) => void;
}

const timeInput = (minutes: number) => formatTime12(minutes);
const inputMinutes = (value: string, fallback: number) => parseTime12(value, fallback);

export default function ProfilePage({ data, onProfileChange, onSettingsChange, onExport, onImport, onReset, onToast }: ProfilePageProps) {
  const [profile, setProfile] = useState(data.profile);
  useEffect(() => setProfile(data.profile), [data.profile]);
  const save = () => { onProfileChange(profile); onToast('Profile saved'); };

  const handleAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { onToast('Choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 320;
        const scale = Math.min(1, size / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setProfile((current) => ({ ...current, avatarDataUrl: canvas.toDataURL('image/jpeg', 0.78) }));
        onToast('Photo ready · save your profile to keep it');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) { onToast('Notifications are not supported in this browser.'); return; }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission === 'granted') { onSettingsChange({ ...data.settings, notificationsEnabled: true }); onToast('Notifications enabled'); }
    else onToast('Notifications remain off');
  };

  return (
    <div className="page page-profile">
      <div className="page-heading"><div><span className="eyebrow">Your system</span><h1>Profile<span className="heading-dot">.</span></h1><p className="page-subtitle">Make the operating system feel like yours.</p></div><div className="local-badge"><span className="status-dot" />Stored locally</div></div>
      <section className="profile-hero surface-card"><div className="profile-avatar large">{profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt={`${profile.name} profile`} /> : <span>{profile.name.charAt(0).toUpperCase()}</span>}<label className="avatar-edit" aria-label="Upload profile image">+</label><input type="file" accept="image/*" onChange={(event) => handleAvatar(event.target.files?.[0])} /></div><div><span className="eyebrow">Personal operating system</span><h2>{profile.name || 'Your name'}</h2><p className="muted">{profile.tagline || 'Add a line that keeps you moving.'}</p></div></section>
      <section className="settings-section"><div className="section-heading-inline"><div><span className="eyebrow">Identity</span><h2>About you</h2></div></div><div className="settings-card surface-card"><div className="form-grid form-grid-two"><label className="field-label">Name<input className="input" value={profile.name} maxLength={60} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="field-label">Tagline<input className="input" value={profile.tagline} maxLength={120} onChange={(event) => setProfile({ ...profile, tagline: event.target.value })} /></label><label className="field-label">Wake-up time<input className="input" type="text" inputMode="text" placeholder="9:00 AM" value={timeInput(profile.wakeTime)} onChange={(event) => setProfile({ ...profile, wakeTime: inputMinutes(event.target.value, profile.wakeTime) })} /><small className="helper-text">The routine day rolls over after this time.</small></label><label className="field-label">Sleep time<input className="input" type="text" inputMode="text" placeholder="1:30 AM" value={timeInput(profile.sleepTime)} onChange={(event) => setProfile({ ...profile, sleepTime: inputMinutes(event.target.value, profile.sleepTime) })} /><small className="helper-text">Your planned reset window ends at wake-up.</small></label><label className="field-label">Daily water goal (ml)<input className="input" type="number" min="250" max="10000" value={profile.waterGoalMl} onChange={(event) => setProfile({ ...profile, waterGoalMl: Number(event.target.value) || 2000 })} /><small className="helper-text">Current goal: {Math.round(profile.waterGoalMl / 250)} glasses · {formatTime12(profile.sleepTime)} to {formatTime12(profile.wakeTime)} sleep plan.</small></label></div><div className="settings-footer"><span className="muted">Profile photo is resized before local storage.</span><button className="button button-primary" type="button" onClick={save}>Save profile</button></div></div></section>
      <section className="settings-section"><div className="section-heading-inline"><div><span className="eyebrow">Preferences</span><h2>Make it work for you</h2></div></div><div className="settings-card surface-card"><SettingToggle title="Gentle reminders" description="Keep optional reminder preferences ready for supported browsers." checked={data.settings.remindersEnabled} onChange={(checked) => onSettingsChange({ ...data.settings, remindersEnabled: checked })} /><SettingToggle title="Browser notifications" description="Permission is requested only when you turn this on." checked={data.settings.notificationsEnabled} onChange={(checked) => { if (checked) void requestNotifications(); else onSettingsChange({ ...data.settings, notificationsEnabled: false }); }} /><SettingToggle title="Reduce motion" description="Respect a calmer interface when transitions are not helpful." checked={data.settings.reduceMotion} onChange={(checked) => onSettingsChange({ ...data.settings, reduceMotion: checked })} /></div></section>
      <section className="settings-section"><div className="section-heading-inline"><div><span className="eyebrow">Your data</span><h2>Backup & recovery</h2></div></div><div className="data-actions surface-card"><div className="data-action"><div><strong>Export data</strong><p className="muted">Download every routine, session, review, and preference as JSON.</p></div><button className="button button-secondary" type="button" onClick={onExport}>Export JSON</button></div><div className="data-action"><div><strong>Import data</strong><p className="muted">Validate a Pulseboard backup before replacing local data.</p></div><button className="button button-secondary" type="button" onClick={onImport}>Import JSON</button></div><div className="data-action danger-action"><div><strong>Reset all data</strong><p className="muted">Restore the default routine and clear your local history.</p></div><button className="button button-danger" type="button" onClick={onReset}>Reset everything</button></div></div></section>
    </div>
  );
}

function SettingToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="switch-row"><span><strong>{title}</strong><small className="muted">{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="switch" /></label>;
}
