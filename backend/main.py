from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
import os
from analysis import StudentAnalyzer
from supabase import create_client, Client
import pandas as pd
import io

app = FastAPI(title="Student Performance Analyzer API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
# FIX 1: Removed trailing slash from Vercel URL (causes all CORS requests to fail)
# FIX 2: Added allow_credentials, allow_methods, allow_headers (required for
#         browsers to accept preflight OPTIONS requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://report-analyzer-eta.vercel.app",   # ← no trailing slash
        os.environ.get("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Supabase ──────────────────────────────────────────────────────────────────
# NOTE: Move these to a .env file and set them as environment variables in your
#       Railway/Vercel dashboard. Hardcoding secrets in source code is a
#       security risk — anyone with access to your repo can use your database.
#
#   SUPABASE_URL=https://rbbqzqnetinbnaqrzutx.supabase.co
#   SUPABASE_KEY=eyJhbG...
#
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://rbbqzqnetinbnaqrzutx.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYnF6cW5ldGluYm5hcXJ6dXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzIxNjgsImV4cCI6MjA4ODIwODE2OH0.B9-tH0wSyZwWvEpQunvADN9RAyyVppnUdKOxU08uOZ4")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Models ────────────────────────────────────────────────────────────────────
class Student(BaseModel):
    name: str
    math: int
    physics: int
    cs: int
    english: int


class StudentResponse(BaseModel):
    id: int
    name: str
    math: int
    physics: int
    cs: int
    english: int


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_students_df() -> pd.DataFrame:
    """Fetch all students from Supabase and return as DataFrame."""
    response = supabase.table("students").select("*").execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="No student data found")
    return pd.DataFrame(response.data)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Student Performance Analyzer API", "version": "1.0.0"}


@app.get("/students", response_model=List[StudentResponse])
def get_all_students():
    """Return all students from the database."""
    try:
        response = supabase.table("students").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/students", response_model=StudentResponse)
def add_student(student: Student):
    """Add a single student record."""
    try:
        response = supabase.table("students").insert(student.dict()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/students/{student_id}")
def delete_student(student_id: int):
    """Delete a student by ID."""
    try:
        supabase.table("students").delete().eq("id", student_id).execute()
        return {"message": f"Student {student_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file and bulk-insert students into Supabase."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

        required_cols = {"name", "math", "physics", "cs", "english"}
        if not required_cols.issubset(set(df.columns.str.lower())):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required_cols}"
            )

        df.columns = df.columns.str.lower()
        df = df[["name", "math", "physics", "cs", "english"]]
        records = df.to_dict(orient="records")

        supabase.table("students").insert(records).execute()
        return {
            "message": f"Successfully uploaded {len(records)} students",
            "count": len(records)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/analyze")
def analyze():
    """Fetch all students and return full analysis as JSON."""
    try:
        df = get_students_df()
        analyzer = StudentAnalyzer(df)
        return analyzer.full_analysis()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/report")
def download_report():
    """Generate and stream an Excel report as a file download."""
    try:
        df = get_students_df()
        analyzer = StudentAnalyzer(df)
        excel_bytes = analyzer.generate_excel_report_bytes()
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=student_report.xlsx"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/students")
def clear_all_students():
    """Clear all student records (use with caution)."""
    try:
        supabase.table("students").delete().neq("id", 0).execute()
        return {"message": "All student records cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))