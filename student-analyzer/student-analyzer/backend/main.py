from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from analysis import StudentAnalyzer
from supabase import create_client, Client
import pandas as pd
import io

app = FastAPI(title="Student Performance Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase config — set these in your .env or replace directly
SUPABASE_URL = os.environ.get("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "YOUR_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


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


def get_students_df() -> pd.DataFrame:
    """Fetch all students from Supabase and return as DataFrame."""
    response = supabase.table("students").select("*").execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="No student data found")
    return pd.DataFrame(response.data)


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

        response = supabase.table("students").insert(records).execute()
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
    """Generate and return a downloadable Excel report."""
    try:
        df = get_students_df()
        analyzer = StudentAnalyzer(df)
        report_path = analyzer.generate_excel_report()
        return FileResponse(
            path=report_path,
            filename="student_performance_report.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/students")
def clear_all_students():
    """Clear all student records (use with caution)."""
    try:
        # Delete all rows by filtering on a condition that's always true
        supabase.table("students").delete().neq("id", 0).execute()
        return {"message": "All student records cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
