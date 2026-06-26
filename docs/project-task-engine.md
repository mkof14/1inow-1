# Project and Task Engine — Phase 2 Step 5

## Summary

This document reviews the current project/task engine and records the stabilization work applied in Phase 2 Step 5.

No Supabase migrations were created. No UI design was changed.

## Current Data Model

### Projects

Key fields in use:

- `name`, `slug`, `description`
- `status`, `priority`, `health`, `progress`
- `owner_id`, `created_by`

Access model:

- `project_members` for collaborators
- RLS: authenticated users can view/create; owner/admin can update/delete

### Tasks

Key fields in use:

- `title`, `description`
- `status`, `priority`, `position`
- `project_id`, `assignee_id`, `created_by`
- `due_date`, `completed_at`

Access model:

- RLS: authenticated users can view/create; assignee/owner/admin can update

## Frontend Entry Points

| Surface | Operations |
| --- | --- |
| `/projects` | List/create projects |
| `/projects/$slug` | Project detail, members, tasks |
| `/tasks` | Board/list, create, drag status |
| Quick create dialog | Create task or project |
| Voice command center | Create task/project from voice |
| Inbox | Convert intake into task/project |

## Issues Found

| Issue | Impact |
| --- | --- |
| Duplicate insert logic across components | Inconsistent defaults (`owner_id`, `assignee_id`, slug) |
| Some project creates omit `owner_id` | Weak ownership metadata |
| Slug collisions possible in quick create | Insert failures on duplicate slug |
| No shared status transition helper | `completed_at` set inconsistently |
| No org/project scope | All authenticated users see all projects |

## Stabilization Applied

Added `src/lib/project-task-engine.ts` with shared helpers:

- `requireWorkspaceActor()`
- `makeProjectSlug()`
- `createTaskRecord()`
- `createProjectRecord()`
- `updateTaskStatus()`

Wired into:

- `src/components/quick-create.tsx`
- `src/routes/_authenticated/tasks.tsx`
- `src/components/voice-command-center.tsx`

### Canonical defaults

**Task create**

- `status`: `todo`
- `priority`: `medium`
- `created_by`: current user
- `assignee_id`: current user unless overridden

**Project create**

- `status`: `planning`
- `priority`: `medium`
- `created_by`: current user
- `owner_id`: current user
- `slug`: normalized name + random suffix

**Task status update**

- Sets `completed_at` when status becomes `done`
- Clears `completed_at` otherwise

## Remaining Gaps

Do not address in this step:

- Organization-scoped project lists
- Milestones/subtasks
- Task comments table
- Activity log writes on create/update
- Permission-key checks before create (`create_projects`, `create_tasks`)
- Refactoring `inbox.tsx` and `projects.index.tsx` inserts (next pass)

## Recommended Next Task

Phase 2 Step 6: Admin foundation review.

Focus:

- User management flows vs RBAC keys
- Organization admin visibility
- Role assignment UI vs `user_roles` table
- Audit log write paths

## Validation

```bash
npm run build
npm run smoke
```
