# SMU Courses Documentation

Welcome to the documentation for the `smucourses` project.

## Core Documents

* **[Product Requirements Document (PRD)](prd.md):** Defines the "what" and the "why." Outlines the target audience, user journey, MVP features, and success metrics.
* **[Technical Design Document](tech_design.md):** Defines the "how." Details the Next.js App Router setup, the Python data pipeline, the flat-file architecture, and deployment strategy.

## Key Architecture Principles

1. **Flat-File Architecture**: To achieve $0 hosting and instant speeds, the app does not use a live database. Instead, data is synced locally into `data/` and pre-built via Next.js Static Site Generation (SSG) at `web/src/data/courses.json`.
2. **Python Pipeline**: 
   * Scripts are located in the `scripts/` directory.
   * `sync_menu.ps1` provides an interactive CLI to run the various scrapers (API, Playwright, PDF sync).
   * `transform_data.py` takes all raw scraped files, merges them, handles smart syllabus matching (global vs section-specific), and writes out the final JSON used by the frontend.
3. **No-Latency Search**: Fuse.js client-side searching ensures that browsing courses is instantaneous.
