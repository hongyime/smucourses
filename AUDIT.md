# Multi-Agent Codebase Audit Report

## 1. Data Integrity & Mapping
*   **"Unknown" Course Levels**: The current data pipeline (`transform_data.py`) maps the course level (Undergraduate vs Postgraduate) primarily through `customFields.courseType`. A diagnostic scan reveals **807 courses** have an "Unknown" level because this specific field is missing. However, the data contains an `attributes` field (e.g., "Level : Undergraduate") which can be used as a fallback to reliably infer the correct level.
*   **Missing PDF Syllabus Links**: 1,780 courses currently lack a corresponding syllabus PDF. This isn't immediately an error but represents a completeness gap that should be handled gracefully by the UI.

## 2. Architecture & Pipeline Misalignment
*   **Split Source of Truth**: The `transform_data.py` script currently outputs `courses.json` to `data/processed/courses.json` and creates a search index in `data/processed/search_index.json`. However, the Next.js frontend (`web/src/data/courses.json`) contains its own duplicated copy of the data. This creates a risk of desynchronization. The pipeline must write directly to the `web/src/data/` directory or the Next.js app must symlink/import from the `data/processed/` directory.

## 3. Frontend & Code Quality (ESLint/React Warnings)
*   The Next.js `web/` application contains 16 ESLint problems (10 errors, 6 warnings). Key issues include:
    *   **React Hook Dependency Mismatches**: Several `useEffect` hooks in files like `useCompare.ts` and potentially others have missing or incorrect dependency arrays, causing stale closures or potential infinite rendering loops.
    *   **Improper Next.js Components**: The codebase utilizes standard `<img>` tags instead of `next/image` and standard `<a>` tags instead of `next/link`, violating Next.js static optimization best practices.

## 4. Feature Adherence & The "Flat-File" Mandate
*   The frontend relies entirely on static SSG generation with local JSON. The codebase properly avoids any external databases. However, it must ensure that rendering (especially dynamic course routes) is strictly using `courses.json` and properly statically exporting.

## Recommended Remediation Priorities
1.  **Fix Data Pipeline**: Enhance `transform_data.py` to eliminate "Unknown" levels using fallback string parsing from the `attributes` field, and output directly to the Next.js data directory.
2.  **Fix ESLint Violations**: Surgically resolve React hook dependency issues and Next.js component usage to ensure a clean `npm run build`.
3.  **Ensure Strict SSG**: Verify `generateStaticParams` perfectly maps to the updated `courses.json`.
