#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
cd "$repo_dir"

run_step() {
  printf '\n%s\n' "$1"
  shift
  "$@"
}

transform_and_push() {
  run_step 'Transforming raw data into SSG format...' python scripts/transform_data.py
  if [ -z "$(git status --porcelain)" ]; then
    printf '%s\n' 'No changes detected in the curriculum.'
    return
  fi

  run_step 'Checking TypeScript and saved selections before commit...' sh -c 'cd web && npx tsc --noEmit && npm test'
  git add data/ web/src/data/
  if [ -d web/public/pdfs ]; then git add web/public/pdfs/; fi
  git commit -m 'chore: automated course data and PDF sync'
  git push origin main
  printf '%s\n' 'Successfully pushed to main. Vercel is building the new SSG site.'
}

cat <<'MENU'
========================================
    SMU COURSES - DATA PIPELINE MENU
========================================

  [1] Sync ALL Data (APIs + PeopleSoft + Photos + Bids)
  [2] Sync Class Schedules Only (PeopleSoft)
  [3] Sync Historical Syllabi Only (Coursedog PDFs)
  [4] Sync Bid Analytics Only (SMUMods)
  [5] Transform Data & Build Only (No Scraping)
  [6] Exit
MENU
printf 'Select an option (1-6): '
read -r choice

case "$choice" in
  1)
    run_step 'Fetching latest API data...' python scripts/fetch_courses.py
    run_step 'Fetching live class schedules via Playwright...' python scripts/fetch_schedules.py
    run_step 'Scraping latest faculty profile photos...' python scripts/scrape_faculty.py
    run_step 'Fetching bid analytics data...' python scripts/fetch_bids.py
    if [ -f data/bidding_raw.json ]; then cp data/bidding_raw.json web/src/data/bids.json; fi
    transform_and_push
    ;;
  2)
    run_step 'Fetching live class schedules via Playwright...' python scripts/fetch_schedules.py
    transform_and_push
    ;;
  3)
    run_step 'Syncing latest PDF syllabi...' python scripts/sync_pdfs.py
    transform_and_push
    ;;
  4)
    run_step 'Fetching bid analytics data...' python scripts/fetch_bids.py
    if [ -f data/bidding_raw.json ]; then cp data/bidding_raw.json web/src/data/bids.json; fi
    transform_and_push
    ;;
  5) transform_and_push ;;
  6) exit 0 ;;
  *) printf '%s\n' 'Invalid selection.' >&2; exit 1 ;;
esac
