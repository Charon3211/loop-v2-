import type { View } from '../lib/types';

interface NavigationProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

const items: Array<{ id: View; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: '◷' },
  { id: 'routine', label: 'Routine', icon: '☷' },
  { id: 'workout', label: 'Workout', icon: '╳' },
  { id: 'stats', label: 'Stats', icon: '↗' },
  { id: 'profile', label: 'Profile', icon: '○' },
];

export function Navigation({ activeView, onNavigate }: NavigationProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-inner">
        {items.map((item) => (
          <button
            className={`nav-item ${activeView === item.id ? 'is-active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
