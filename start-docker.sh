#!/bin/sh

# Docker startup script for PitchDecker
# Used as the container entrypoint — production mode

echo "=== Starting PitchDecker ==="

# Azure Web Apps sets PORT or WEBSITES_PORT; default to 3000
APP_PORT=${PORT:-${WEBSITES_PORT:-3000}}
echo "App will start on port: $APP_PORT"

# Log environment info
echo "Node version: $(node --version)"
echo "Environment: ${NODE_ENV:-production}"

if [ -n "$WEBSITE_HOSTNAME" ]; then
    echo "Azure hostname: $WEBSITE_HOSTNAME"
fi

# Run database migrations or setup if needed in the future
# echo "Running migrations..."
# npm run migrate

# Start Next.js in production mode
echo "Starting Next.js production server on port $APP_PORT..."
PORT=$APP_PORT node server.js 2>/dev/null || PORT=$APP_PORT npm run start

# If we get here, the server exited
echo "Server exited with code $?"
exit 1
