#!/bin/bash

# Auto-Evaluator Cron Script
# Calls the auto-process endpoint every 5 minutes
#
# USAGE:
# 1. Make executable: chmod +x auto-evaluator-cron.sh
# 2. Add to crontab: */5 * * * * /var/www/fibreflow/scripts/auto-evaluator-cron.sh
# OR
# 3. Run with PM2: pm2 start auto-evaluator-cron.sh --cron "*/5 * * * *"

# Configuration
API_URL="https://app.fibreflow.app/api/foto/auto-process"
LOG_FILE="/var/log/fibreflow/auto-evaluator.log"
API_KEY="${AUTO_EVALUATOR_API_KEY:-}"  # Optional API key from environment

# Create log directory if it doesn't exist
mkdir -p $(dirname "$LOG_FILE")

# Log timestamp
echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting auto-evaluation run" >> "$LOG_FILE"

# Build headers
HEADERS=""
if [ -n "$API_KEY" ]; then
  HEADERS="-H \"x-api-key: $API_KEY\""
fi

# Call the auto-process endpoint
response=$(curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  $HEADERS \
  -s \
  -w "\n%{http_code}" \
  2>&1)

# Extract HTTP status code
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

# Log the response
echo "[$(date '+%Y-%m-%d %H:%M:%S')] HTTP Status: $http_code" >> "$LOG_FILE"
echo "Response: $body" >> "$LOG_FILE"

# Check if request was successful
if [ "$http_code" -eq 200 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Auto-evaluation completed successfully" >> "$LOG_FILE"

  # Parse stats from JSON (using jq if available)
  if command -v jq &> /dev/null; then
    stats=$(echo "$body" | jq -r '.stats')
    if [ "$stats" != "null" ]; then
      processed=$(echo "$stats" | jq -r '.total_processed')
      successful=$(echo "$stats" | jq -r '.successful')
      echo "Processed: $processed, Successful: $successful" >> "$LOG_FILE"
    fi
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Auto-evaluation failed with status $http_code" >> "$LOG_FILE"
fi

echo "========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Keep log file size under control (rotate if > 10MB)
if [ -f "$LOG_FILE" ]; then
  log_size=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)
  if [ "$log_size" -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.$(date +%Y%m%d_%H%M%S)"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Log rotated" > "$LOG_FILE"
  fi
fi

exit 0