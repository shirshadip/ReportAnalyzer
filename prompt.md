PROJECT: Student Performance Analyzer Web App

Build a full-stack web application that analyzes student marksheets and generates a downloadable class performance report.

TECH STACK
Frontend: React (with Vite)
Backend: Python FastAPI
Database: Supabase (PostgreSQL)
Data Analysis: Pandas

APPLICATION GOAL
Users upload student marks data. The system stores it in Supabase, performs analysis using Python + pandas, and displays analytics on the React dashboard. A downloadable report (Excel or PDF) is generated.

SYSTEM FLOW

1. User uploads marksheet data from React frontend (CSV or manual entry).
2. Data is stored in Supabase table called "students".
3. Python FastAPI backend fetches the data from Supabase.
4. Pandas performs analysis.
5. Backend returns statistics to React.
6. React displays results in a dashboard.
7. User can download a generated report.

DATABASE STRUCTURE

Table: students

Columns:
id (integer, primary key)
name (text)
math (integer)
physics (integer)
cs (integer)
english (integer)

EXAMPLE DATA

name | math | physics | cs | english
Alex | 78 | 65 | 89 | 70
Bob | 90 | 88 | 95 | 85
Sara | 55 | 60 | 70 | 62

BACKEND FEATURES

Create a FastAPI server with endpoints:

GET /analyze
Fetch all students from Supabase and perform analysis using pandas.

Analysis must include:

* Total marks for each student
* Percentage score
* Rank list
* Class topper
* Class average percentage
* Average score per subject
* Highest score
* Lowest score

Return results as JSON.

GET /report
Generate a downloadable report file (Excel or PDF) containing:

* Topper
* Class average
* Subject averages
* Ranked student table

FRONTEND FEATURES

React dashboard should include:

Upload Section
Upload CSV or add student records.

Analytics Section
Display:

* Class topper
* Class average
* Highest score
* Lowest score

Subject Analytics
Display average marks for each subject.

Ranking Table
Show ranked list of students with:
Name
Total
Percentage
Rank

Download Button
Download generated report.

UI REQUIREMENTS

Clean minimal dashboard layout:
Header: Student Performance Analyzer
Sections:
Upload marks
Analytics cards
Subject averages
Student ranking table
Download report button

CODE STRUCTURE

Backend:
backend/
main.py
analysis.py

Frontend:
frontend/
src/
components/
UploadForm.jsx
Dashboard.jsx
RankingTable.jsx

REQUIREMENTS

Python dependencies:
fastapi
uvicorn
pandas
supabase
openpyxl

Frontend dependencies:
react
supabase-js
axios

EXPECTED OUTPUT

Working basic version where:

* Students data can be added
* Data stored in Supabase
* Analysis computed with pandas
* Results shown on React dashboard
* Report downloadable
