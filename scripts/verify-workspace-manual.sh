#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
1inow manual workspace verification checklist
===========================================

Run after deploying app changes or applying Supabase migrations.

Auth & profile
  [ ] Sign in with email/password
  [ ] Profile loads; organization resolves (no blank workspace)

Projects & tasks
  [ ] Create project from /projects
  [ ] Open project board; create task
  [ ] Change task status; delete task
  [ ] Post task comment; assignee gets notification (if different user)

Teams (requires edit_users)
  [ ] /teams lists org teams
  [ ] Create team / department (admin or edit_users role)
  [ ] Archive team (admin + edit_users)

Communication
  [ ] Send channel message
  [ ] @mention triggers in-app notification
  [ ] Decision / approval message types notify channel members

Admin
  [ ] /administration visible only with admin permissions
  [ ] Invitations list; create invite (invite_users)
  [ ] Audit log shows recent activity_logs entries

Notifications
  [ ] Notification bell shows new items
  [ ] Mark read / mark all read works

Optional integrations (env-gated)
  [ ] AI chat with AI_PROVIDER=openai + use_assistant
  [ ] STT/TTS with STT_PROVIDER/TTS_PROVIDER=openai + use_voice
  [ ] Stripe checkout with ENABLE_STRIPE=true

Supabase migrations (production)
  bash scripts/verify-org-migrations.sh
  Apply migrations 1–8 in order via docs/supabase-migration-runbook.md

Automated smoke (local/CI):
  npm run smoke
EOF
