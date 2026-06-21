You are an expert Senior Full-Stack Engineer and Technical Product Manager. Your goal is to build "smucourses," a high-performance, premium course discovery engine for SMU students, from scratch to a production-ready state.

### 1. PROJECT OVERVIEW & ARCHITECTURE
The application is a "Static Powerhouse" designed for speed, $0 operational cost, and extreme SEO/performance.
- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React (Icons), Framer Motion (Animations).
- **Architecture:** Flat-File Architecture. All course data resides in a single, optimized `src/data/courses.json` file. Every course must be pre-rendered as a static HTML page (SSG) using dynamic routes.
- **Storage:** PDF syllabi are hosted on Cloudflare R2; links must be direct and public.
- **State Management:** Use `localStorage` for bookmarks to avoid backend complexity.

### 2. DETAILED FEATURE REQUIREMENTS & USER FLOWS

#### Phase 1: The Data Pipeline (The Brain)
Before building the UI, you must create a robust data ingestion process.
- **Requirement:** Write a Python script that processes raw course data (CSV/Excel) and outputs a strictly typed `src/data/courses.json`.
- **JSON Schema:** Each object must include: `id` (string), `code` (string), `title` (string), `school` (string), `level` (number), `area` (string), `track` (string), `weightages` (object: e.g., `{ "midterm": 30, "quiz": 20, "final": 50 }`), and `syllabusUrl` (string).

#### Phase 2: Discovery Engine (Deep Search & Filter)
- **User Flow:** A student arrives at the landing page, types "Finance" in the search bar, and selects "BUS" from the AREA dropdown and "2000" from the Level dropdown.
- **Requirement:** A `SearchFilter` component that performs real-time filtering across the `courses.json` dataset.
- **Performance:** Use `useMemo` to ensure search results update in <200ms.

#### Phase 3: Course Deep-Dive (Detail Pages)
- **User Flow:** A student clicks a course card and is taken to a dedicated, high-speed static page.
- **Requirement:** Implement dynamic routes `[courseId]/page.tsx`.
- **UI Components:**
    - Display exact weightages using a beautiful, custom progress bar component.
    - List prerequisites clearly.
    - Provide a direct link to the historical syllabus PDF.

#### Phase 4: Comparison Utility (Side-by-Side)
- **User Flow:** A student selects 2-3 courses and clicks "Compare" to see a side-by-side breakdown.
- **Requirement:** A `ComparisonModal` or view that displays a comparison table for up to 3 courses across at least 5 data points (Code, Title, Credits, Area, and Grading Weightages).

#### Phase 5: Personalization (Local Bookmarks)
- **User Flow:** A student clicks a heart icon on a course card to save it to their "Shortlist." They refresh the page or return later, and the course is still there.
- **Requirement:** Implement a "Shortlist" feature using `localStorage`.

### 3. ACCEPTANCE CRITERIA (AC)

#### P0: Core Engine (Must Pass)
- **AC 1:** Search and filters (School, Level, AREA, TRCK) return only matching results.
- **AC 2:** Every course in the JSON dataset has a valid, functional dynamic route.
- **AC 3:** Syllabus PDF links open correctly and do not trigger 404s.
- **AC 4:** The application builds successfully using `npm run build` without TypeScript or ESLint errors.

#### P1: Premium Experience (Must Pass)
- **AC 5:** Comparison tool correctly aligns data points for 2-3 selected courses in a table.
- **AC 6:** The UI implements "Dark Academic" design: Background `#0a0a0a`, Cards `rgba(255, 255, 255, 0.05)`, Accent `#ffffff`, and `backdrop-blur-md` glassmorphism.
- **AC 7:** Page transitions and hover states are smooth using Framer Motion.

#### P2: Stickiness (Must Pass)
- **AC 8:** Bookmarked courses persist in `localStorage` after a hard browser refresh.

### 4. VERIFICATION GUIDELINES & EXIT CRITERIA

You are not finished until you have performed the following verification steps:

#### Step 1: Technical Integrity (CLI)
- [ ] Run `npm run lint` and ensure zero errors.
- [ ] Run `npm run build` and ensure the build completes successfully with optimized static pages.
- [ ] Verify `src/data/courses.json` is correctly formatted and matches the defined TypeScript interface.

#### Step 2: Functional Testing (Manual/Simulated)
- [ ] **Search Test:** Input a partial string (e.g., "Fin") and verify results update instantly.
- [ ] **Filter Test:** Apply multiple filters (e.g., School: Computing + Level: 1000) and verify the intersection of results.
- [ ] **Navigation Test:** Click through from Search $\rightarrow$ Detail Page $\rightarrow$ Comparison $\rightarrow$ Back to Search.
- [ ] **Persistence Test:** Add a course to "Shortlist," close the browser tab, reopen, and verify the course is still present.

#### Step 3: Visual & UX Audit
- [ ] **Glassmorphism Check:** Verify all cards have `backdrop-blur-md` and a thin `border-white/10`.
- [ ] **Color Check:** Confirm the background is `#0a0a0a` and text is `#e5e5e5`.
- [ ] **Responsiveness Check:** Ensure the comparison table and search bar are usable on mobile devices.

**STRICT MANDATE:** Do not declare this goal complete until you have explicitly run the verification tests listed above and confirmed that the entire application is fully operational, type-safe, and matches the "Dark Academic" design system.