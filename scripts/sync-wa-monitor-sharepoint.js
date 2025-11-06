#!/usr/bin/env node
/**
 * WA Monitor SharePoint Sync Cron Job
 * Syncs daily drops per project to SharePoint NeonDbase sheet
 *
 * Usage: node scripts/sync-wa-monitor-sharepoint.js
 * Cron: Runs daily at 8pm SAST (18:00 SAST = 16:00 UTC)
 */

const http = require('http');

// Configuration
const API_URL = 'http://localhost:3005/api/wa-monitor-sync-sharepoint';
const LOG_PREFIX = '[WA Monitor SharePoint Sync]';

/**
 * Get current timestamp in South African timezone
 */
function getSATimestamp() {
  return new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Log message with timestamp
 */
function log(message, data = null) {
  const timestamp = getSATimestamp();
  console.log(`${LOG_PREFIX} [${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Call SharePoint sync API
 */
async function syncToSharePoint() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 3005,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 second timeout
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${response.error?.message || response.message || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out after 60 seconds'));
    });

    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  log('Starting daily SharePoint sync...');

  try {
    // Call sync API
    const result = await syncToSharePoint();

    // Check if successful
    if (result.success) {
      log('✅ Sync completed successfully', {
        synced: result.data?.synced || 0,
        message: result.data?.message || 'No message',
        date: result.data?.date || new Date().toISOString().split('T')[0],
      });
      process.exit(0);
    } else {
      log('❌ Sync failed', { error: result.error || 'Unknown error' });
      process.exit(1);
    }
  } catch (error) {
    log('❌ Error during sync', { error: error.message });
    process.exit(1);
  }
}

// Run main function
main();
