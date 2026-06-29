import urllib.request
import json
import time
import os
import urllib.parse
import traceback

COURSES_FILE = os.path.join("web", "src", "data", "courses.json")
OUTPUT_FILE = os.path.join("data", "bidding_raw.json")
BASE_URL = "https://www.smumods.sg/api/trpc"

def make_request(endpoint, input_data):
    # input_data is a dict that needs to be JSON serialized and URL encoded inside the specific TRPC structure
    trpc_payload = {
        "0": {
            "json": input_data
        }
    }
    encoded_input = urllib.parse.quote(json.dumps(trpc_payload))
    url = f"{BASE_URL}/{endpoint}?batch=1&input={encoded_input}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if isinstance(data, list) and len(data) > 0:
                    if 'result' in data[0] and 'data' in data[0]['result'] and 'json' in data[0]['result']['data']:
                        return data[0]['result']['data']['json']
                return None
        except urllib.error.HTTPError as e:
            if e.code == 429: # Rate limited
                print(f"Rate limited on {endpoint}, waiting...")
                time.sleep(5)
            else:
                print(f"HTTP Error {e.code} on {endpoint}")
                break
        except Exception as e:
            print(f"Error on {endpoint}: {e}")
            time.sleep(2)
    return None

def main():
    if not os.path.exists(COURSES_FILE):
        print(f"Courses file not found at {COURSES_FILE}")
        return

    with open(COURSES_FILE, 'r', encoding='utf-8') as f:
        courses_data = json.load(f)

    # Convert courses list to module codes
    if isinstance(courses_data, list):
        module_codes = [c.get('code') for c in courses_data if c.get('code')]
    elif isinstance(courses_data, dict):
        module_codes = list(courses_data.keys())
    else:
        print("Unknown courses.json format")
        return
        
    print(f"Found {len(module_codes)} courses.")

    all_bid_data = {}
    
    # Load existing to resume if interrupted
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            all_bid_data = json.load(f)
            print(f"Resuming from {len(all_bid_data)} existing courses.")

    count = 0
    total = len(module_codes)
    for code in module_codes:
        count += 1
        if code in all_bid_data:
            continue
            
        print(f"[{count}/{total}] Fetching {code}...")
        
        course_data = {}
        instructors = make_request("bidAnalytics.getInstructors", {"moduleCode": code})
        time.sleep(0.1)
        
        if not instructors:
            all_bid_data[code] = course_data
            continue
            
        for inst in instructors:
            if not inst: # empty string instructor sometimes happens
                continue
            
            inst_data = {}
            terms = make_request("bidAnalytics.getTermsAvailable", {"moduleCode": code, "instructor": inst})
            time.sleep(0.1)
            
            if not terms:
                continue
                
            for term in terms:
                term_data = {}
                sections = make_request("bidAnalytics.getSections", {"moduleCode": code, "instructor": inst, "term": term})
                time.sleep(0.1)
                
                if not sections:
                    continue
                    
                for sec in sections:
                    chart = make_request("bidAnalytics.getChartData", {"moduleCode": code, "instructor": inst, "term": term, "section": sec})
                    time.sleep(0.1)
                    if chart:
                        term_data[sec] = chart
                        
                if term_data:
                    inst_data[term] = term_data
                    
            if inst_data:
                course_data[inst] = inst_data
                
        all_bid_data[code] = course_data
        
        # Save periodically
        if count % 10 == 0:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(all_bid_data, f, indent=2)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_bid_data, f, separators=(',', ':')) # compact size
        
    print("Done fetching bid data!")

if __name__ == "__main__":
    main()
