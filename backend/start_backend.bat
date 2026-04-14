@echo off
echo Starting ClaimSense Backend on port 8001...
cd /d "%~dp0"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
