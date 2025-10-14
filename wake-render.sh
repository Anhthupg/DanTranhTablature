#!/bin/bash
# Wake up Render.com service
# Usage: ./wake-render.sh YOUR_RENDER_URL

RENDER_URL="${1:-https://your-app.onrender.com}"

echo "Waking up Render service at: $RENDER_URL"
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" "$RENDER_URL"
echo "Service should be awake now!"
