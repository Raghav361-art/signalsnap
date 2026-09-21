# Terminal 1: Backend API
cd /Users/mini/Desktop/signalsnap/backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Event Worker
cd /Users/mini/Desktop/signalsnap/backend
uv run python -m app.workers

# Terminal 3: Analytics Dashboard
cd /Users/mini/Desktop/signalsnap/dashboard
python3 -m http.server 5173

# Terminal 4: Test Website
cd /Users/mini/Desktop/signalsnap/test-site
python3 -m http.server 3000
