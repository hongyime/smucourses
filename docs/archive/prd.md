# Product Requirements Document: smucourses

**Status:** Draft / Ready for Implementation  
**Author:** Product Manager  
**Date:** October 2023  
**Target Launch:** Upcoming SMU Bidding Cycle

---

## 1. Product Overview
**App Name:** smucourses  
**Tagline:** *Master your curriculum. Bid with confidence.*  
**Launch Goal:** Acquire **100 active student users** during the first bidding window to validate data accuracy and UI utility.

**The Vision:**  
Current SMU course discovery is a fragmented, high-friction experience. Students are forced to toggle between clunky official portals, messy PDF syllabi, and scattered Telegram chats. `smucourses` centralizes this chaos into a high-performance, premium discovery engine. It isn't just a directory; it is a decision-making tool that provides the transparency students need to optimize their academic journey.

---

## 2. Who It’s For
### The Primary Persona: "The Strategic Bidder"
*   **Name:** Alex, a 2nd-year SMU Undergraduate.
*   **Pain Points:** Alex is stressed about bidding. He needs to fulfill a specific "TRCK" (Track) requirement but doesn't want a course with a 100% final exam weightage. He spends hours opening 15 different tabs to compare prerequisites and grading schemes.
*   **Motivation:** To find the "perfect" course—one that fits his graduation requirements, matches his workload capacity, and has a transparent grading structure.

**User Story:**  
> *"As a student planning my next semester, I want to quickly filter courses by my required AREA and see their historical grading weightages side-by-side, so that I can make an informed bidding decision without wasting hours on manual research."*

---

## 3. The User Journey

1.  **Discovery:** Alex hears about `smucourses` in a SMU Telegram group. He clicks a link and is immediately greeted by a fast, dark-mode interface that feels "premium" and "official."
2.  **First Use (The "Aha!" Moment):** Instead of browsing, Alex goes straight to the search bar. He types "Finance" and immediately applies a filter for "AREA: BUS" and "Level: 2000." Within seconds, he has a curated list of relevant courses.
3.  **Deep Dive:** He clicks a course and sees exactly how it’s graded (e.g., 30% Midterm, 20% Quiz, 50% Final). He clicks a link to view a historical syllabus PDF to see a past professor's approach.
4.  **Success:** Alex selects two similar courses, clicks "Compare," sees that one has a more balanced assessment structure, bookmarks it for later, and closes the tab feeling in control of his semester.

---

## 4. MVP Features

### P0: Must-Have (The Core Engine)
| Feature | User Story | Success Criteria |
| :--- | :--- | :--- |
| **Deep Search & Filter** | As a student, I want to filter by School, Level, AREA, and TRCK so I only see courses relevant to my degree. | Search results update in <200ms; filters correctly include/exclude based on JSON attributes. |
| **Course Detail Pages** | As a student, I want to see exact weightages and prerequisites so I can plan my workload. | Every course in the 2,950+ dataset has a dedicated, high-speed static page. |
| **Syllabus Transparency** | As a student, I want to access historical syllabus PDFs so I can see how different professors grade. | PDF links open directly from Cloudflare R2; no broken links. |

### P1: Should-Have (The "Sticky" Features)
| Feature | User Story | Success Criteria |
| :--- | :--- | :--- |
| **Side-by-Side Comparison** | As a student, I want to compare 2-3 courses in a table so I can see differences in credits and grading at a glance. | A clean modal or view allows comparison of at least 3 courses across 5+ data points. |
| **Premium UI/Dark Mode** | As a student, I want a modern, beautiful interface so that I trust the tool and enjoy using it. | Implementation of glassmorphism, smooth hover states, and a "wow" factor. |

### P2: Nice-to-Have (The "Delight" Features)
| Feature | User Story | Success Criteria |
| :--- | :--- | :--- |
| **Local Bookmarks** | As a student, I want to save courses to a "Shortlist" so I don't lose them. | Uses `localStorage`; bookmarks persist even if the browser is closed. |

### ❌ NOT in MVP (Deferred)
*   **User Accounts/Login:** To avoid security overhead and database complexity, we will use local browser storage instead of a backend.
*   **Professor Ratings:** We will focus on *data* (syllabi) rather than *opinions* (reviews) for the initial launch to maintain an "official" feel.

---

## 5. Success Metrics
*   **Launch Success:** 100 unique users within the first 14 days of the bidding period.
*   **Engagement:** Average session duration > 2 minutes (indicates users are actually comparing/reading).
*   **Retention:** % of users who return to the site more than once during the bidding window.

---

## 6. Look & Feel
**Design Vibe:** Minimalist, High-End, "Academic Tech."  
**Visual Principles:**
*   **Dark Mode by Default:** Deep grays/blacks with high-contrast white/off-white text.
*   **Glassmorphism:** Use of semi-transparent backgrounds with `backdrop-filter: blur()` for cards and modals.
*   **Typography:** Clean, sans-serif (Inter or Outfit) to ensure readability of dense data.
*   **Micro-interactions:** Subtle scaling on hover; smooth transitions between search results and detail pages.

**Simple Wireframe (Conceptual):**
```text
_______________________________________________________
| [ smucourses ]                 [ Search Courses... ] |  <-- Header (Sticky)
|_____________________________________________________|
| Filters:                                            |
| [ School v ] [ Level v ] [ AREA v ] [ TRCK v ]      |  <-- Filter Bar
|_____________________________________________________|
|                                                     |
|  [ Card: CS201 ]   [ Card: CS202 ]   [ Card: CS203 ]|  <-- Course Grid
|  Finance 101       Data Science      AI Ethics      |
|  (Compare +)       (Compare +)       (Compare +)    |
|_____________________________________________________|
```

---

## 7. Technical Considerations
*   **Platform:** Next.js 15 using **Static Site Generation (SSG)**. Every course must be a pre-built HTML file for near-instant loading.
*   **Responsiveness:** Mobile-first design. Students will likely use this on their phones while sitting in lectures or commuting.
*   **Data Pipeline:** Python-driven automation to transform CourseDog API data into flat, searchable JSON files.
*   **Hosting:** Vercel (Frontend) + Cloudflare R2 (PDF Storage).

---

## 8. Quality Standards
**"What This App Will NOT Accept"**
*   **No "Lorum Ipsum":** Every piece of text must be real SMU course data.
*   **No Broken Links:** A syllabus link that leads to a 404 is a failure of the core value proposition.
*   **No Latency:** If a search takes more than 500ms, the "fast" brand promise is broken.
*   **No Clutter:** If a feature doesn't help a student make a bidding decision, it doesn't belong in the MVP.

---

## 9. Budget & Constraints
*   **Budget:** $0.00 (Strict adherence to Free Tiers).
*   **Tools:** Vercel (Hobby), Cloudflare R2 (Free Tier), Cursor/Claude (Development).
*   **Constraint:** Must be able to be maintained by a single person using AI-augmented workflows.

---

## 10. Definition of Done
1.  [ ] Data pipeline successfully generates `courses.json` with all 2,950+ records.
2.  [ ] Search and Filter functions return accurate results based on AREA/TRCK.
3.  [ ] All course detail pages are accessible and show correct weightages.
4.  [ ] Syllabus PDFs are downloadable/viewable via R2.
5.  [ ] Site is deployed on Vercel and passes mobile responsiveness tests.
6.  [ ] Side-by-side comparison modal functions without breaking the layout.