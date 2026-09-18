import type { Category, RoutineActivity } from './types';

const everyDay = [0, 1, 2, 3, 4, 5, 6];
const checklist = (items: string[], prefix: string) => items.map((title, index) => ({ id: `${prefix}-${index + 1}`, title }));

export function createDefaultRoutine(): RoutineActivity[] {
  return [
    {
      id: 'wake-up', title: 'Wake up', description: 'Start clean. Hydrate before the day gets loud.', timeMinutes: 540, durationMinutes: 30,
      category: 'sleep', icon: '☼', days: everyDay, checklist: checklist(['Wake up', 'Drink 1–2 glasses of water'], 'wake'), action: null, enabled: true, order: 1,
    },
    {
      id: 'breakfast', title: 'Breakfast', description: 'A steady first meal to set your energy baseline.', timeMinutes: 600, durationMinutes: 30,
      category: 'nutrition', icon: '◒', days: everyDay, checklist: checklist(['Ginger tea', '3 eggs', 'Toast / sandwich', '1 fruit'], 'breakfast'), action: null, enabled: true, order: 2,
    },
    {
      id: 'morning-study', title: 'Study', description: 'Protect the first focus block while your mind is fresh.', timeMinutes: 630, durationMinutes: 120,
      category: 'study', icon: '⌁', days: everyDay, checklist: [], action: 'study', enabled: true, order: 3,
    },
    {
      id: 'midday-gaming', title: 'Gaming', description: 'A deliberate break, not a runaway afternoon.', timeMinutes: 750, durationMinutes: 150,
      category: 'gaming', icon: '⌘', days: everyDay, checklist: [], action: 'gaming', enabled: true, order: 4,
    },
    {
      id: 'coaching', title: 'Coaching', description: 'Show up and make the hour count.', timeMinutes: 900, durationMinutes: 120,
      category: 'coaching', icon: '↗', days: [1, 3, 6], checklist: [], action: 'coaching', enabled: true, order: 5,
    },
    {
      id: 'free-time', title: 'Free time', description: 'Rest with intention. Reset before the evening.', timeMinutes: 1020, durationMinutes: 90,
      category: 'rest', icon: '—', days: everyDay, checklist: [], action: null, enabled: true, order: 6,
    },
    {
      id: 'pre-gym', title: 'Pre-gym meal', description: 'Small fuel, ready to train.', timeMinutes: 1110, durationMinutes: 30,
      category: 'nutrition', icon: '◒', days: everyDay, checklist: checklist(['3 eggs', 'Banana'], 'pre-gym'), action: null, enabled: true, order: 7,
    },
    {
      id: 'gym', title: 'Gym', description: 'V-Taper session. Log the work, then leave proud.', timeMinutes: 1140, durationMinutes: 180,
      category: 'workout', icon: '╳', days: everyDay, checklist: [], action: 'workout', enabled: true, order: 8,
    },
    {
      id: 'dinner', title: 'Dinner', description: 'Close the meal loop without overthinking it.', timeMinutes: 1320, durationMinutes: 60,
      category: 'nutrition', icon: '◒', days: everyDay, checklist: checklist(['Chicken', 'Vegetables / salad', 'Small rice portion', 'Garlic tea'], 'dinner'), action: null, enabled: true, order: 9,
    },
    {
      id: 'late-study', title: 'Late study', description: 'One more quiet block before the day turns over.', timeMinutes: 1380, durationMinutes: 60,
      category: 'study', icon: '⌁', days: everyDay, checklist: [], action: 'study', enabled: true, order: 10,
    },
    {
      id: 'late-gaming', title: 'Late gaming', description: 'Enjoy the final block, then keep the sleep promise.', timeMinutes: 0, durationMinutes: 90,
      category: 'gaming', icon: '⌘', days: everyDay, checklist: [], action: 'gaming', enabled: true, order: 11,
    },
    {
      id: 'sleep', title: 'Sleep', description: 'The reset that makes tomorrow possible.', timeMinutes: 90, durationMinutes: 450,
      category: 'sleep', icon: '◌', days: everyDay, checklist: [], action: null, enabled: true, order: 12,
    },
  ];
}

export function getActivitiesForDate(routine: RoutineActivity[], date: Date): RoutineActivity[] {
  return routine
    .filter((activity) => activity.enabled && activity.days.includes(date.getDay()))
    .sort((a, b) => a.order - b.order);
}

export function categoryLabel(category: Category): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function createActivityId(): string {
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
