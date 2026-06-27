import json
import os
import time
import requests
from bs4 import BeautifulSoup
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

def scrape_prof(prof_id, name):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        search_url = f"https://faculty.smu.edu.sg/search/node?keys={urllib.parse.quote(name)}"
        res = requests.get(search_url, headers=headers, timeout=10)
        if res.status_code != 200:
            return prof_id, None
            
        soup = BeautifulSoup(res.text, "html.parser")
        
        profile_url = None
        for a in soup.find_all("a", href=True):
            if "/profile/" in a["href"]:
                profile_url = a["href"]
                if profile_url.startswith("/"):
                    profile_url = "https://faculty.smu.edu.sg" + profile_url
                break
                
        if not profile_url:
            return prof_id, None
            
        prof_res = requests.get(profile_url, headers=headers, timeout=10)
        if prof_res.status_code != 200:
            return prof_id, None
            
        prof_soup = BeautifulSoup(prof_res.text, "html.parser")
        
        img_url = None
        for img in prof_soup.find_all("img"):
            src = img.get("src", "")
            if "staffphoto.smu.edu.sg" in src or "600x400" in src:
                if src.startswith("/"):
                    img_url = "https://faculty.smu.edu.sg" + src
                else:
                    img_url = src
                break
                
        return prof_id, img_url
        
    except Exception as e:
        return prof_id, None

def main():
    professors_file = os.path.join("web", "src", "data", "professors.json")
    out_file = os.path.join("web", "src", "data", "faculty_photos.json")
    
    with open(professors_file, "r") as f:
        professors = json.load(f)
        
    photos_data = {}
    if os.path.exists(out_file):
        with open(out_file, "r") as f:
            photos_data = json.load(f)
            
    # Re-scrape ones that are None
    to_scrape = []
    for prof in professors:
        name = prof.get("name")
        prof_id = prof.get("id")
        if name in ["TBA", "Unknown Professor", "Historical Data Unavailable"] or not name:
            photos_data[prof_id] = None
            continue
            
        if prof_id not in photos_data or not photos_data[prof_id]:
            to_scrape.append((prof_id, name))
            
    print(f"Scraping {len(to_scrape)} profiles using 10 threads...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for prof_id, name in to_scrape:
            futures.append(executor.submit(scrape_prof, prof_id, name))
            
        for i, future in enumerate(futures):
            prof_id, img_url = future.result()
            photos_data[prof_id] = img_url
            if img_url:
                print(f"Found photo for {prof_id}: {img_url}")
            if i % 10 == 0:
                with open(out_file, "w") as f:
                    json.dump(photos_data, f, indent=2)
                    
    with open(out_file, "w") as f:
        json.dump(photos_data, f, indent=2)
        
    print(f"Finished scraping!")

if __name__ == "__main__":
    main()
