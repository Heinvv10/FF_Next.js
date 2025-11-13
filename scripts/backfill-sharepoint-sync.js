#!/usr/bin/env node
/**
 * Backfill SharePoint Sync
 * Syncs last 7 days of drops to catch up after fixing the sync
 *
 * Usage: node scripts/backfill-sharepoint-sync.js
 */

const http = require('http');

const API_URL = 'http://localhost:3005/api/wa-monitor-sync-sharepoint';

async function backfillDays(daysBack) {
  console.log(`\n🔄 Backfilling last ${daysBack} days to SharePoint...\n`);

  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    console.log(`📅 Syncing ${dateStr}...`);

    try {
      await syncDate(dateStr);
      console.log(`   ✅ Success\n`);

      // Wait 2 seconds between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Backfill complete!\n');
}

async function syncDate(date) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);

    const postData = JSON.stringify({ date });

    const options = {
      hostname: url.hostname,
      port: url.port || 3005,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 120000,
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
            console.log(`   Projects: ${response.data.succeeded}/${response.data.total}`);
            resolve(response);
          } else {
            reject(new Error(response.error?.message || 'Unknown error'));
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
      reject(new Error('Request timed out'));
    });

    req.write(postData);
    req.end();
  });
}

// Backfill last 7 days
backfillDays(7);
