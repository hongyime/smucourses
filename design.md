# Architectural Design & Implementation Plan

## 1. Data Model Updates (Data Pipeline)
*   **Level Inference Logic (`transform_data.py`)**: 
    *   Currently, the level is mapped from `customFields.courseType`. 
    *   **Change**: We will implement a fallback mechanism. If `customFields.courseType` is absent or undefined, the script will parse the `attributes` string (which often contains values like `"Level : Undergraduate"` or `"Level : Postgraduate"`).
    *   **Outcome**: The 807 "Unknown" level courses will be correctly categorized, enabling proper filtering on the frontend.
*   **Pipeline Destination Shift**:
    *   Currently, `transform_data.py` saves to `data/processed/courses.json`. 
    *   **Change**: The script will be updated to save directly to `web/src/data/courses.json` and `web/src/data/search_index.json`. 
    *   **Outcome**: Single source of truth. No manual copying required.

## 2. Frontend Interface Contracts & State Management
*   **Strict Typing**: We will eliminate all `@typescript-eslint/no-explicit-any` usages in `app/compare/page.tsx` and `app/courses/[id]/page.tsx` by fully utilizing the `Course` type imported from `types.ts` (or defining it if missing).
*   **React State Initialization (Cascading Renders Fix)**: 
    *   The audit identified multiple `react-hooks/set-state-in-effect` errors (e.g., in `useBookmarks.ts`, `useCompare.ts`, `app/courses/page.tsx`).
    *   **Change**: We will refactor these to avoid synchronous `setState` inside `useEffect`. For local storage initialization, we will use lazy state initialization: `useState(() => getFromLocalStorage())`. For reactive prop changes, we will derive state during render or use proper effect orchestration.
*   **Static Export Compatibility**: 
    *   Next.js warns against standard `<img>` tags (`@next/next/no-img-element` in `Navbar.tsx`). However, since our architecture strictly mandates a flat-file Static Site Generation (`output: 'export'`), the standard `next/image` component will fail without a custom image loader.
    *   **Change**: We will either use `next/image` with `unoptimized={true}` or explicitly disable the ESLint rule for the specific logo image, documenting that it is an intentional architectural choice for SSG.

## 3. Dependency Verification
*   No new dependencies are required. All fixes rely on standard Python 3 standard libraries (`json`, `re`) and existing Next.js / React 15/19 APIs. The architecture remains zero-database.
