# Codex Operating Rules

This document defines the permanent operating rules for future Codex development work on 1inow.

## 1. Primary Development Environment

Codex is the primary development environment for 1inow.

All implementation, cleanup, validation, and documentation tasks should be performed through scoped Codex tasks unless an exception is explicitly approved.

## 2. Scoped Task Requirement

All implementation tasks must be written as clear scoped Codex tasks.

Every task must define:

- Goal
- Files allowed to change
- Files not allowed to change
- What must not be changed
- Validation command
- Commit message

Tasks should be small enough to review, validate, and commit independently.

## 3. Manual Edit Restriction

No manual code edits should be made outside Codex unless explicitly required.

If manual work is required, the reason must be clear before the work begins.

## 4. Required Task Fields

Every Codex task must include:

### Goal

The task must state the intended outcome.

### Files Allowed To Change

The task must list files, folders, or file categories that may be changed.

### Files Not Allowed To Change

The task must list files, folders, or file categories that must remain untouched.

### What Must Not Be Changed

The task must explicitly state protected behavior, design, schema, providers, content, or configuration.

### Validation Command

Every implementation task must run:

```bash
npm run build
```

Additional validation commands may be added when needed.

### Commit Message

Every task must provide the exact commit message to use after successful validation.

## 5. UI, Design, And Styling

No UI, design, style, layout, color, typography, or visual changes are allowed unless the task explicitly allows them.

Default rule:

- Preserve existing UI.
- Preserve existing styling.
- Preserve existing layout.
- Preserve existing typography.
- Preserve existing colors.
- Preserve existing page copy and language.

Visual work must be handled in explicitly scoped design/UI tasks.

## 6. External Services

No external services may be added without explicit approval.

This includes, but is not limited to:

- OpenAI
- Anthropic
- Gemini
- Resend
- Stripe
- PostHog
- Sentry
- Google Analytics
- Email providers
- SMS providers
- Push notification providers

Provider planning may be documented without connecting the provider.

## 7. Secrets

No secrets may be committed to the repository.

Forbidden examples:

- Production API keys
- Service-role keys
- Provider tokens
- Database passwords
- OAuth client secrets
- Webhook signing secrets

Only safe example placeholders may appear in documentation or example environment files.

## 8. Build Validation

Every task must run:

```bash
npm run build
```

A task is not complete until the build passes.

If the build fails, the task must either:

- Fix the failure when it is directly related to the task.
- Stop and report the unrelated failure clearly.

## 9. Separate Commits

Every successful task must be committed separately.

Each commit should represent one coherent change.

## 10. No Large Mixed Commits

Large mixed commits are not allowed.

Do not combine unrelated changes such as:

- Cleanup and feature development
- UI redesign and backend changes
- Schema changes and frontend refactors
- Provider integration and unrelated formatting
- Documentation and runtime behavior changes unless documentation is the task output

## 11. Cleanup Versus Feature Work

Cleanup tasks and feature tasks must be separate.

Examples of cleanup:

- Removing unused code
- Updating deprecated APIs
- Organizing imports
- Improving build configuration
- Documentation maintenance

Examples of feature work:

- Adding new user-facing behavior
- Creating new routes
- Adding new database-backed flows
- Connecting external providers
- Changing permissions behavior

## 12. Supabase Schema Changes

Supabase schema changes require a separate migration task.

Any migration task must define:

- Tables affected
- Columns affected
- RLS policies affected
- Indexes affected
- Backward compatibility expectations
- Validation plan
- Rollback consideration

Do not mix schema changes with unrelated UI, cleanup, or provider work.

## 13. Production Integrations

Production integrations require separate approval.

Each integration task must clearly state:

- Provider
- Purpose
- Required environment variables
- Files allowed to change
- Security considerations
- Failure behavior
- Validation plan

No paid integration may be connected without explicit approval.

## 14. AI Routes

AI routes stay stubbed until explicitly approved.

Current protected AI routes:

- `/api/chat`
- `/api/stt`
- `/api/tts`

These routes must not be connected to OpenAI, Anthropic, Gemini, or any other AI provider without a dedicated approved task.

Future AI work must include:

- Provider decision
- Permission model
- Audit logging plan
- Cost control plan
- Rate-limit plan
- Failure-mode plan

## 15. Main Branch Buildability

The `main` branch must always remain buildable.

Before committing to `main`, run:

```bash
npm run build
```

Before tagging a release base, verify:

- Build passes.
- Working tree is clean.
- The tag points to the intended commit.
- No secrets are present.
- No unapproved integrations are connected.

## 16. Recommended Codex Task Template

Use this template for future work:

```text
Project: 1inow-1
Branch: main

Goal:
[Clear outcome]

Files allowed to change:
- [List allowed files/folders]

Files not allowed to change:
- [List protected files/folders]

Must not change:
- UI/design/style unless explicitly allowed
- Supabase schema unless this is a migration task
- External services unless explicitly approved
- Secrets

Validation:
npm run build

Commit:
[exact commit message]
```
