# 🧠 AGENTS.md - Project Master Plan: smucourses

## 🎯 Project Overview
**Goal**: Build a high-performance, premium course discovery engine for SMU students. Master your curriculum. Bid with confidence.
**Core Value**: Transparency (exam weightages, historical syllabi) and Speed (SSG-driven).
**Target Audience**: "The Strategic Bidder" (SMU Undergrad/Postgrad) like Alex, who wants to filter courses by AREA/TRCK and avoid 100% final exams.
**Architecture**: Flat-File Architecture (Next.js 15 SSG + JSON Data) to ensure $0 hosting cost and instant load times.

## 🛠️ Tech Stack & Constraints
- **Frontend**: Next.js 15 (App Router), Static Site Generation (SSG).
- **Styling**: **Tailwind CSS (v4)**.
- **Animations**: Framer Motion for micro-interactions (hover scale, layout transitions).
- **Icons**: Lucide React.
- **Data**: Local JSON files (`src/data/courses.json`) generated via Python pipeline. No external databases.
- **Storage**: Cloudflare R2 (Syllabus PDFs).
- **Deployment**: Vercel (Static).

## 💡 Mental Model (How to Work)
1. **Understand Intent First**: Verify if requests align with the "Flat-File" architecture. If a suggestion requires a backend database (SQL/NoSQL/Supabase), reject it and propose a `localStorage` or JSON-based alternative.
2. **Data-Driven Development**: `src/data/courses.json` is the Single Source of Truth.
3. **Vibe-Coding Philosophy**: We are building a "Premium Academic" experience. Every UI component must implement the "Dark Academic" aesthetic:
   - Deep backgrounds (`bg-[#0a0a0a]`)
   - Glassmorphism cards (`bg-white/5 backdrop-blur-md border border-white/10`)
   - Accent texts (`text-[#e5e5e5]`)
   - High-end typography (Inter or Outfit)
4. **Instant Performance**: Search results must update in <200ms using Fuse.js and `useMemo`.

## 🗺️ Feature Hierarchy & Roadmap

### P0: The Core Engine (Completed/In Progress)
- [x] **Data Pipeline**: Python scripts extract and format `courses.json`.
- [ ] **Deep Search & Filter**: Filter by School, Level, AREA, and TRCK instantly.
- [ ] **Course Detail Pages**: Pre-rendered SSG pages displaying exact weightages and prerequisites.
- [ ] **Syllabus Transparency**: Links to historical PDFs.

### P1: The Utility Layer (Next Up)
- [ ] **Side-by-Side Comparison**: A tool to compare 2-3 courses.
- [ ] **Premium UI**: Tailwind-powered glassmorphism and Framer Motion transitions.

### P2: The Delight Layer
- [ ] **Local Bookmarks**: Save shortlists using `localStorage`.

## 🚫 Anti-Patterns (DO NOT DO)
- **NO Databases**: Do not use Supabase, MongoDB, or any external DB.
- **NO Client-Side Fetching for Course Data**: Everything must be pre-rendered or loaded from local JSON imports.
- **NO "Lorum Ipsum"**: Use real SMU course data from the JSON file.