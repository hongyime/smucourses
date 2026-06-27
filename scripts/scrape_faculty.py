import json
import os
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
                
        title_div = prof_soup.find("div", class_="designation")
        title = title_div.text.strip() if title_div else None
        
        # Helper function for lists
        def get_list_after_header(soup_obj, header_text):
            for tag in soup_obj.find_all(['p', 'h3', 'h4', 'h2']):
                if header_text.lower() in tag.text.lower():
                    ul = tag.find_next_sibling('ul')
                    if ul:
                        return [li.text.strip() for li in ul.find_all('li')]
            return []
            
        research_areas = get_list_after_header(prof_soup, 'research interests')
        if not research_areas:
            areas_div = prof_soup.find("div", class_="research-areas-div")
            if areas_div:
                research_areas = [li.contents[0].strip() for li in areas_div.find_all("li") if li.contents and isinstance(li.contents[0], str) and li.contents[0].strip()]
        
        qualifications = get_list_after_header(prof_soup, 'qualifications')
        courses_taught = get_list_after_header(prof_soup, 'course(s) taught')
        
        # Email
        import re
        email_text = prof_soup.get_text()
        emails = set(re.findall(r'[a-zA-Z0-9_.+-]+@smu\.edu\.sg', email_text))
        emails.discard('enquiry@smu.edu.sg')
        email = list(emails)[0].replace("Email", "") if emails else None
        
        # Phone
        phone_tag = prof_soup.find('a', href=lambda href: href and href.startswith('tel:'))
        phone = phone_tag.text.strip() if phone_tag else None
        
        # CV
        cv_link = prof_soup.find('a', string=lambda t: t and 'Curriculum Vitae' in t)
        cv_url = cv_link['href'] if cv_link else None
        
        # Scholar
        scholar = prof_soup.find('a', href=lambda href: href and 'scholar.google' in href)
        scholar_url = scholar['href'] if scholar else None
        
        # Scopus
        scopus = prof_soup.find('a', href=lambda href: href and 'scopus.com' in href)
        scopus_url = scopus['href'] if scopus else None
                    
        return prof_id, {
            "photoUrl": img_url,
            "title": title,
            "profileUrl": profile_url,
            "researchAreas": research_areas,
            "qualifications": qualifications,
            "coursesTaught": courses_taught,
            "email": email,
            "phone": phone,
            "cvUrl": cv_url,
            "scholarUrl": scholar_url,
            "scopusUrl": scopus_url
        }
        
    except Exception as e:
        return prof_id, None

def main():
    professors_file = os.path.join("web", "src", "data", "professors.json")
    out_file = os.path.join("web", "src", "data", "faculty_extra.json")
    
    with open(professors_file, "r") as f:
        professors = json.load(f)
        
    extra_data = {}
    if os.path.exists(out_file):
        with open(out_file, "r") as f:
            extra_data = json.load(f)
            
    to_scrape = []
    for prof in professors:
        name = prof.get("name")
        prof_id = prof.get("id")
        if name in ["TBA", "Unknown Professor", "Historical Data Unavailable"] or not name:
            extra_data[prof_id] = None
            continue
            
        if prof_id not in extra_data or not extra_data[prof_id]:
            to_scrape.append((prof_id, name))
            
    print(f"Scraping {len(to_scrape)} profiles using 10 threads...")
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for prof_id, name in to_scrape:
            futures.append(executor.submit(scrape_prof, prof_id, name))
            
        for i, future in enumerate(futures):
            prof_id, data = future.result()
            extra_data[prof_id] = data
            if data:
                print(f"Scraped data for {prof_id}")
            if i > 0 and i % 10 == 0:
                with open(out_file, "w") as f:
                    json.dump(extra_data, f, indent=2)
                    
    with open(out_file, "w") as f:
        json.dump(extra_data, f, indent=2)
        
    print(f"Finished scraping!")

if __name__ == "__main__":
    main()
