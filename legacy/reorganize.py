import os
import re
import shutil
from pathlib import Path

root = Path('Y:/courses')

if not root.exists():
    print(f"Directory {root} does not exist.")
    exit(1)

moved_count = 0
skipped_count = 0

print("Scanning and reorganizing PDFs. This might take a moment...")

for p in list(root.rglob('*.pdf')):
    filename = p.name
    
    # Use the same sanitization for parsing (but keep original filename for the actual file)
    clean_name = re.sub(r'[\s]+', ' ', filename).strip()
    clean_name = re.sub(r'\s+-\s*|\s*-\s+|_+\s+|\s+_+', '_', clean_name)
    
    parts = [pt.strip().upper() for pt in re.split(r'[\s_]+', re.sub(r'\.pdf$', '', clean_name, flags=re.IGNORECASE)) if pt.strip()]
    
    term = "Unknown_Term"
    course = "Unknown_Course"
    
    for pt in parts:
        # Match Standard Term
        if re.match(r'^2[0-9]{3}$', pt):
            term = pt
        # Match Complex Term
        elif re.match(r'^AY\d{2,4}', pt) or re.match(r'^20\d{2}[A-Z]{2}$', pt):
            term = pt
        # Match Course
        elif re.match(r'^[A-Z]{2,5}-?[A-Z]*\d{2,4}[A-Z]?$', pt):
            if not pt.startswith("AY2") and not pt.startswith("202"):
                course = pt
    
    term_folder = term
    if len(term) >= 3 and term[:2].isdigit() and not term.startswith("AY"):
        year = "20" + term[:2]
        t_digit = term[2:3]
        if t_digit.isdigit():
            term_folder = f"{year} Term {t_digit}"
        else:
            term_folder = year
    
    if course != "Unknown_Course":
        target_dir = root / course / term_folder
    else:
        target_dir = root / "Unsorted"
        
    target_path = target_dir / filename
    
    if p.absolute() != target_path.absolute():
        target_dir.mkdir(parents=True, exist_ok=True)
        # If a file already exists there (e.g. duplicate), remove the old one before moving
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        try:
            shutil.move(str(p), str(target_path))
            moved_count += 1
        except Exception as e:
            print(f"Failed to move {filename}: {e}")
    else:
        skipped_count += 1

print(f"Moved {moved_count} files to the new structure.")
print(f"Skipped {skipped_count} files that were already correctly placed.")

# Clean up empty directories bottom-up
print("Cleaning up empty leftover directories...")
for d in sorted(root.rglob('*'), key=lambda x: len(x.parts), reverse=True):
    if d.is_dir():
        try:
            d.rmdir()
        except OSError:
            pass # Directory not empty or permissions issue, which is fine

print("Reorganization complete!")
