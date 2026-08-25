# Admin Dashboard

`app/admin/` — completely separate from `(workspace)`. Auth guard in `layout.tsx` (server component, reads DB directly). All `/api/admin/*` routes verify `plan === 'admin'` independently.

Admin server components call `AdminService` **directly** — do NOT use `features/connectors.ts` server-side.

Routes: `overview`, `users`, `users/[id]` (PATCH — writes `AdminAuditLog`), `audit-log`, `exchange-rate` (live USD/BRL, 1h cache), `catalog`, `catalog/[examId]`.

`tokensByPlan` is computed in `getOverview()` via two queries + application-side join (usageLog groupBy userId → user.findMany to resolve plan).
