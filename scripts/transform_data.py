import json
from pathlib import Path
from datetime import datetime

def parse_term(term_code):
    if not term_code or not isinstance(term_code, str) or len(term_code) != 4:
        return "Unknown Term"
    year_num = int(term_code[:2])
    year = f"20{year_num}-{year_num+1}"
    t = term_code[2]
    if t == '1':
        return f"{year} Term 1"
    elif t == '2':
        return f"{year} Term 2"
    elif t == '3':
        return f"{year} Term 3"
    else:
        return f"{year} Term {t}"

def parse_school(school_name):
    if not school_name:
        return "Unknown", "Unknown"
        
    name = school_name.strip()
    
    # Prefix mapping
    if name.startswith("LKCSB") or name == "Lee Kong Chian School of Business":
        return "LKCSB", "Lee Kong Chian School of Business"
    if name.startswith("YPHSL") or name == "Yong Pung How School of Law":
        return "YPHSL", "Yong Pung How School of Law"
    if name.startswith("CIS") or name.startswith("College of Integrative Studies"):
        return "CIS", "College of Integrative Studies"
    if name.startswith("SCIS") or name.startswith("School of Computing and Information Systems"):
        return "SCIS", "School of Computing and Information Systems"
    if name.startswith("SOE") or name.startswith("School of Economics"):
        return "SOE", "School of Economics"
    if name.startswith("SOA") or name.startswith("School of Accountancy"):
        return "SOA", "School of Accountancy"
    if name.startswith("SOSS") or name.startswith("School of Social Sciences"):
        return "SOSS", "School of Social Sciences"
    if name.startswith("CORE") or name == "Core Curriculum":
        return "CORE", "Core Curriculum"
        
    return name, name

def main():
    repo_root = Path(__file__).parent.parent
    raw_dir = repo_root / "data"
    proc_dir = repo_root / "web" / "src" / "data"
    proc_dir.mkdir(parents=True, exist_ok=True)

    print("Loading raw data...")
    with open(raw_dir / "courses_raw.json", "r", encoding="utf-8") as f:
        active_courses = json.load(f)
    with open(raw_dir / "courses_all_versions_raw.json", "r", encoding="utf-8") as f:
        all_courses = json.load(f)
    with open(raw_dir / "documents_raw.json", "r", encoding="utf-8") as f:
        documents = json.load(f)
        
    schedules = []
    try:
        with open(raw_dir / "schedules_raw.json", "r", encoding="utf-8") as f:
            schedules = json.load(f)
        print(f"Loaded {len(schedules)} class schedules.")
    except FileNotFoundError:
        print("No schedules_raw.json found. Skipping schedules mapping.")

    print("Building id map and filtering ghosts...")
    id_map = {} # rawCourseId -> {"code": "...", "courseGroupId": "..."}
    valid_groups = {} # courseGroupId -> list of versions
    
    # Process all courses to build complete valid groups and id_map
    for c in all_courses:
        cg_id = c.get("courseGroupId")
        code = c.get("code")
        name = c.get("name")
        eff_start = c.get("effectiveStartDate")
        
        # Filter ghosts
        if not code or not name or not eff_start:
            continue
            
        custom = c.get("customFields", {})
        raw_id = custom.get("rawCourseId")
        if raw_id:
            id_map[raw_id] = {"code": code, "courseGroupId": cg_id}
            
        if cg_id not in valid_groups:
            valid_groups[cg_id] = []
        valid_groups[cg_id].append(c)

    # Save id map
    with open(proc_dir / "id_map.json", "w", encoding="utf-8") as f:
        json.dump(id_map, f, ensure_ascii=False)

    print("Building schedules map...")
    schedules_map = {}
    for s in schedules:
        if s.get("professor"):
            s["professor"] = s["professor"].title()
            
        if s.get("time"):
            parts = []
            for p in s["time"].split():
                if p.isalpha() and p.isupper():
                    parts.append(p.title())
                else:
                    parts.append(p)
            s["time"] = " ".join(parts)
            
        if s.get("term") and " starting " in s["term"]:
            s["term"] = s["term"].replace(" starting ", " (") + ")"

        ccode = s.get("courseCode")
        if ccode:
            if ccode not in schedules_map:
                schedules_map[ccode] = []
            schedules_map[ccode].append(s)

    print("Transforming courses...")
    final_courses = []
    schools_map = {} # id -> name, count, subjectCodes
    areas_set = set()
    tracks_set = set()

    # Create document lookup by rawCourseId
    docs_by_raw_id = {}
    for doc in documents:
        doc_course = doc.get("course")
        if doc_course and len(doc_course) > 1:
            raw_id = doc_course[:-1] # Strip trailing char
            if raw_id not in docs_by_raw_id:
                docs_by_raw_id[raw_id] = []
            docs_by_raw_id[raw_id].append(doc)

    for cg_id, versions in valid_groups.items():
        # Sort versions by effectiveStartDate desc
        versions.sort(key=lambda x: x.get("effectiveStartDate", ""), reverse=True)
        latest = versions[0]
        
        custom = latest.get("customFields", {})
        raw_id = custom.get("rawCourseId")
        
        # School info
        school = {"id": "Unknown", "name": "Unknown"}
        if latest.get("departments") and len(latest["departments"]) > 0:
            dept = latest["departments"][0]
            raw_name = dept.get("name", "Unknown")
            
            short_name, full_name = parse_school(raw_name)
            school = {"id": short_name, "name": short_name} # Using short_name as both ID and Display Name per user request
            
            s_id = school["id"]
            if s_id not in schools_map:
                schools_map[s_id] = {"id": s_id, "name": school["name"], "courseCount": 0, "subjectCodes": set()}
            schools_map[s_id]["courseCount"] += 1
            if latest.get("subjectCode"):
                schools_map[s_id]["subjectCodes"].add(latest["subjectCode"])

        # Credits
        credits_info = {"units": 1, "contactHours": 0}
        c_block = latest.get("credits", {})
        if c_block.get("creditHours", {}).get("min") is not None:
            credits_info["units"] = c_block["creditHours"]["min"]
        if c_block.get("contactHours", {}).get("value") is not None:
            credits_info["contactHours"] = c_block["contactHours"]["value"]
            
        # Component info
        comp_info = {}
        if latest.get("components") and len(latest["components"]) > 0:
            comp = latest["components"][0]
            comp_info = {
                "type": comp.get("name", "Seminar"),
                "hasFinalExam": comp.get("finalExamType") == "Yes",
                "instructionMode": comp.get("instructionMode", "In Person"),
                "defaultSectionSize": comp.get("defaultSectionSize", 48)
            }

        # Attributes parsing
        attrs = latest.get("attributes", [])
        if not isinstance(attrs, list):
            attrs = []
        if custom.get("catalogAttributes"):
            attrs.extend(custom.get("catalogAttributes"))
            
        areas = []
        tracks = []
        enrollments = []
        rqcx = []
        rqpr = []
        
        for a in set(attrs):
            if a.startswith("AREA - "):
                val = a[7:]
                areas.append(val)
                areas_set.add(val)
            elif a.startswith("TRCK - "):
                val = a[7:]
                tracks.append(val)
                tracks_set.add(val)
            elif a.startswith("ENRL - "): enrollments.append(a[7:])
            elif a.startswith("RQCX - "): rqcx.append(a[7:])
            elif a.startswith("RQPR - "): rqpr.append(a[7:])

        # Unified Schedules Mapping
        course_schedules = schedules_map.get(latest.get("code"), []).copy()
        
        offering_history = set()
        
        if raw_id and raw_id in docs_by_raw_id:
            # Group documents by term to determine if a term has a single global syllabus or multiple custom ones
            term_docs = {}
            for doc in docs_by_raw_id[raw_id]:
                term = doc.get("startTerm")
                if term:
                    if term not in term_docs:
                        term_docs[term] = []
                    term_docs[term].append(doc)
            
            for term, docs_list in term_docs.items():
                offering_history.add(term)
                
                # If there's exactly 1 document for the whole term, assume it's a global syllabus for all sections
                is_global_syllabus = len(docs_list) == 1
                
                for doc in docs_list:
                    doc_id = doc.get("_id")
                    section = doc.get("section", "Unknown")
                    pdf_url = f"https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/{doc_id}/pdf"
                    
                    matched = False
                    
                    if is_global_syllabus:
                        # Apply to ALL schedule rows in this term
                        for s in course_schedules:
                            if s.get("termCode") == term:
                                s["pdfUrl"] = pdf_url
                                matched = True
                    else:
                        # Strict matching by section
                        for s in course_schedules:
                            if s.get("termCode") == term and s.get("section") == section:
                                s["pdfUrl"] = pdf_url
                                matched = True
                                break
                                
                    # If Peoplesoft didn't have this class schedule (e.g. it's from 5 years ago), create a synthetic row to hold the PDF
                    if not matched:
                        course_schedules.append({
                            "courseCode": latest.get("code"),
                            "section": section if not is_global_syllabus else "Any",
                            "classNbr": "",
                            "time": "Historical Data Unavailable",
                            "location": "Historical Data Unavailable",
                            "professor": "Historical Data Unavailable",
                            "term": parse_term(term),
                            "termCode": term,
                            "pdfUrl": pdf_url
                        })
                        
        # Sort unified schedules by termCode descending, then section
        course_schedules.sort(key=lambda x: (x.get("termCode", ""), x.get("section", "")), reverse=True)

        # Versions info
        versions_list = []
        for i, v in enumerate(versions):
            versions_list.append({
                "effectiveStart": v.get("effectiveStartDate"),
                "effectiveEnd": v.get("effectiveEndDate"),
                "isLatest": (i == 0)
            })

        # Requisites parsing (basic structure extraction)
        reqs = latest.get("requisites", {}).get("requisitesSimple", [])
        anti = []
        pre = []
        co = []
        
        if reqs:
            for r in reqs:
                rt = r.get("type", "").lower()
                name = r.get("name", "")
                if rt == "antirequisite":
                    anti.append({"name": name})
                elif rt == "prerequisite":
                    pre.append({"name": name})
                elif rt == "corequisite":
                    co.append({"name": name})

        course_level = custom.get("courseType")
        if not course_level or course_level == "Unknown":
            for a in attrs:
                if a.startswith("Level : "):
                    course_level = a[8:]
                    break
        if not course_level:
            course_level = "Unknown"

        course_obj = {
            "id": latest.get("code"),
            "code": latest.get("code"),
            "courseGroupId": cg_id,
            "name": latest.get("name"),
            "longName": latest.get("longName"),
            "subjectCode": latest.get("subjectCode"),
            "courseNumber": latest.get("courseNumber"),
            "level": course_level,
            "school": school,
            "description": latest.get("description", ""),
            "credits": credits_info,
            "gradeMode": latest.get("gradeMode", ""),
            "component": comp_info,
            "consent": latest.get("consent", ""),
            "dropConsent": latest.get("dropConsent", ""),
            "requisites": {
                "prerequisites": pre,
                "corequisites": co,
                "antirequisites": anti,
                "recommended": []
            },
            "areas": areas,
            "tracks": tracks,
            "enrollment": enrollments,
            "crossListedReqs": rqcx,
            "prereqRefs": rqpr,
            "learningOutcomes": custom.get("standardLearningOutcomes", []),
            "competencies": custom.get("disciplineSpecificCompetencies", []),
            "graduateOutcomes": custom.get("graduateLearningOutcomes", []),
            "topics": latest.get("topics", []),
            "offeringHistory": sorted(list(offering_history), reverse=True),
            "versions": versions_list,
            "schedules": course_schedules,
            "lastUpdated": datetime.now().strftime("%Y-%m-%d")
        }
        final_courses.append(course_obj)

    # Finalize schools map
    for s in schools_map.values():
        s["subjectCodes"] = sorted(list(s["subjectCodes"]))
    schools_list = list(schools_map.values())

    # Build search index
    search_index = []
    for c in final_courses:
        desc = c.get("description", "")
        if len(desc) > 200:
            desc = desc[:197] + "..."
        search_index.append({
            "id": c["id"],
            "code": c["code"],
            "name": c["name"],
            "longName": c["longName"],
            "subjectCode": c["subjectCode"],
            "school": c["school"]["id"],
            "level": c["level"],
            "description": desc
        })

    # Build Professors Dictionary
    professors_map = {}
    import re
    for c in final_courses:
        for s in c.get("schedules", []):
            prof = s.get("professor")
            # Group unknown professors
            if not prof or prof in ["TBA", "Historical Data Unavailable"]:
                prof_clean = "Unknown Professor"
                slug = "unknown-professor"
            else:
                prof_clean = prof.strip()
                slug = re.sub(r'[^a-z0-9]+', '-', prof_clean.lower()).strip('-')
            
            if slug not in professors_map:
                professors_map[slug] = {
                    "id": slug,
                    "name": prof_clean,
                    "history": {}
                }
            
            term = s.get("termCode")
            term_str = s.get("term")
            if not term or not term_str:
                continue
                
            if term not in professors_map[slug]["history"]:
                professors_map[slug]["history"][term] = {
                    "termName": term_str,
                    "courses": []
                }
            
            # Add this course to their term history
            course_summary = {
                "courseCode": c.get("code"),
                "courseName": c.get("name"),
                "section": s.get("section")
            }
            
            if course_summary not in professors_map[slug]["history"][term]["courses"]:
                professors_map[slug]["history"][term]["courses"].append(course_summary)

    professors_list = sorted(list(professors_map.values()), key=lambda x: x["name"])

    # Stats
    stats = {
        "totalCourses": len(final_courses),
        "totalVersions": len(all_courses),
        "totalSyllabi": len(documents),
        "totalProfessors": len(professors_list),
        "lastUpdated": datetime.now().strftime("%Y-%m-%d"),
        "schools": len(schools_list)
    }

    print("Saving processed data...")
    with open(proc_dir / "courses.json", "w", encoding="utf-8") as f:
        json.dump(final_courses, f, ensure_ascii=False)
    with open(proc_dir / "professors.json", "w", encoding="utf-8") as f:
        json.dump(professors_list, f, ensure_ascii=False)
    with open(proc_dir / "search_index.json", "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False)
    with open(proc_dir / "schools.json", "w", encoding="utf-8") as f:
        json.dump(schools_list, f, ensure_ascii=False)
    with open(proc_dir / "areas.json", "w", encoding="utf-8") as f:
        json.dump(sorted(list(areas_set)), f, ensure_ascii=False)
    with open(proc_dir / "tracks.json", "w", encoding="utf-8") as f:
        json.dump(sorted(list(tracks_set)), f, ensure_ascii=False)
    with open(proc_dir / "stats.json", "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False)

    print("Transform complete.")
    print(f"Total structured courses: {len(final_courses)}")

if __name__ == "__main__":
    main()
