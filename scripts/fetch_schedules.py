import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import json
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data"
URL = "https://publiceservices.smu.edu.sg/psc/ps/EMPLOYEE/SA/c/SIS_CR.SIS_CS_SS_CLS_SCHD.GBL"

def parse_html_to_schedules(html):
    soup = BeautifulSoup(html, 'html.parser')
    schedules = []
    
    index = 0
    while True:
        course_code_span = soup.find(id=f"SIS_CLS_SCHD_VW_SIS_CRSE_CD${index}")
        if not course_code_span:
            break
            
        course_code = course_code_span.text.strip()
        
        section_span = soup.find(id=f"SIS_CLS_SCHD_VW_CLASS_SECTION${index}")
        section = section_span.text.strip() if section_span else ""
        
        nbr_span = soup.find(id=f"SIS_CLS_SCHD_VW_CLASS_NBR${index}")
        class_nbr = nbr_span.text.strip() if nbr_span else ""
        
        days_span = soup.find(id=f"SIS_CLS_SCHD_VW_CLASS_MTG_DAYS${index}")
        start_span = soup.find(id=f"SIS_CLS_SCHD_VW_MEETING_TIME_START${index}")
        end_span = soup.find(id=f"SIS_CLS_SCHD_VW_MEETING_TIME_END${index}")
        
        days = days_span.text.strip() if days_span else ""
        start = start_span.text.strip() if start_span else ""
        end = end_span.text.strip() if end_span else ""
        
        meeting_time = f"{days} {start} - {end}".strip()
        if meeting_time == "-":
            meeting_time = ""
        
        loc_span = soup.find(id=f"SIS_CLS_SCHD_VW_FACILITY_DESCR${index}")
        location = loc_span.text.strip() if loc_span else ""
        
        prof_span = soup.find(id=f"SIS_CLS_SCHD_VW_SIS_NAME${index}")
        professor = prof_span.text.strip() if prof_span else ""
        
        schedules.append({
            "courseCode": course_code,
            "section": section,
            "classNbr": class_nbr,
            "time": meeting_time,
            "location": location,
            "professor": professor
        })
        
        index += 1
        
    return schedules

async def intercept_route(route):
    # Block images, stylesheets, fonts, and media to vastly improve speed and reduce RAM
    if route.request.resource_type in ["image", "stylesheet", "font", "media"]:
        await route.abort()
    else:
        await route.continue_()

async def worker(worker_id, queue, browser, all_schedules):
    context = await browser.new_context()
    page = await context.new_page()
    await page.route("**/*", intercept_route)
    page.on("dialog", lambda dialog: dialog.accept())
    
    logging.info(f"Worker {worker_id} initializing and navigating to BOSS...")
    
    max_retries_init = 3
    initialized = False
    
    for init_attempt in range(max_retries_init):
        try:
            await page.goto(URL, timeout=60000, wait_until="domcontentloaded")
            await page.wait_for_timeout(2000) # Let dynamic JS load
            
            target_frame = None
            for frame in page.frames:
                if frame.name == 'ptifrmtgtframe':
                    target_frame = frame
                    break
            if not target_frame:
                target_frame = page.main_frame
                
            await target_frame.locator("#SIS_CLS_SCHDWRK_ACAD_CAREER").select_option("UGRD")
            await page.wait_for_timeout(1000)
            
            initialized = True
            break
        except Exception as e:
            logging.warning(f"Worker {worker_id} initialization failed on attempt {init_attempt+1}: {e}")
            await page.wait_for_timeout(2000)
            
    if not initialized:
        logging.error(f"Worker {worker_id} failed to initialize. Exiting.")
        await context.close()
        return

    current_term = None

    while not queue.empty():
        item = await queue.get()
        term_val = item["term_val"]
        term_name = item["term_name"]
        subject = item["subject"]
        
        logging.info(f"Worker {worker_id} picked up: {term_val} - {subject} (Remaining: {queue.qsize()})")
        
        max_retries = 3
        success = False
        
        for attempt in range(max_retries):
            try:
                if current_term != term_val:
                    await target_frame.locator("#SIS_CLS_SCHDWRK_STRM").select_option(term_val)
                    await page.wait_for_timeout(1000)
                    current_term = term_val
                
                await target_frame.locator("#SIS_CLS_SCHDWRK_SUBJECT").select_option(subject)
                await page.wait_for_timeout(1500) # Give more time for the AJAX postback
                
                # Check if there's a processing overlay and wait for it to be hidden
                try:
                    await target_frame.locator("#WAIT_win0").wait_for(state="hidden", timeout=3000)
                except:
                    pass

                await target_frame.locator("#SIS_CLS_SCHDWRK_SEARCH_BTN").click(timeout=10000, force=True)
                
                # Smart wait: Wait for the result table or a specific error popup
                try:
                    await target_frame.locator("table.PSLEVEL1GRID").wait_for(timeout=15000)
                except:
                    # Sometimes there are no classes for a subject, and it pops a dialogue. We auto-accept dialogues.
                    await page.wait_for_timeout(2000)
                    
                html = await target_frame.content()
                schedules = parse_html_to_schedules(html)
                
                for s in schedules:
                    s["term"] = term_name
                    s["termCode"] = term_val
                    all_schedules.append(s)
                    
                logging.info(f"Worker {worker_id} scraped {term_val} {subject} -> {len(schedules)} classes.")
                
                # Click the "Return to Search" button to reset the view
                try:
                    await target_frame.locator("#win0divSIS_CLS_SCHD_VW_RETURN_PB button, #SIS_CLS_SCHD_VW_RETURN_PB").click(timeout=3000)
                    await page.wait_for_timeout(1000)
                except:
                    # If button not found, maybe no results were found. Re-initialize just to be safe.
                    await target_frame.locator("#SIS_CLS_SCHDWRK_ACAD_CAREER").select_option("UGRD")
                    current_term = None # Force term selection next time
                    
                success = True
                break
                
            except Exception as e:
                logging.warning(f"Worker {worker_id} failed to scrape {subject} on attempt {attempt+1}: {e}")
                # Refresh page and re-init to clear any broken state
                try:
                    await page.goto(URL, timeout=30000)
                    await page.wait_for_timeout(2000)
                    target_frame = None
                    for frame in page.frames:
                        if frame.name == 'ptifrmtgtframe':
                            target_frame = frame
                            break
                    if not target_frame:
                        target_frame = page.main_frame
                    await target_frame.locator("#SIS_CLS_SCHDWRK_ACAD_CAREER").select_option("UGRD")
                    await page.wait_for_timeout(1000)
                    current_term = None
                except Exception as ex:
                    logging.error(f"Worker {worker_id} failed to recover: {ex}")
                    
        if not success:
            logging.error(f"Worker {worker_id} completely failed to scrape {subject} after {max_retries} retries.")
            
        queue.task_done()
        
    await context.close()

async def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    all_schedules = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        logging.info("Initializing Master Page to fetch terms and subjects...")
        context = await browser.new_context()
        page = await context.new_page()
        await page.route("**/*", intercept_route)
        page.on("dialog", lambda dialog: dialog.accept())
        
        await page.goto(URL, timeout=60000, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        target_frame = None
        for frame in page.frames:
            if frame.name == 'ptifrmtgtframe':
                target_frame = frame
                break
        if not target_frame:
            target_frame = page.main_frame

        await target_frame.locator("#SIS_CLS_SCHDWRK_ACAD_CAREER").select_option("UGRD")
        await page.wait_for_timeout(2000)
        
        options = await target_frame.locator("#SIS_CLS_SCHDWRK_STRM option").element_handles()
        terms_to_scrape = []
        for opt in options:
            text = (await opt.inner_text()).strip()
            val = await opt.get_attribute("value")
            if val and "Extension" not in text:
                terms_to_scrape.append({"val": val, "name": text})
                
        logging.info(f"Found {len(terms_to_scrape)} terms. Queueing subjects...")
        
        queue = asyncio.Queue()
        count = 0
        
        for term in terms_to_scrape:
            await target_frame.locator("#SIS_CLS_SCHDWRK_STRM").select_option(term["val"])
            await page.wait_for_timeout(2000)
            
            subject_options = await target_frame.locator("#SIS_CLS_SCHDWRK_SUBJECT option").element_handles()
            for opt in subject_options:
                val = await opt.get_attribute("value")
                if val and val.strip():
                    queue.put_nowait({
                        "term_val": term["val"],
                        "term_name": term["name"],
                        "subject": val
                    })
                    count += 1
                    
        logging.info(f"Queued {count} total subjects across {len(terms_to_scrape)} terms. Closing Master Page...")
        await context.close()
        
        # Spin up 5 workers
        num_workers = 5
        workers = []
        for i in range(num_workers):
            workers.append(asyncio.create_task(worker(i+1, queue, browser, all_schedules)))
            
        await queue.join() # Wait for all subjects to be processed
        
        # Cancel workers if any are stuck
        for w in workers:
            w.cancel()
            
        await browser.close()
        
    out_path = RAW_DIR / "schedules_raw.json"
    
    # Merge with existing schedules to prevent data loss
    if out_path.exists():
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing_schedules = json.load(f)
            
            # Deduplicate using termCode, courseCode, section, and classNbr
            def make_key(s):
                return f"{s.get('termCode','')}_{s.get('courseCode','')}_{s.get('section','')}_{s.get('classNbr','')}"
            
            schedules_dict = {make_key(s): s for s in existing_schedules}
            
            # Update/append newly scraped schedules
            for s in all_schedules:
                schedules_dict[make_key(s)] = s
                
            all_schedules = list(schedules_dict.values())
        except Exception as e:
            logging.error(f"Error merging schedules: {e}")
            
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_schedules, f, ensure_ascii=False, indent=2)
        
    logging.info(f"Pipeline Complete! Saved {len(all_schedules)} class schedules to {out_path}.")

if __name__ == "__main__":
    asyncio.run(main())
