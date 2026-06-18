This technical design is optimized for **"Vibe-Coding"**—a workflow where you act as the Architect/Product Manager and use AI (Cursor, Windsurf, or Gemini) as the Lead Engineer. 

To meet your **$0 budget** and **2-week timeline**, we will avoid complex databases and instead use a **"Flat-File Architecture."** This makes the app incredibly fast, free to host, and extremely easy for AI to write and debug.

---

## 1. Recommended Approach: The "Static Powerhouse"
**The Strategy:** Use Next.js to pre-render every course as a static HTML page. All data lives in a single, highly optimized JSON file.

*   **Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Lucide React (Icons), Framer Motion (Animations).
*   **Cost:** $0 (Vercel Free Tier + Cloudflare R2 Free Tier).
*   **Time to Learn:** Low (if using Cursor/Windsurf).
*   **Success Rate:** Very High (Static sites have the fewest bugs).

## 2. Alternative Options

| Feature | **Static Powerhouse (Recommended)** | **The DB Approach (Supabase)** | **The No-Code Approach (Framer)** |
| :--- | :--- | :--- | :--- |
| **Complexity** | Low (JSON files) | Medium (SQL/Auth) | Very Low |
| **Speed** | Instant (SSG) | Fast (Client-side fetch) | Moderate |
| **Cost** | $0 | $0 (until high traffic) | $15+/mo for custom domains |
| **AI Friendliness** | **Extreme** (AI loves JSON/React) | Moderate (AI struggles with DB schemas) | Low (AI can't "code" Framer easily) |

---

## 3. Project Setup Checklist
1.  **Accounts:** Create accounts on **GitHub**, **Vercel**, and **Cloudflare**.
2.  **Local Environment:** Install **Node.js** and **Cursor** (or Windsurf).
3.  **Initialization:**
    *   Open Cursor terminal.
    *   Run: `npx create-next-app@latest smucourses --typescript --tailwind --eslint`
    *   Select: `App Router: Yes`, `Src Directory: Yes`, `Import Alias: @/*`.
4.  **Folder Structure:** Create `src/data/` and `src/components/`.

---

## 4. Building Your Features (AI-First Workflow)

### Step 1: The Data Pipeline (The "Brain")
Don't ask the AI to "build a database." Ask it to "write a Python script to clean a CSV/Excel into a structured JSON file."
*   **AI Task:** "Write a Python script that takes my course export and creates a `courses.json` file. Each object must have: `id`, `code`, `title`, `school`, `level`, `area`, `track`, `weightages` (as an object), and `syllabusUrl`."

### Step 2: Deep Search & Filter (The "Engine")
*   **AI Task:** "Create a `SearchFilter` component. It should take the `courses.json` as a prop and allow users to filter by School, Level, and Area. Use `useMemo` for performance so the search is instant (<200ms)."

### Step 3: Course Detail & Comparison (The "Utility")
*   **AI Task:** "Create a dynamic route `[courseId]/page.tsx`. It should fetch the specific course from the JSON file and display its weightages in a beautiful progress bar component. Also, create a `ComparisonModal` that accepts an array of 2-3 course objects and displays them in a side-by-side table."

### Step 4: Local Bookmarks (The "Stickiness")
*   **AI Task:** "Implement a 'Shortlist' feature using `localStorage`. Users should be able to click a heart icon on a course card to save it. The list should persist after page refresh."

---

## 5. Design Implementation (The "Vibe")
To get the "Premium Academic" look, paste this into your AI prompt:

**Design System Prompt:**
> "Implement a 'Dark Academic' design system using Tailwind CSS. 
> - **Colors:** Background: `#0a0a0a`; Cards: `rgba(255, 255, 255, 0.05)`; Accent: `#ffffff`; Text: `#e5e5e5`.
> - **Effects:** Use `backdrop-blur-md` and thin `border-white/10` for all cards (Glassmorphism).
> - **Typography:** Use 'Inter' for body and a clean sans-serif for headings.
> - **Animations:** Use Framer Motion for subtle scale-up effects on hover and smooth page transitions."

---

## 6. Data & Storage Structure

### `src/data/courses.json` (The Source of Truth)
```json
[
  {
    "id": "cs201",
    "code": "CS201",
    "title": "Introduction to Programming",
    "school": "Computing",
    "level": 2000,
    "area": "TRCK",
    "weightages": {
      "midterm": 30,
      "quiz": 20,
      "final": 50
    },
    "syllabusUrl": "https://your-r2-link.com/cs201.pdf"
  }
]
```

### Cloudflare R2 (PDF Storage)
*   Upload all PDFs to a single bucket.
*   Set bucket to "Public" so the URLs are direct links.

---

## 7. AI Assistance Strategy (Token Saving)

**To avoid running out of tokens:**
1.  **Modularize:** Never say "Build the whole app." Say "Build the `CourseCard` component."
2.  **Context Management:** If a file gets too long, tell the AI: "Read `courses.json` and `types.ts` first, then write the `Filter` component."
3.  **The "Code-Only" Prompt:** Use this to prevent the AI from wasting tokens on long explanations:
    *   *"Act as a Senior Frontend Engineer. Provide only the code for [Component Name]. Do not explain the logic unless I ask. Use TypeScript and Tailwind CSS."*

---

## 8. Deployment Plan
1.  **Push to GitHub:** Create a private repo and push your code.
2.  **Connect to Vercel:**
    *   Log in to Vercel.
    *   "Import Project" from GitHub.
    *   Click **Deploy**.
3.  **Verify:** Check the `.vercel.app` URL on your mobile phone.

---

## 9. Cost Breakdown

| Phase | Item | Cost |
| :--- | :--- | :--- |
| **Development** | Cursor/Windsurf | $0 (Free tier/Trial) |
| | Gemini/Claude | $0 (Free tier) |
| **Production** | Vercel Hosting | $0 (Hobby Tier) |
| | Cloudflare R2 | $0 (Up to 10GB) |
| | Domain (.com) | ~$10/year (Optional) |
| **TOTAL** | | **$0.00** |

---

## 10. Success Checklist

### ✅ Before Start
* [ ] I have my course data in a CSV/Excel format.
* [ ] I have my Cursor/Windsurf editor installed.
* [ ] I have a GitHub account ready.

### ✅ During Development
* [ ] Can I search for a course and get a result in <200ms?
* [ ] Does the "Compare" modal look clean on a mobile screen?
* [ ] Do the PDF links actually open?

### ✅ Before Launch (The "Bidding Ready" Test)
* [ ] **Mobile Check:** Does the UI feel "app-like" on an iPhone/Android?
* [ ] **Data Check:** Are there any `undefined` errors in the console when clicking a course?
* [ ] **Speed Check:** Run a Lighthouse report; aim for 90+ in Performance.