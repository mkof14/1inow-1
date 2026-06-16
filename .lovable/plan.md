# Digital Invest Compass — Rebrand & Premium Redesign

This is a large, multi-wave refactor. I'll execute it in **3 waves** so each one ships fully working code instead of a half-built theme. Confirm and I start with Wave 1 immediately.

---

## Wave 1 — Brand, Visual System, Navigation, Command View

**Rebrand**
- Rename app everywhere: `Digital Invest Compass` (auth page, sidebar header, document title, OG meta).
- Strip forbidden words (`OS`, `Workspace`, `Platform`, `Hub`, `Ecosystem`, `Operating System`) from all UI strings + i18n dictionaries (EN/UK/RU).
- Rename sections in `nav-config.ts` + route titles:
  Dashboard→Command View · Projects→Portfolio · Tasks→Execution · Communication→Signals · Calendar→Timeline · Teams/People→People · Documents→Knowledge · Files→Vault · Approvals→Decisions · Reports→Intelligence · Admin→Control · AI→Advisor.
- Update i18n keys `nav.*` for all 3 languages.

**Visual system (`src/styles.css`)**
- New token palette:
  - Light: warm-white `oklch(0.985 0.005 80)` bg, graphite `oklch(0.22 0.01 250)` text, deep-navy panels, soft-blue accent, muted-cyan highlight, platinum dividers.
  - Dark: deep graphite bg, navy-black surfaces, soft-cyan glow, platinum text.
- Add semantic tokens: `--surface-panel`, `--surface-raised`, `--accent-signal`, `--accent-decision`, `--accent-blocker`, `--divider-platinum`, `--glow-cyan`, `--gradient-compass`.
- Typography pair: **Instrument Serif** (display) + **Inter Tight** (UI) loaded via `<link>` in `__root.tsx`.
- Motion utilities: `compass-spin`, `signal-pulse`, `pulse-dot`, `slide-inspector`, `fade-rise` keyframes.

**Custom icon library** (`src/components/icons/compass-icons.tsx`)
- Hand-built SVG components: `CompassMark`, `DirectionArrow`, `SignalWave`, `OrbitRing`, `CommandMarker`, `RoutePath`, `ExecutionNode`, `DecisionDiamond`, `TimelinePulse`, `PortfolioCard`, `SignalLens`, `VaultMark`, `ShieldLine`, `AdvisorRing`.
- Replace lucide icons in sidebar nav, AI buttons, message-type badges, favorites star (compass-mark fill state).

**Sidebar**
- Compact 64px collapsed / 240px expanded.
- Custom icons per section, subtle active state with cyan glow line on the left edge.
- Bottom block: language switcher · settings · help · user profile chip.

**Command View (`/dashboard` → re-themed)**
- 12-column grid with: Portfolio Health card (sparkline), Live Signals feed, Critical Execution list, Overdue Decisions, Project Momentum chart, People Capacity bars, Upcoming Timeline strip, Unread Executive Messages, Risk Map heatmap, Recent Decisions, Weekly Direction note, Advisor Summary card.
- Real queries where data exists; structured "no data yet" empty states (not placeholders) elsewhere with primary action button.

---

## Wave 2 — Portfolio, Execution, Signals, Decisions, People, Timeline

- **Portfolio** (`/projects` → re-route to `/portfolio` alias kept): premium project cards (logo, name, status pill, owner, health ring, progress bar, risk dot, next milestone, unread signals badge, open decisions badge). Views: Grid · Table · Timeline · Risk Map · Owner · Stage. Full CRUD + archive/restore/duplicate, filters, search.
- **Project Detail**: tabs Overview · Execution · Signals · Decisions · Timeline · Knowledge · Vault · People · Intelligence · Settings. Overview composed of 12 widget cards listed in brief.
- **Execution**: List/Board/Table/Timeline/Gantt/Workload views. Right-side **Task Inspector** drawer with full inspector fields (title, status, assignee, priority, project, deadline, description, checklist, subtasks, comments, linked signals/decisions, files, activity).
- **Signals**: extend existing comm UI with subtle markers (signal dot, decision diamond, blocker bar, route tag, pulse) instead of generic icons. Add saved/pinned/announcements tabs. Wire convert-to-task and convert-to-decision actions to real tables.
- **Decisions**: new page + table `decisions` with status (pending/approved/rejected), impact, owner, linked project/task/signal, approval trail, review date. CRUD + filters by status/project/CEO-queue.
- **People**: views Grid · Table · Timezone Map · Workload · Role Matrix.
- **Timeline**: Day/Week/Month/Agenda/Portfolio views over `tasks.due_date` + `meetings` + decisions + milestones.

---

## Wave 3 — Knowledge, Vault, Intelligence, Advisor, Control, Roles, Seed Data

- **Knowledge**: docs/wiki tree with multilingual versions (uses existing `document_translations`).
- **Vault**: file browser on Supabase Storage `vault` bucket, folders per project, upload/preview/delete/restore/versions/permissions/tags.
- **Intelligence**: report templates (executive, project, people, communication, task, risk, decision) rendered as premium charts (Recharts) styled with new tokens.
- **Advisor**: rename routes/labels, custom `AdvisorRing` icon, prompt panel with actions (summarize portfolio/project/signals, extract decisions, find blockers, generate report, create roadmap, suggest next actions, translate, prepare executive update) calling existing `ai-gateway` server functions.
- **Control**: sub-pages for Users · Roles · Permissions · Departments · Teams · Languages · Project Settings · Audit Logs · Security · Integrations · Trash · System. Visual permission matrix (roles × resources × actions).
- **Roles**: extend `app_role` enum with `ceo`, `portfolio_manager`, `project_manager`, `team_lead`, `contractor`, `client`, `investor`, `guest`. CRUD for roles + assignments.
- **Demo seed migration**: 10 projects (Digital Invest, AGRON, BioMath Core, SAVEN, Adamas Materials, Origin Diamond, Abu Mall, MyDay, TableServed, TerraAero) each with tasks, signals, decisions, milestones, files, people, reports, risks, activity.

---

## Technical notes
- All colors via design tokens — no hex/`text-white`/`bg-black` in components.
- All CRUD via TanStack server functions (`*.functions.ts`) guarded by `requireSupabaseAuth`.
- New tables (decisions, milestones, risks, meetings, role assignments) ship with GRANT + RLS via `has_role`.
- i18n: every new label gets EN/UK/RU keys before shipping.
- No generic sparkle/star icons in Advisor or favorites — replaced with `AdvisorRing` and `CompassMark`.

---

## Output of each wave
Wave 1: brand swap + visual tokens + custom icons + sidebar + Command View — app already feels like Compass.
Wave 2: core operational pages fully functional.
Wave 3: knowledge/intelligence/control + roles + demo data — production-feeling.

Reply **"Start Wave 1"** (or name a different starting wave) and I begin building.
