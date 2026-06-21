# Phase 2 Development Plan

## 1. Current Baseline

The current `main` branch is the clean production base for the next development phase.

Baseline facts:

- Lovable platform dependencies have been removed.
- The production build is successful.
- The production base tag is `v0.1.0-production-base`.
- AI routes are safe stubs.
- No external AI provider is connected yet.
- No OpenAI, Anthropic, Gemini, Resend, Stripe, analytics, or monitoring integration is connected yet.

Current AI route state:

- `/api/chat`: placeholder JSON response only.
- `/api/stt`: disabled with `501 Not Implemented`.
- `/api/tts`: disabled with `501 Not Implemented`.

## 2. Phase 2 Objective

Phase 2 should prepare the real product foundation for 1inow without changing the visual design.

The goal is to strengthen the core application architecture, data model, authentication flow, permissions model, project/task engine, admin foundation, and future integration boundaries while preserving the current UI and route experience.

Phase 2 is a functional foundation phase, not a redesign phase.

## 3. Development Boundaries

Phase 2 must follow these boundaries:

- Preserve the existing UI and design.
- Preserve existing routes unless a later task explicitly changes them.
- Do not introduce a new styling system.
- Do not redesign screens, layouts, cards, navigation, colors, typography, or visual hierarchy.
- Do not edit existing page language or content unless explicitly requested.
- Code changes must be functional only.
- Keep cleanup work separate from feature development.
- Keep database planning separate from migrations until a migration task is explicitly approved.
- Keep external provider planning separate from provider implementation.

Any visual or content change must be treated as a separate product/design task.

## 4. Phase 2 Modules

### Authentication

Stabilize session handling, protected routes, sign-in behavior, sign-out behavior, and server-side auth checks.

### Profiles

Define the profile lifecycle around authenticated users, user metadata, display identity, language preferences, timezone, and profile completion.

### Organizations

Prepare the organization model for multi-user workspaces, ownership, membership, organization settings, and future billing scope.

### Roles and Permissions

Define role-based access control for system, organization, project, and admin actions.

Planned roles:

- `super_admin`
- `admin`
- `manager`
- `member`
- `viewer`

### Projects

Stabilize the project model as the primary work container.

Planned capabilities:

- Project ownership
- Project membership
- Project status
- Project health
- Project progress
- Project activity

### Tasks

Stabilize the task model as the primary executable work item.

Planned capabilities:

- Task status
- Priority
- Assignee
- Due date
- Project relationship
- Activity history

### Subtasks

Prepare nested task support without changing UI until explicitly requested.

Planned capabilities:

- Parent task relationship
- Status
- Assignee
- Sort order

### Comments

Prepare task and project discussion support.

Planned capabilities:

- Author
- Body
- Mentions later
- Edit metadata later
- Soft delete later

### Files and Attachments

Prepare file metadata and attachment relationships.

Planned capabilities:

- Project attachments
- Task attachments
- Owner
- Storage path
- Access scope

### Notifications

Prepare in-app notifications first.

Planned capabilities:

- Recipient
- Notification type
- Related entity
- Read state
- Delivery status

Email, push, and SMS should remain later phases.

### Admin Panel

Prepare the admin foundation for system and organization governance.

Planned areas:

- Users
- Organizations
- Roles
- Permissions
- System settings
- Audit logs

### Settings

Stabilize user and workspace settings.

Planned settings:

- User preferences
- Locale
- Timezone
- Notification preferences
- Organization defaults
- Feature flags later

### Audit Logs

Prepare audit logging for sensitive and administrative actions.

Planned audit subjects:

- User changes
- Role changes
- Permission changes
- Project changes
- Task changes
- Admin actions
- Future AI actions

### Future AI Layer

AI remains intentionally disconnected during Phase 2 foundation work.

Phase 2 should only prepare boundaries for future AI:

- AI gateway shape
- Model router planning
- Permission checks
- Audit logging
- Cost and rate-limit planning

No external AI service should be connected in this phase without explicit approval.

## 5. Implementation Order

### Step 1: Data Model Review

Audit the current Supabase usage, existing table assumptions, generated types, and frontend data access patterns.

Output should be a review document only unless a migration task is explicitly approved.

### Step 2: Auth and Profile Stabilization

Review and stabilize:

- Auth provider usage
- Protected route handling
- Server auth middleware
- Profile loading
- Profile creation assumptions
- Sign-in and sign-out behavior

### Step 3: Organization and Team Model

Define the organization and team model before adding new behavior.

Review:

- Organization ownership
- Membership
- Team relationships
- Project ownership scope
- Profile-to-organization relationship

### Step 4: Permissions and RBAC

Define role and permission checks before expanding admin or project management behavior.

Review:

- Role names
- Permission scopes
- Admin-only actions
- Project-level actions
- Viewer restrictions

### Step 5: Project and Task Engine

Stabilize core project and task behavior.

Review:

- Project creation
- Project updates
- Task creation
- Task updates
- Task status transitions
- Assignees
- Due dates
- Activity logs

### Step 6: Admin Foundation

Stabilize admin structure after RBAC is defined.

Review:

- User management
- Organization management
- Role assignment
- Permission visibility
- System settings
- Audit log access

### Step 7: Notification Foundation

Prepare in-app notifications first.

Review:

- Notification creation
- Recipient rules
- Read state
- Related entity linking
- Future delivery channel boundaries

### Step 8: Future AI Gateway Planning Only

Plan the future AI layer without connecting providers.

Review:

- `/api/ai` route group shape
- Internal AI gateway boundary
- Model router design
- User-level AI permissions
- AI audit log requirements
- Provider cost and rate-limit controls

## 6. Supabase Planning

Tables likely needed later:

- `profiles`
- `organizations`
- `organization_members`
- `roles`
- `permissions`
- `projects`
- `tasks`
- `task_comments`
- `task_attachments`
- `notifications`
- `audit_logs`
- `app_settings`

Do not create migrations yet.

Before creating migrations:

- Audit the current schema.
- Compare current tables with planned domains.
- Identify gaps.
- Identify duplicate concepts.
- Confirm naming conventions.
- Confirm access patterns.
- Confirm row-level security requirements.

## 7. API Planning

Planned API route groups:

- `/api/projects`
- `/api/tasks`
- `/api/admin`
- `/api/notifications`
- `/api/ai` later only

Do not implement these routes yet.

API planning rules:

- Keep provider-specific code behind internal service boundaries.
- Keep Supabase write operations protected by auth checks.
- Keep admin operations protected by RBAC.
- Keep future AI operations audited.
- Keep route behavior stable once frontend calls depend on it.

## 8. Production Rules

Strict rules for Phase 2:

- Every step must pass `npm run build`.
- Every step must be committed separately.
- No secrets in the repository.
- No paid integrations before explicit approval.
- No visual or design changes during the backend/core phase.
- No large mixed commits.
- No Supabase schema changes without an explicit migration task.
- No external service connection without an explicit decision.
- No cleanup mixed with feature development.
- No page language/content edits unless specifically requested.
- No UI, styling, layout, color, or typography changes during foundation work.

## 9. Next Codex Task Recommendation

Audit current Supabase usage and existing auth/profile logic without changing code.
