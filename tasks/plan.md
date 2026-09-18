# Implementation Plan: Pulseboard Personal Day OS

## Overview
Build a local-first, installable personal habit and routine dashboard centered on PLAN → DO → TRACK → REVIEW. The app will be a responsive React + TypeScript client with a validated localStorage-backed data model, a recurring routine engine, timer sessions, and focused views for Today, Routine, Workout, Stats, and Profile.

## Assumptions
- The target directory is a new project; no existing architecture or data migrations are required.
- localStorage is sufficient for the initial personal-data volume; profile images will be resized before storage.
- The first release uses client-side state and no backend; browser notifications are opt-in and best-effort.
- The default seeded day is the required routine, with coaching only on Monday, Wednesday, and Saturday.

## Architecture Decisions
- Vite + React + TypeScript for a fast offline-capable SPA with minimal runtime overhead.
- A single versioned `AppData` document in localStorage with defensive normalization on read/import.
- Pure date/time helpers use local calendar dates and minutes-from-midnight; display formatting is always 12-hour.
- CSS variables and plain CSS provide the design system; no heavy UI or chart dependency is needed.
- Timer sessions are stored as durable session records, while active timer state is persisted so reloads recover gracefully.

## Task List

### Phase 1: Foundation
- [ ] Task 1: Create project tooling, PWA shell, and base visual system.
- [ ] Task 2: Implement typed data model, default routine, validation, persistence, and date/time utilities.
- [ ] Task 3: Add the app shell with responsive navigation and shared UI primitives.

### Checkpoint: Foundation
- [ ] TypeScript and production build pass.
- [ ] App loads offline-capable shell without hydration/runtime errors.

### Phase 2: Core daily experience
- [ ] Task 4: Build Today header, progress summary, dynamic current/next activity, and recurring timeline.
- [ ] Task 5: Add completion/skip/undo state plus meal checklist tracking and water tracker.
- [ ] Task 6: Add study, gaming, and coaching focus timers with durable sessions.

### Checkpoint: Core experience
- [ ] Default schedule renders in 12-hour format and coaching appears only Mon/Wed/Sat.
- [ ] Refresh retains completion, water, and timer session data.

### Phase 3: Management and review
- [ ] Task 7: Build Routine editor for adding/editing/deleting/reordering recurring activities.
- [ ] Task 8: Build Workout page and connect workout activity to the Today timeline.
- [ ] Task 9: Build weekly Stats dashboard, trends, streaks, achievements, and daily review.
- [ ] Task 10: Build Profile/settings, image handling, notifications preference, import/export, and reset.

### Checkpoint: Complete
- [ ] All primary navigation views have useful empty states and working interactions.
- [ ] Build, typecheck, lint (if configured), and focused unit tests pass.
- [ ] Manual QA covers AM/PM boundaries, weekday coaching logic, refresh persistence, timers, and responsive layout.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| LocalStorage quota or malformed data | High | Versioned envelope, defensive normalization, image resizing, safe fallback to defaults. |
| Midnight/day-boundary timer behavior | High | Store timestamps, derive local date keys, avoid UTC date conversion for user-facing days. |
| Feature breadth causing a brittle monolith | Medium | Separate model/date/storage utilities from focused page components and use incremental checkpoints. |
| Offline/PWA differences by browser | Medium | Service worker is additive and defensive; core app remains functional without registration support. |

## Open Questions
- None blocking; sensible defaults are selected from the supplied product requirements.
