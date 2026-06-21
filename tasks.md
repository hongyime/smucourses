# Execution Tasks

### Task 1: Pipeline Level Inference (Data Layer)
- [x] Modify `transform_data.py` to extract the course level from the `attributes` field if `customFields.courseType` is missing.
- [x] Rerun the pipeline and verify that the count of "Unknown" levels drops to zero (or near zero).

### Task 2: Pipeline Destination Alignment (Architecture Layer)
- [x] Update the file output paths in `transform_data.py` to write `courses.json` and `search_index.json` directly into `web/src/data/`.
- [x] Delete the redundant `data/processed/` outputs to eliminate the split source of truth.

### Task 3: React State Refactoring (Frontend Layer)
- [x] Refactor `web/src/hooks/useBookmarks.ts` to use lazy state initialization to prevent `set-state-in-effect` errors.
- [x] Refactor `web/src/hooks/useCompare.ts` to prevent cascading renders on mount.
- [x] Refactor `web/src/app/compare/page.tsx` and `web/src/app/courses/page.tsx` to safely derive or initialize filtered state without triggering synchronous `setState` in effects.

### Task 4: Strict Typing & Lint Cleanup (Frontend Layer)
- [x] Replace all `any` types in `web/src/app/courses/[id]/page.tsx` and `web/src/app/compare/page.tsx` with the proper `Course` interface.
- [x] Resolve `@typescript-eslint/no-unused-vars` in `layout.tsx`, `page.tsx`, and `CourseCard.tsx`.
- [x] Add `unoptimized={true}` to Next.js `<Image>` usage or suppress the `@next/next/no-img-element` warning in `Navbar.tsx` due to `output: 'export'` constraint.

### Task 5: Build & Verification (Validation)
- [x] Run `npm run lint` inside `web/` and assert 0 errors.
- [x] Run `npm run build` inside `web/` and verify the static export successfully generates without dynamic server errors.
