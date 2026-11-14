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

commit_changes() {
  if [ -z "$(git status --porcelain)" ]; then
    printf '%s\n' 'No changes detected in the curriculum today.'
    return
  fi

  run_step 'Checking TypeScript and saved selections before commit...' sh -c 'cd web && npx tsc --noEmit && npm test'
  git add data/ web/src/data/
  if [ -d web/public/pdfs ]; then git add web/public/pdfs/; fi
  git commit -m 'chore: automated course data and PDF sync'
  git push origin main
  printf '%s\n' 'Successfully pushed to main. Vercel is building the new SSG site.'
}

printf '%s\n' 'Starting Automated SMU Courses Data Sync'
run_step '[1/5] Fetching latest API data...' python scripts/fetch_courses.py
run_step '[2/5] Fetching live class schedules via Playwright...' python scripts/fetch_schedules.py
run_step '[3/5] Scraping latest faculty profile photos...' python scripts/scrape_faculty.py
run_step '[4/5] Fetching bid analytics data...' python scripts/fetch_bids.py
if [ -f data/bidding_raw.json ]; then cp data/bidding_raw.json web/src/data/bids.json; fi
run_step '[5/5] Transforming raw data into SSG format...' python scripts/transform_data.py
commit_changes
