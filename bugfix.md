# Bugfix Log

| ID | Status | Bug / Issue | Root Cause | Impact |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | Open | 807 courses assigned "Unknown" Level | `transform_data.py` relies strictly on `customFields.courseType`, which is absent in older or specific SMU course entries. | Severe. Users cannot filter these courses by Undergrad/Postgrad. |
| BUG-02 | Open | Data Pipeline Disconnect | `transform_data.py` writes to `data/processed/courses.json`, but Next.js reads from `web/src/data/courses.json`. | Moderate. Manual copy-pasting required; risks stale data in production. |
| BUG-03 | Open | React Hook Exhaustive Deps Errors | Missing dependencies in `useEffect` arrays across several hooks (e.g., `useCompare.ts`). | Moderate. Can cause stale state, memory leaks, or incorrect re-renders. |
| BUG-04 | Open | Next.js Component Violations | Usage of native `<img>` and `<a>` instead of `next/image` and `next/link`. | Low/Moderate. Misses out on static optimization, prefetching, and layout shift prevention. |
| BUG-05 | Open | Stale `setState` in `useEffect` | `useCompare.ts` calls `setState` directly inside a `useEffect` subscription without proper event handling logic. | Moderate. Unnecessary cascading renders. |
