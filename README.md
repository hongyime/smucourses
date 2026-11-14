# SMU Courses | Enhanced Course Catalog

An ultra-fast, modern, and transparent course catalog built for SMU students. Designed with a "Dark Academic" aesthetic, this platform allows students to search thousands of historical syllabi, track exam weightages, and plan their degrees instantly.

## 🏗 Architecture
This project uses a **Flat-File Architecture** for maximum performance and zero database hosting costs.
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Fuse.js (Client-side Search)
- **Data Layer**: Static JSON files generated from SMU APIs.
- **Syllabi**: Schedule records link directly to Coursedog PDF endpoints generated from document IDs.

### Directory Structure
- `/web` - The Next.js web application.
- `/scripts` - Python data pipelines for fetching, transforming, and syncing data.
- `/data` - The raw and processed JSON data files (the "Single Source of Truth").

---

## 🚀 Quick Start (Web App)

The web app's npm commands work in Windows and Linux. Linux equivalents for the
Windows maintenance launchers are also provided:

| Task | Windows | Linux |
|---|---|---|
| Type check only | `pwsh -File scripts/pre-push-check.ps1` | `sh scripts/pre-push-check.sh` |
| Interactive data menu | `scripts/sync_data.bat` | `sh scripts/sync_data.sh` |
| Full data pipeline | `pwsh -File scripts/run_pipeline.ps1` | `sh scripts/run_pipeline.sh` |

The Windows launchers use PowerShell; the Linux/macOS launchers are native POSIX
shell scripts. Both require Python in an activated virtual environment. **Those
data commands contact providers, write data, and can commit/push changes as part
of the existing pipeline; they are not ordinary development-start commands.**
Windows Task Scheduler registration remains a Windows integration; Linux
scheduling is an operator choice. No schedule or pipeline is installed by these
launchers.

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the app! No database or environment variables are required for local development.

---

## 📦 PDF Syllabus Links and Optional Local Cache

The generated schedule data links each syllabus directly to its Coursedog PDF URL:
`https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/<document-id>/pdf`.
No PDF cache is part of deployment or CI. `sync_pdfs.py` is an optional local-only
cache utility; its output remains ignored under `web/public/pdfs/`.

### 1. Install Python Dependencies
```bash
pip install requests
```

### 2. Run the Local Cache Script
```bash
python scripts/sync_pdfs.py
```

### Security & Failsafes Built-in
The local cache script validates downloads before writing them:
- **5 MB Individual Cap**: Any file attempting to download more than 5MB is immediately severed to prevent "zip bombs."
- **Magic Byte Validation**: Verifies the `%PDF` header natively to prevent malicious files from being stored locally.
- **Rate Limiting**: Includes a 0.5s delay to prevent DOSing the source servers.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Maintenance verification — 2026-09-12

- [x] Reproduce malformed/blocked browser storage and automatic removal of unavailable comparison IDs using synthetic browser profiles.
- [x] Preserve saved selections, report read/write failures, support backup download and explicit removal of unavailable IDs.
- [x] Point the PR build check at `web`, run the saved-selection tests and build with Node 24 and the committed lockfile.
- [x] Pass 15 local saved-selection tests, targeted lint, TypeScript, all 3,689 static pages and 13 browser scenarios.
- [ ] Complete hosted checks, verify the exact production release and update the portfolio report.

Run `npm test`, `npm run lint`, and `npm run build` from `web`. The lint command invokes ESLint directly because Next.js 16 removed `next lint`; the build workflow runs it before the static build. Saved selections remain local browser data; a Supabase migration is still separate work.

2026-09-12 merge-protection rotation: preserve the current application tests/build and all records; require Build on every PR/main update; replace main-branch heartbeat commits with an owned activity branch whose Vercel configs disable its deployments; install the shared checked bot policy while keeping automation disabled. Actual Vercel root is web; the schedule retains minute 3. Task sequence: validate maintenance and app checks, publish reviewed PRs, verify hosted checks and production, configure required Build/Vercel identities with administrator enforcement, verify blocked heads and heartbeat behavior, then re-enable only the repaired bot policy. No collector, sync or provider-data workflow is dispatched for testing. All prior data and application source remain unchanged.

2026-09-15: PR #26 limits the LFS guard checkout to the current commit and fails on Git scan errors. The guard still rejects current LFS pointers and honors the existing opt-out. Repository ignore rules, the Next.js static export from web, application code and all retained catalog/schedule/bid/professor/syllabus data are unchanged. Required Build and Vercel checks gate release; no collection or PDF-sync job is run for validation.
