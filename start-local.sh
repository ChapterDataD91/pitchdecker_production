#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting PitchDecker (Local Development) ===${NC}"

# Define port
APP_PORT=3000

echo -e "${BLUE}App will start on port: $APP_PORT${NC}"

# Check for dependencies
check_dependency() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo -e "${RED}$1 is required but not installed. Aborting.${NC}"
        exit 1
    fi
}

check_dependency "node"
check_dependency "npm"

# Function to gracefully kill processes
graceful_kill() {
    local pid=$1
    local name=$2

    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo -e "${YELLOW}Stopping $name (PID: $pid)...${NC}"
        kill "$pid" 2>/dev/null
        sleep 3

        # If still running, force kill
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Force killing $name...${NC}"
            kill -9 "$pid" 2>/dev/null
        fi
    fi
}

# Kill all processes on the port and wait until it's actually free
free_port() {
    local port=$1
    local pids
    pids=$(lsof -t -i:$port 2>/dev/null)

    if [ -z "$pids" ]; then
        return
    fi

    echo -e "${YELLOW}Port $port is in use. Killing existing processes...${NC}"

    # Kill each PID found on the port
    for pid in $pids; do
        graceful_kill "$pid" "process $pid on port $port"
    done

    # Wait until port is actually free (up to 10 seconds)
    for i in $(seq 1 20); do
        if ! lsof -t -i:$port >/dev/null 2>&1; then
            return
        fi
        # If still occupied after 5s, force kill anything remaining
        if [ $i -eq 10 ]; then
            echo -e "${YELLOW}Force killing remaining processes on port $port...${NC}"
            lsof -t -i:$port 2>/dev/null | xargs kill -9 2>/dev/null
        fi
        sleep 0.5
    done

    if lsof -t -i:$port >/dev/null 2>&1; then
        echo -e "${RED}Could not free port $port. Aborting.${NC}"
        exit 1
    fi
}

# Check for existing processes on the port
echo -e "${BLUE}Checking for existing processes...${NC}"
free_port $APP_PORT
echo -e "${GREEN}Port $APP_PORT is free. Starting app...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
fi

# Start Next.js dev server
echo -e "${BLUE}Starting Next.js dev server on port $APP_PORT...${NC}"
PORT=$APP_PORT npm run dev &
APP_PID=$!

# Wait for app to be ready
echo -e "${BLUE}Waiting for app to be ready...${NC}"
for i in $(seq 1 30); do
    if curl -sf http://localhost:$APP_PORT >/dev/null 2>&1; then
        echo -e "${GREEN}App is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}App failed to start within 30 seconds${NC}"
        graceful_kill "$APP_PID" "next dev"
        exit 1
    fi
    sleep 1
    echo -n "."
done

# Output information
echo ""
echo -e "${GREEN}  App running on: http://localhost:$APP_PORT${NC}"
echo -e "${BLUE}  API routes:     http://localhost:$APP_PORT/api${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    graceful_kill "$APP_PID" "next dev"

    # Clean up any remaining Next.js processes
    REMAINING=$(pgrep -f "next dev" 2>/dev/null)
    if [ -n "$REMAINING" ]; then
        echo "$REMAINING" | xargs kill -9 2>/dev/null
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up signal handling
trap cleanup INT TERM HUP EXIT

# Wait for signals
wait
