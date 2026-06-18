import json
from pathlib import Path

def parse_term(term_code):
    if not term_code or not isinstance(term_code, str) or len(term_code) != 4:
        return "Unknown Term"
    year = "20" + term_code[:2]
    t = term_code[2]
    if t == '1':
        return f"{year} Term 1"
    elif t == '2':
        return f"{year} Term 2"
    elif t == '3':
        return f"{year} Term 3"
    else:
        return f"{year} Term {t}"

def main():
    repo_root = Path(__file__).parent.parent
    raw_dir = repo_root / "data" / "raw"
    proc_dir = repo_root / "data" / "processed"
    proc_dir.mkdir(parents=True, exist_ok=True)

    print("Loading raw data...")
    with open(raw_dir / "courses_raw.json", "r", encoding="utf-8") as f:
        active_courses = json.load(f)
    with open(raw_dir / "courses_all_versions_raw.json", "r", encoding="utf-8") as f:
        all_courses = json.load(f)
    with open(raw_dir / "documents_raw.json", "r", encoding="utf-8") as f:
        documents = json.load(f)

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
            school = {"id": dept.get("id"), "name": dept.get("name")}
            
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

        # Documents mapping
        syllabi_map = {} # termCode -> sections[]
        offering_history = set()
        
        if raw_id and raw_id in docs_by_raw_id:
            for doc in docs_by_raw_id[raw_id]:
                term = doc.get("startTerm")
                if term:
                    offering_history.add(term)
                    if term not in syllabi_map:
                        syllabi_map[term] = []
                    syllabi_map[term].append({
                        "section": doc.get("section", "Unknown"),
                        "docId": doc.get("_id"),
                        "pdfUrl": f"https://ccms.coursedog.com/api/v1/sy/smu_peoplesoft/documents/{doc['_id']}/pdf"
                    })
                    
        syllabi_list = []
        for term, sects in syllabi_map.items():
            syllabi_list.append({
                "term": parse_term(term),
                "termCode": term,
                "sections": sects
            })
        # Sort syllabi by term desc
        syllabi_list.sort(key=lambda x: x["termCode"], reverse=True)

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

        course_obj = {
            "id": latest.get("code"),
            "code": latest.get("code"),
            "courseGroupId": cg_id,
            "name": latest.get("name"),
            "longName": latest.get("longName"),
            "subjectCode": latest.get("subjectCode"),
            "courseNumber": latest.get("courseNumber"),
            "level": custom.get("courseType", "Unknown"),
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
            "syllabi": syllabi_list,
            "offeringHistory": sorted(list(offering_history), reverse=True),
            "versions": versions_list,
            "lastUpdated": "2026-06-17"
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

    # Stats
    stats = {
        "totalCourses": len(final_courses),
        "totalVersions": len(all_courses),
        "totalSyllabi": len(documents),
        "lastUpdated": "2026-06-17",
        "schools": len(schools_list)
    }

    print("Saving processed data...")
    with open(proc_dir / "courses.json", "w", encoding="utf-8") as f:
        json.dump(final_courses, f, ensure_ascii=False)
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
