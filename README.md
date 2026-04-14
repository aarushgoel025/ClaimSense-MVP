# ClaimSense MVP

**AI-powered Indian health insurance claim rejection analyzer and appeal letter generator.**

---

## Project Structure

```
ClaimSense MVP/
├── backend/
│   ├── main.py              # FastAPI app with /analyze endpoint
│   ├── .env                 # Your GEMINI_API_KEY goes here
│   ├── requirements.txt
│   └── start_backend.bat    # Double-click to start backend
└── frontend/
    ├── src/
    │   ├── App.jsx           # All 4 views (Landing, Upload, Loading, Results)
    │   └── index.css         # Arctic Professional design system
    ├── index.html
    ├── tailwind.config.js
    └── start_frontend.bat   # Double-click to start frontend
```

---

## Quick Start

### Step 1: Set your Gemini API Key

Edit `backend/.env`:
```
GEMINI_API_KEY=your_actual_key_here
```
Get your key from: https://aistudio.google.com/app/apikey

### Step 2: Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
Or double-click `backend/start_backend.bat`

Backend runs at: **http://localhost:8000**

### Step 3: Start the Frontend

```bash
cd frontend
npm run dev
```
Or double-click `frontend/start_frontend.bat`

Frontend runs at: **http://localhost:5173** (or 5174 if 5173 is busy)

---

## API Reference

### POST /analyze
- **Input**: `multipart/form-data` with a `file` field (PDF)
- **Output**:
```json
{
  "success_score": 78,
  "rejection_reason": "...",
  "grounds_for_appeal": ["...", "..."],
  "recommended_strategy": "...",
  "appeal_letter": "Full text..."
}
```

### GET /health
Returns `{"status": "ok"}` — use to confirm server is up.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| AI Model | Gemini 2.5 Flash |
| Backend | FastAPI + PyMuPDF |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v3 |
| PDF Export | jsPDF |

---

## Features

- 📄 Drag-and-drop PDF upload
- 🤖 AI analysis against IRDAI guidelines and Ombudsman rulings
- 📊 Animated success score ring (0–100)
- ⚖️ Grounds for appeal as styled badges
- 📝 Full appeal letter with copy + PDF download
- 🎨 Arctic Professional design system
