# Agent State

2026-09-16 baseline review — first STATE.md for this repo (handoffs/ was the
only prior .agents artifact).

Repo synced to origin/main at 2d382f5 (chore(config): bound maintenance
checkout and preserve repo rules, PR #26). Working tree clean.

Stack (per AGENTS.md — the master plan file):
- Next.js 15 App Router (SSG) under `web/`
- Tailwind CSS v4, Framer Motion, Lucide React
- Fuse.js for in-memory search
- Data pipeline in Python → `web/src/data/courses.json` (single source of truth)
- Cloudflare R2 for syllabus PDFs
- Vercel static deployment
- Free-tier only: NO backend DB, NO Supabase, NO paid services

Recent release lineage: PR #26 (config sync, LFS guard hardening — recorded
in `.agents/handoffs/20260915-config-release.json`), PR #24 (build/heartbeat
guards), PR #23 (dev dep bump js-yaml). The referenced `campus-auth-release.json`
under audit_results/ is for `sgCampusCore2026`, NOT this repo — batch briefing
noted this in error. Auth release is not applicable to smucourses (flat-file,
no auth).

`web/` npm audit: 0 vulnerabilities (production tree).

Open PRs: #16 Dependabot labeler 6→7, #15 Dependabot setup-python 6→7 —
workflow-only. No open GitHub issues.

Vercel deploy hold in effect until 2026-09-16T07:14:05Z; no pushes to main
this session.

Next: after hold lifts, verify the next Vercel deploy for main HEAD 2d382f5;
merge Dependabot workflow PRs after their hosted checks pass; no application
code work required.
