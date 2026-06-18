# SMU Courses | Enhanced Course Catalog

An ultra-fast, modern, and transparent course catalog built for SMU students. Designed with a "Dark Academic" aesthetic, this platform allows students to search thousands of historical syllabi, track exam weightages, and plan their degrees instantly.

## 🏗 Architecture
This project uses a **Flat-File Architecture** for maximum performance and zero database hosting costs.
- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, Fuse.js (Client-side Search)
- **Data Layer**: Static JSON files generated from SMU APIs.
- **Storage**: Cloudflare R2 (for hosting 4,700+ PDF syllabi with zero egress fees).

### Directory Structure
- `/web` - The Next.js web application.
- `/scripts` - Python data pipelines for fetching, transforming, and syncing data.
- `/data` - The raw and processed JSON data files (the "Single Source of Truth").

---

## 🚀 Quick Start (Web App)

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the app! No database or environment variables are required for local development.

---

## 📦 PDF Syllabus Synchronization (Cloudflare R2)

To prevent bloat in the git repository, the 4,700+ PDF syllabi are stored in Cloudflare R2. We have a highly secure Python pipeline to sync these files.

### 1. Setup Environment
In the `web/` directory, create a `.env.local` file with your R2 credentials:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=smucourses-syllabi
```

### 2. Install Python Dependencies
```bash
pip install requests boto3 python-dotenv
```

### 3. Run the Sync Script
```bash
python scripts/sync_pdfs.py
```

### Security & Failsafes Built-in:
The `sync_pdfs.py` script has strict security constraints to protect your Cloudflare billing:
- **1.5 GB Global Cap**: The script will automatically terminate if total downloads exceed 1.5GB to ensure you never breach the 10GB free tier.
- **5 MB Individual Cap**: Any file attempting to download more than 5MB is immediately severed to prevent "zip bombs."
- **Magic Byte Validation**: Verifies the `%PDF` header natively to prevent malicious executables from being stored in your bucket.
- **Rate Limiting**: Includes a 0.5s delay to prevent DOSing the source servers.