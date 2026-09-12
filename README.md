# SMU Courses | Enhanced Course Catalog

An ultra-fast, modern, and transparent course catalog built for SMU students. Designed with a "Dark Academic" aesthetic, this platform allows students to search thousands of historical syllabi, track exam weightages, and plan their degrees instantly.

## 🏗 Architecture
This project uses a **Flat-File Architecture** for maximum performance and zero database hosting costs.
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Fuse.js (Client-side Search)
- **Data Layer**: Static JSON files generated from SMU APIs.
- **Storage**: Cloudflare R2 (for hosting 4,700+ PDF syllabi with zero egress fees).

### Directory Structure
- `/web` - The Next.js web application.
- `/scripts` - Python data pipelines for fetching, transforming, and syncing data.
- `/data` - The raw and processed JSON data files (the "Single Source of Truth").

---

## 🚀 Quick Start (Web App)

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

## 📦 PDF Syllabus Synchronization (Cloudflare R2)

To prevent bloat in the git repository, the 4,700+ PDF syllabi are stored in Cloudflare R2. We have a highly secure Python pipeline to sync these files.

### 1. Setup Environment
In the `web/` directory, create a `.env.local` file with your R2 credentials:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=smucourses-syllabi
```

### 2. Install Python Dependencies
```bash
pip install requests boto3 python-dotenv
```

### 3. Run the Sync Script
```bash
python scripts/sync_pdfs.py
```

### Security & Failsafes Built-in:
The `sync_pdfs.py` script has strict security constraints to protect your Cloudflare billing:
- **1.5 GB Global Cap**: The script will automatically terminate if total downloads exceed 1.5GB to ensure you never breach the 10GB free tier.
- **5 MB Individual Cap**: Any file attempting to download more than 5MB is immediately severed to prevent "zip bombs."
- **Magic Byte Validation**: Verifies the `%PDF` header natively to prevent malicious executables from being stored in your bucket.
- **Rate Limiting**: Includes a 0.5s delay to prevent DOSing the source servers.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Maintenance verification — 2026-09-12

- [x] Reproduce malformed/blocked browser storage and automatic removal of unavailable comparison IDs using synthetic browser profiles.
- [x] Preserve saved selections, report read/write failures, support backup download and explicit removal of unavailable IDs.
- [x] Point the PR build check at `web`, run the saved-selection tests and build with Node 24 and the committed lockfile.
- [x] Pass 15 local saved-selection tests, targeted lint, TypeScript, all 3,689 static pages and 13 browser scenarios.
- [ ] Complete hosted checks, verify the exact production release and update the portfolio report.

Run `npm test` and `npm run build` from `web`. The lint command now invokes ESLint directly because Next.js 16 removed `next lint`. Existing lint findings remain a separate cleanup; the build workflow does not claim to run lint. No catalog, schedule, bid, professor or syllabus records were changed. Saved selections remain local browser data; a Supabase migration is still separate work.

2026-09-12 merge-protection rotation: preserve the current application tests/build and all records; require Build on every PR/main update; replace main-branch heartbeat commits with an owned activity branch whose Vercel configs disable its deployments; install the shared checked bot policy while keeping automation disabled. Actual Vercel root is web; the schedule retains minute 3. Task sequence: validate maintenance and app checks, publish reviewed PRs, verify hosted checks and production, configure required Build/Vercel identities with administrator enforcement, verify blocked heads and heartbeat behavior, then re-enable only the repaired bot policy. No collector, sync or provider-data workflow is dispatched for testing. All prior data and application source remain unchanged.
