#!/usr/bin/env node
/**
 * Fireflies Meetings Sync Cron Job
 *
 * Syncs Fireflies meeting transcripts to Neon database and sends email notification.
 *
 * Usage:
 *   npx tsx scripts/cron/sync-meetings-fireflies.ts
 *
 * VPS Cron Setup (8 PM SAST = 18:00 UTC daily):
 *   0 18 * * * cd /var/www/fibreflow && /usr/bin/npx tsx scripts/cron/sync-meetings-fireflies.ts >> /var/log/meetings-sync.log 2>&1
 */

import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { syncFirefliesToNeon } from '../../src/services/fireflies/firefliesService';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ai@velocityfibre.co.za';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set');
  process.exit(1);
}

if (!FIREFLIES_API_KEY) {
  console.error('❌ FIREFLIES_API_KEY not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const resend = new Resend(RESEND_API_KEY);

function generateEmailHtml(success: boolean, meetingCount?: number, error?: string): string {
  const timestamp = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  if (success) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .success { color: #10b981; font-size: 48px; }
    .stats { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Fireflies Sync Success</h1>
    </div>
    <div class="content">
      <div class="success">✓</div>
      <h2>Meetings Synchronized Successfully</h2>

      <div class="stats">
        <p><strong>📊 Synced Meetings:</strong> ${meetingCount}</p>
        <p><strong>⏰ Sync Time:</strong> ${timestamp}</p>
        <p><strong>🔄 Status:</strong> Completed</p>
      </div>

      <p>The daily Fireflies meeting sync has completed successfully. All meeting transcripts have been synchronized to the database.</p>

      <p>
        <a href="https://app.fibreflow.app/meetings" style="display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          View Meetings Dashboard
        </a>
      </p>

      <div class="footer">
        <p>This is an automated notification from FibreFlow Meetings Sync</p>
        <p>Next sync scheduled for tomorrow at 8:00 PM SAST</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 8px 8px; }
    .error { color: #ef4444; font-size: 48px; }
    .error-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">❌ Fireflies Sync Failed</h1>
    </div>
    <div class="content">
      <div class="error">✗</div>
      <h2>Sync Error Detected</h2>

      <div class="error-details">
        <p><strong>⏰ Failed At:</strong> ${timestamp}</p>
        <p><strong>❌ Error:</strong></p>
        <pre style="background: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto;">${error || 'Unknown error'}</pre>
      </div>

      <p><strong>Action Required:</strong></p>
      <ul>
        <li>Check the Fireflies API key is valid</li>
        <li>Verify network connectivity to Fireflies API</li>
        <li>Review server logs: <code>/var/log/meetings-sync.log</code></li>
        <li>Check database connection</li>
      </ul>

      <p>
        <a href="https://app.fibreflow.app/meetings" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          Check Meetings Dashboard
        </a>
      </p>

      <div class="footer">
        <p>This is an automated error notification from FibreFlow Meetings Sync</p>
        <p>Next sync attempt scheduled for tomorrow at 8:00 PM SAST</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}

async function main() {
  console.log('🚀 Starting Fireflies meetings sync cron job...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  let syncedCount = 0;
  let success = false;
  let errorMessage = '';

  try {
    // Sync meetings from Fireflies
    console.log('🔄 Syncing meetings from Fireflies...');
    syncedCount = await syncFirefliesToNeon(FIREFLIES_API_KEY, sql);
    success = true;
    console.log(`✅ Successfully synced ${syncedCount} meetings`);

  } catch (error: any) {
    success = false;
    errorMessage = error.message || String(error);
    console.error('❌ Sync failed:', errorMessage);
  }

  // Send email notification
  try {
    console.log('📧 Sending email notification...');

    const emailHtml = generateEmailHtml(success, syncedCount, errorMessage);
    const subject = success
      ? `✅ Fireflies Sync Success - ${syncedCount} meetings synced`
      : '❌ Fireflies Sync Failed - Action Required';

    const result = await resend.emails.send({
      from: 'FibreFlow Meetings <meetings@fibreflow.app>',
      to: ADMIN_EMAIL,
      subject: subject,
      html: emailHtml
    });

    if (result.error) {
      console.error('❌ Failed to send email notification:', result.error);
    } else {
      console.log(`✅ Email notification sent (ID: ${result.data?.id})`);
    }

  } catch (emailError: any) {
    console.error('❌ Error sending email:', emailError.message);
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`  🔄 Sync Status: ${success ? '✅ Success' : '❌ Failed'}`);
  console.log(`  📊 Meetings Synced: ${syncedCount}`);
  if (!success) {
    console.log(`  ❌ Error: ${errorMessage}`);
  }
  console.log('✅ Cron job completed\n');

  // Exit with error code if sync failed
  if (!success) {
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
