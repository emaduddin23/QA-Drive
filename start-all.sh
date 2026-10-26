#!/bin/bash
# start-all.sh - Starts both QA Drive Backend (port 3000) and Frontend (Vite)

cd "$(dirname "$0")"

echo "🔍 Checking port 3000..."
STALE_PID=$(lsof -ti tcp:3000 2>/dev/null)
if [ -n "$STALE_PID" ]; then
  echo "⚠️ Freeing existing process on port 3000 (PID: $STALE_PID)..."
  kill -9 $STALE_PID 2>/dev/null
  sleep 1
fi

echo "🚀 Starting QA Drive (Backend Server + Frontend UI)..."
npm run dev

