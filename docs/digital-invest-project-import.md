# Digital Invest Project Import

## Source

- Source page: <https://www.digitalinvest.com/projects>
- Imported on: 2026-06-22
- Import type: Supabase data migration
- Schema changes: none
- Runtime UI changes: none

## What Was Added

Created a data-only migration:

- `supabase/migrations/20260622100206_upsert_digital_invest_project_portfolio.sql`

The migration upserts the current Digital Invest project portfolio into
`public.projects` by `slug`. Existing matching projects are updated; missing
projects are inserted.

## Projects Included

1. Digital Invest Portfolio
2. BioMath Life Platform
3. BioMath Core
4. SAVEN
5. Stress
6. Vital
7. BioAge
8. Senior
9. Skin
10. Luna Balance
11. T1/2D
12. MRX.Health
13. BaseLine
14. AGRON - Aerial-Ground Robotics Operations Network
15. AGRON Work
16. TerraAero
17. MyDay
18. It's Good Today
19. TableServed
20. 1inow

## Duplicate Handling

The existing seed data already contained several older project entries.

To avoid duplicate project cards:

- `digital-invest` is renamed to `digital-invest-portfolio` before upsert when
  the new slug does not already exist.
- `tableserved` is renamed to `table-served` before upsert when the new slug
  does not already exist.

Older projects that are not listed on the current Digital Invest Projects page
were not deleted or archived.

## Fields Updated

For each imported project, the migration sets:

- `name`
- `slug`
- `description`
- `status`
- `priority`
- `color`
- `category`
- `progress`
- `health`

The migration also clears `archived_at` for imported projects.

## Application Impact

The existing Projects page already reads from `public.projects`, so no route or
component change is required.

After the migration is applied, the imported projects should appear in:

- `/projects`
- `/dashboard`
- `/portfolio`
- project detail pages by slug
- reports and local project intelligence widgets

## How To Apply

Apply this migration through the existing Supabase migration workflow for the
target environment.

Vercel deployment alone does not apply database migrations.

## Validation

Required after applying the migration:

1. Run `npm run build`.
2. Apply the Supabase migration.
3. Open `/projects`.
4. Confirm the 20 imported Digital Invest projects are visible.
5. Confirm there are no duplicate `Digital Invest Portfolio` or `TableServed`
   project cards.
