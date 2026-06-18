import os
import re
from pathlib import Path

root = Path('Y:/courses')
if not root.exists():
    exit(0)

KNOWN_FACULTIES = {"LKCSB", "SCIS", "SOSS", "SOA", "YPHSL", "CIS", "CEC", "MITB", "LKCSBGPO", "SCISGPO"}

def parse_filename(filename):
    # Strip extension
    name = re.sub(r'\.pdf$', '', filename, flags=re.IGNORECASE)
    
    # Split by any whitespace or underscore
    parts = [p.strip().upper() for p in re.split(r'[\s_]+', name) if p.strip()]
    
    level = "Unknown_Level"
    faculty = "Unknown_Faculty"
    term = "Unknown_Term"
    course = "Unknown_Course"
    
    for i, p in enumerate(parts):
        # Match Term (e.g., 2410, 2532, 2233)
        if re.match(r'^2[0-9]{3}$', p):
            term = p
            continue
            
        # Match complex Term (e.g., AY2025-26, AY2526, 2025FA)
        if re.match(r'^AY\d{2,4}', p) or re.match(r'^20\d{2}[A-Z]{2}$', p):
            term = p
            continue
            
        # Match Course (e.g., MGMT6070, IS105S, COR-CS2232, FNCE305)
        # Allows optional hyphen, must have letters then numbers
        if re.match(r'^[A-Z]{2,5}-?[A-Z]*\d{2,4}[A-Z]?$', p):
            if not p.startswith("AY2") and not p.startswith("202"):
                course = p
                continue
                
        if p in ["UGRD", "PGP", "UG", "PG"]:
            level = p
            continue
            
        if p in KNOWN_FACULTIES:
            faculty = p
            continue
            
    # Try to clean up term string if it's messy like AY2526
    if term.startswith("AY"):
        term = term # Keep as is, or we can standardize later
    elif len(term) >= 3 and term[:2].isdigit():
        year = "20" + term[:2]
        t_digit = term[2:3]
        if t_digit.isdigit():
            term = f"{year} Term {t_digit}"

    return level, faculty, term, course

# Let's test it on a sample of files
sample_files = []
for p in root.rglob('*.pdf'):
    sample_files.append(p.name)

print("Testing Smart Parser on Edge Cases:")
test_names = [
    "PGP_2233_MGMT6070_YUANTO KUSNADI.pdf",
    "UGRD_GSP_SOSS_2532_PSYC202_EDISON TAN.pdf",
    "UGRD_LKCSB_2510_MGMT102_AHMADREZA_MOSTAJABI.pdf",
    "UG FNCE305 AY2025-26 Term 2_HUANG Dashan.pdf",
    "COR-MGMT1302_Er Jwee Ping_AY2526 T1.pdf",
    "PGP_LKCSBGPO_MGMT6078.pdf",
    "ACCT101_RMC_2025FA-2.pdf"
]

for name in test_names:
    l, f, t, c = parse_filename(name)
    print(f"File: {name}\n -> Level: {l}, Faculty: {f}, Term: {t}, Course: {c}\n")

# Check how many are completely unknown
unknowns = 0
for name in sample_files:
    l, f, t, c = parse_filename(name)
    if t == "Unknown_Term" and c == "Unknown_Course":
        unknowns += 1

print(f"\nTotal files missing BOTH Term and Course: {unknowns} out of {len(sample_files)}")
