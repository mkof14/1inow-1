# 1inow Core Architecture

## 1. Current Project State

1inow is prepared for independent long-term production development.

- Lovable platform dependencies have been removed.
- The production build is successful.
- Supabase is the live backend (auth, Postgres, RLS).
- Vercel is the deployment target (Nitro serverless via Vite plugin).

Current AI-related routes:

- `/api/chat`: **always works** — local Sense templates by default; OpenAI when `AI_PROVIDER=openai` + key + `use_assistant`.
- `/api/stt`: returns **501** until `STT_PROVIDER=openai` + key; browser STT is the default client path.
- `/api/tts`: returns **501** until `TTS_PROVIDER=openai|elevenlabs` + keys; browser `speechSynthesis` is the default fallback.

OpenAI, Resend, Stripe, analytics, and monitoring remain **env-gated off** until explicitly configured.

## 2. Core Product Modules

### Dashboard

The dashboard is the primary command view for personal and organization-level activity.

Planned responsibilities:

- Work summary
- Project health overview
- Task status overview
- Recent activity
- Notifications
- Quick actions
- Future AI assistant entry points

### Projects

Projects organize work around business goals, clients, teams, initiatives, or internal operations.

Planned responsibilities:

- Project list
- Project detail
- Project members
- Milestones
- Tasks
- Files
- Activity
- Decisions and notes

### Tasks

Tasks represent executable units of work.

Planned responsibilities:

- Task list
- Task board
- Task detail
- Assignment
- Priority
- Due dates
- Comments
- Attachments
- Activity history

### Calendar

Calendar supports date-based planning and visibility.

Planned responsibilities:

- Task deadlines
- Milestone dates
- Project events
- User reminders
- Future external calendar integrations

### Notes

Notes capture structured and unstructured project knowledge.

Planned responsibilities:

- Personal notes
- Project notes
- Meeting notes
- Decision notes
- Future AI-assisted summaries

### Files

Files provide document and attachment management.

Planned responsibilities:

- Upload metadata
- File ownership
- Project attachments
- Task attachments
- Access controls
- Storage provider abstraction

### Contacts

Contacts represent people and relationships inside or outside the organization.

Planned responsibilities:

- Internal users
- External collaborators
- Clients
- Investors
- Vendors
- Contact-to-project relationships

### Notifications

Notifications inform users about important system and work events.

Planned responsibilities:

- In-app notifications
- Task assignments
- Mentions
- Due date reminders
- Status changes
- Future email, push, and SMS delivery

### Admin

Admin areas manage organization-level configuration and governance.

Planned responsibilities:

- Users
- Organizations
- Teams
- Roles
- Permissions
- System settings
- Audit logs
- Email templates

### Settings

Settings manage user and workspace preferences.

Planned responsibilities:

- Profile settings
- Language and locale
- Notification preferences
- Theme preferences
- Security preferences
- Organization defaults

### Future AI Assistant

The AI assistant is planned but intentionally not connected yet.

Planned responsibilities:

- Context-aware project help
- Task planning
- Summaries
- Drafting
- Translation
- Search assistance
- Workflow recommendations
- Audited AI actions

## 3. Route Structure

### Public Pages

Planned public route group:

- `/`
- `/legal/privacy`
- `/legal/terms`
- `/help`
- `/auth`

Public pages should not require authenticated Supabase sessions.

### Authenticated App

Planned authenticated app route group:

- `/dashboard`
- `/projects`
- `/projects/:id`
- `/tasks`
- `/calendar`
- `/notes`
- `/files`
- `/contacts`
- `/notifications`
- `/settings`
- `/ai`

Authenticated app routes require a valid user session.

### Admin

Planned admin route group:

- `/admin`
- `/admin/users`
- `/admin/organizations`
- `/admin/roles`
- `/admin/permissions`
- `/admin/email-templates`
- `/admin/system-settings`
- `/admin/audit-logs`

Admin routes require role and permission checks.

### API Routes

Planned API route group:

- `/api/chat`
- `/api/stt`
- `/api/tts`
- `/api/files`
- `/api/notifications`
- `/api/webhooks`
- `/api/admin`

API routes should keep external provider calls behind internal service boundaries.

## 4. Database Domains

Planned Supabase domains:

### Users and Profiles

- User identity
- Profile metadata
- Preferences
- Locale
- Avatar
- Contact information

### Organizations

- Organization records
- Organization settings
- Billing status later
- Ownership metadata

### Teams

- Team records
- Team membership
- Team project assignments
- Team permissions later

### Projects

- Project records
- Status
- Priority
- Ownership
- Organization relationship
- Team relationship
- Progress
- Health

### Tasks

- Task records
- Project relationship
- Milestone relationship
- Assignment
- Status
- Priority
- Due date
- Position

### Task Comments

- Comment records
- Task relationship
- Author relationship
- Mentions
- Edited state
- Deleted state

### Files

- File metadata
- Storage path
- Owner
- Project relationship
- Task relationship
- Access scope

### Notifications

- Notification records
- Recipient
- Type
- Read state
- Related entity
- Delivery channel

### Roles and Permissions

- Role assignments
- Permission definitions
- Organization scope
- Project scope
- Admin scope

### Audit Logs

- Actor
- Action
- Entity type
- Entity ID
- Before and after metadata
- IP and user agent when available

### Settings

- User settings
- Organization settings
- System settings
- Feature flags
- Notification preferences

## 5. Permission Model

### `super_admin`

Highest system-level access.

Planned permissions:

- Manage all organizations
- Manage all users
- Manage system settings
- View all audit logs
- Override organization-level permissions

### `admin`

Organization-level administrative access.

Planned permissions:

- Manage organization users
- Manage teams
- Manage roles within the organization
- View organization audit logs
- Configure organization settings

### `manager`

Operational management access.

Planned permissions:

- Create and manage projects
- Assign tasks
- Manage project members
- Review project activity
- Manage project files and notes

### `member`

Standard authenticated workspace user.

Planned permissions:

- View assigned projects
- Create and update assigned tasks
- Comment on accessible tasks
- Upload files where permitted
- Receive notifications

### `viewer`

Read-only access.

Planned permissions:

- View accessible projects
- View accessible tasks
- View accessible files and notes
- No destructive actions

## 6. Admin Structure

Future admin areas:

### Users

- User list
- User detail
- Invite users
- Deactivate users
- Assign roles

### Organizations

- Organization list
- Organization detail
- Organization settings
- Organization membership

### Roles

- Role list
- Role assignment
- Role scope
- Built-in and custom roles later

### Permissions

- Permission definitions
- Permission matrix
- Feature access rules
- Admin-only controls

### Email Templates

- Transactional template list
- Invitation templates
- Notification templates
- Future Resend integration

### System Settings

- Feature flags
- Environment-safe settings
- Global defaults
- Provider status indicators

### Audit Logs

- User activity
- Admin actions
- Permission changes
- Future AI action logs
- Security events

## 7. Project and Task Engine

Planned task model:

### Project

Top-level work container.

Key fields:

- Name
- Description
- Owner
- Organization
- Team
- Status
- Priority
- Health
- Progress

### Milestone

Time-bound project checkpoint.

Key fields:

- Project
- Name
- Description
- Target date
- Status
- Sort order

### Task

Executable unit of work.

Key fields:

- Project
- Milestone
- Title
- Description
- Status
- Priority
- Assignee
- Due date
- Position

### Subtask

Nested work item under a task.

Key fields:

- Parent task
- Title
- Status
- Assignee
- Position

### Status

Planned task statuses:

- Backlog
- To do
- In progress
- In review
- Done
- Canceled

### Priority

Planned priorities:

- Low
- Medium
- High
- Urgent

### Assignee

Tasks and subtasks may be assigned to one user.

Future expansion may support:

- Multiple assignees
- Watchers
- Approvers

### Due Date

Due dates support:

- Calendar visibility
- Reminder generation
- Overdue state
- Future recurring tasks

### Comments

Comments support:

- Discussion
- Mentions
- Edit history later
- Soft deletion

### Attachments

Attachments support:

- Task files
- Project files
- Metadata tracking
- Access control

### Activity Log

Activity log tracks:

- Creation
- Assignment changes
- Status changes
- Priority changes
- Due date changes
- Comment activity
- Attachment activity

## 8. Notification Layer

Planned notification types:

### In-App

Initial notification channel.

Examples:

- Task assigned
- Mention received
- Comment added
- Due date approaching
- Project status changed

### Email Later

Planned later after provider decision.

Likely provider:

- Resend

### Push Later

Planned later after product requirements are clear.

Potential use cases:

- Mobile reminders
- Urgent task updates
- Approval requests

### SMS Later

Planned later only if business requirements justify it.

Potential use cases:

- Critical alerts
- Time-sensitive approvals
- Security notifications

## 9. Future AI Layer

AI is intentionally not connected yet.

Current state:

- AI chat is stubbed.
- Speech-to-text is stubbed.
- Text-to-speech is stubbed.
- Translation and rewrite behavior are disabled-service placeholders.
- No production AI key is required.

Planned later:

- OpenAI
- Anthropic
- Gemini
- Model router
- Internal AI gateway
- User-level AI permissions
- Audit logging for AI actions

The AI layer should be introduced behind internal application services, not directly from UI components.

AI actions should support:

- User permission checks
- Organization policy checks
- Prompt and response audit logging where appropriate
- Provider selection
- Cost controls
- Rate limits
- Data safety rules

## 10. Later Integrations

Planned but not connected:

- Resend
- Stripe
- PostHog
- Sentry
- Google Analytics
- OpenAI
- Anthropic
- Gemini

Each integration must be introduced in a separate implementation phase with a clear decision record.

## 11. Development Rules

- No new external service without an explicit decision.
- No production secret may be committed to the repository.
- Every phase must build successfully.
- Every major phase must be committed and tagged.
- Do not mix cleanup with feature development.
- Do not modify Supabase schema as part of unrelated frontend or cleanup work.
- Keep provider-specific code behind internal service boundaries.
- Document disabled features clearly when placeholders are used.
- Prefer small, reviewable commits for production-facing changes.
