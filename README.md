# 🎓 Student Performance Analyzer

A full-stack web application that analyzes student marksheets and generates downloadable class performance reports.

**Tech Stack:** React (Vite) · FastAPI · Supabase (PostgreSQL) · Pandas · Recharts

---

## 📁 Project Structure

```
student-analyzer/
├── backend/
│   ├── main.py             # FastAPI app, all endpoints
│   ├── analysis.py         # Pandas analysis + Excel report generation
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx        # Nav with tabs
│   │   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   │   ├── RankingTable.jsx  # Sortable ranked student table
│   │   │   └── UploadForm.jsx    # Manual entry + CSV upload
│   │   ├── styles/
│   │   │   ├── global.css        # Design system + variables
│   │   │   └── app.css           # Shell layout
│   │   ├── api.js                # Axios API client
│   │   ├── App.jsx               # Root component + routing
│   │   └── main.jsx              # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── supabase_setup.sql      # Database setup SQL
├── example_students.csv    # Sample CSV for testing
└── README.md
```

---

## 🚀 Setup Instructions

### Step 1 — Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** in your Supabase dashboard
3. Copy & paste the contents of `supabase_setup.sql` and click **Run**
4. Note your **Project URL** and **anon public key** (Settings → API)

---

### Step 2 — Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase URL and key:
#   SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_KEY=your-anon-key

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

---

### Step 3 — Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_ANON_KEY=your-anon-key
#   VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

The app will open at `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint        | Description                                    |
|--------|-----------------|------------------------------------------------|
| GET    | `/`             | Health check                                   |
| GET    | `/students`     | Fetch all student records                      |
| POST   | `/students`     | Add a single student                           |
| DELETE | `/students/{id}`| Delete a student by ID                         |
| POST   | `/upload-csv`   | Bulk upload students from CSV file             |
| GET    | `/analyze`      | Run pandas analysis, return JSON results       |
| GET    | `/report`       | Generate & download Excel report               |
| DELETE | `/students`     | Clear all students                             |

### Example: Add a student
```bash
curl -X POST http://localhost:8000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","math":78,"physics":65,"cs":89,"english":70}'
```

### Example: Get analysis
```bash
curl http://localhost:8000/analyze
```

---

## 📊 Analysis Features

The `/analyze` endpoint returns:

```json
{
  "summary": {
    "total_students": 10,
    "class_average_percentage": 74.5,
    "class_average_total": 298.0,
    "highest_percentage": 92.5,
    "lowest_percentage": 45.75,
    "pass_count": 9,
    "fail_count": 1
  },
  "topper": { "name": "Fiona", "total": 373, "percentage": 93.25, "grade": "A+" },
  "highest_scorer": { ... },
  "lowest_scorer": { ... },
  "subject_averages": {
    "Mathematics": 73.8,
    "Physics": 70.7,
    "Computer Science": 79.1,
    "English": 75.4
  },
  "grade_distribution": { "A+": 2, "A": 1, "B+": 3, "B": 2, "C": 1, "D": 1 },
  "ranked_students": [ ... ]
}
```

---

## 📥 CSV Upload Format

```csv
name,math,physics,cs,english
Alex,78,65,89,70
Bob,90,88,95,85
Sara,55,60,70,62
```

- All columns are required
- Marks must be integers 0–100
- Use `example_students.csv` to test

---

## 📄 Excel Report Contents

The downloaded `.xlsx` report includes 3 sheets:

1. **Summary** — Class overview, topper details, subject averages
2. **Ranked Students** — Full ranked table with grades and color-coding
3. **Grade Distribution** — Grade counts with a bar chart

---

## 🎨 Dashboard Features

- **6 stat cards** — Topper, Class average, Highest/Lowest score, Pass/Fail counts
- **Bar chart** — Subject averages (color-coded)
- **Bar chart** — Grade distribution
- **Radar chart** — Class performance across subjects
- **Ranking table** — Sortable by any column, search by name, with progress bars
- **Delete** — Remove individual students
- **Download** — One-click Excel report generation

---

## 🔧 Production Notes

- Replace Supabase anon key with a service role key for server-side operations
- Tighten RLS policies for multi-user environments
- Add authentication (Supabase Auth works natively)
- Use environment variables — never hardcode credentials
- For deployment: FastAPI → Railway/Render, Frontend → Vercel/Netlify

---

## 📋 Database Schema

```sql
CREATE TABLE students (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    math       INTEGER NOT NULL CHECK (math >= 0 AND math <= 100),
    physics    INTEGER NOT NULL CHECK (physics >= 0 AND physics <= 100),
    cs         INTEGER NOT NULL CHECK (cs >= 0 AND cs <= 100),
    english    INTEGER NOT NULL CHECK (english >= 0 AND english <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🐛 Troubleshooting

**CORS errors?** Check that `http://localhost:5173` is in the `allow_origins` list in `main.py`

**Supabase 403?** Verify your anon key and that RLS policies allow the operations

**No data?** Run `supabase_setup.sql` to create the table and insert sample data

**Excel download fails?** Ensure `openpyxl` is installed: `pip install openpyxl`
