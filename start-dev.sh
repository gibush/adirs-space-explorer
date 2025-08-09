#!/bin/bash

# Space Explorer - Development Server Startup Script
# This script starts both backend and frontend servers in development mode

set -e  # Exit on any error

echo "🚀 Starting Space Explorer in Development Mode..."
echo "================================================"

# Function to cleanup background processes on script exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    # Kill all background jobs started by this script
    jobs -p | xargs -r kill 2>/dev/null || true
    wait
    echo "✅ All servers stopped."
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

# Check if required directories exist
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

# Start Backend Server
echo "📡 Starting Backend Server (FastAPI on port 8080)..."
cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in backend directory"
    echo "   Using default environment variables"
fi

# Start backend server in background
uvicorn app:app --reload --port 8080 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Error: Failed to start backend server"
    exit 1
fi

echo "✅ Backend server started successfully (PID: $BACKEND_PID)"

# Start Frontend Server
echo "🌐 Starting Frontend Server (Vite dev server)..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend server in background
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Error: Failed to start frontend server"
    exit 1
fi

echo "✅ Frontend server started successfully (PID: $FRONTEND_PID)"

echo ""
echo "🎉 Development servers are running!"
echo "=================================="
echo "📡 Backend API:  http://localhost:8080"
echo "🌐 Frontend App: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
echo "🔗 Click to open frontend: http://localhost:5173"
echo ""

# Keep script running and wait for user interrupt
wait
