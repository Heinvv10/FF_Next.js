#!/usr/bin/env node
/**
 * Daily Reminders Cron Job
 *
 * Sends daily email reminders to users with pending reminders.
 *
 * Usage:
 *   npx tsx scripts/cron/send-daily-reminders.ts
 *
 * VPS Cron Setup (8 AM daily):
 *   0 8 * * * cd /var/www/fibreflow && /usr/bin/npx tsx scripts/cron/send-daily-reminders.ts >> /var/log/reminders-cron.log 2>&1
 */

import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';
import { generateDailyReminderEmail } from '../../src/lib/email/templates/dailyReminder';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const resend = new Resend(RESEND_API_KEY);

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

interface UserWithEmail {
  user_id: string;
  email: string;
  first_name?: string;
}

async function main() {
  console.log('🚀 Starting daily reminders cron job...');
  console.log(`📅 Date: ${new Date().toISOString()}`);

  try {
    // Step 1: Get all users with pending reminders who have email notifications enabled
    const usersQuery = `
      SELECT DISTINCT
        r.user_id,
        u.email_address as email,
        u.first_name
      FROM reminders r
      INNER JOIN reminder_preferences p ON r.user_id = p.user_id
      INNER JOIN users u ON r.user_id = u.clerk_id
      WHERE r.status = 'pending'
        AND p.enabled = true
        AND (r.due_date IS NULL OR r.due_date <= CURRENT_DATE + INTERVAL '1 day')
    `;

    const users = await sql(usersQuery) as UserWithEmail[];

    console.log(`👥 Found ${users.length} users with pending reminders`);

    if (users.length === 0) {
      console.log('✅ No users to send reminders to');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Step 2: For each user, get their reminders and send email
    for (const user of users) {
      try {
        // Get user's pending reminders
        const remindersQuery = `
          SELECT *
          FROM reminders
          WHERE user_id = $1
            AND status = 'pending'
            AND (due_date IS NULL OR due_date <= CURRENT_DATE + INTERVAL '1 day')
          ORDER BY
            CASE priority
              WHEN 'high' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
            END,
            due_date ASC NULLS LAST
        `;

        const reminders = await sql(remindersQuery, [user.user_id]) as Reminder[];

        if (reminders.length === 0) {
          console.log(`  ⏭️  User ${user.email}: No reminders to send`);
          continue;
        }

        // Generate email HTML
        const emailHtml = generateDailyReminderEmail(reminders);

        // Send email via Resend
        const result = await resend.emails.send({
          from: 'FibreFlow Reminders <reminders@fibreflow.app>',
          to: user.email,
          subject: `Your Daily Reminders (${reminders.length} pending)`,
          html: emailHtml
        });

        if (result.error) {
          console.error(`  ❌ User ${user.email}: Failed to send`, result.error);
          errorCount++;
        } else {
          console.log(`  ✅ User ${user.email}: Sent ${reminders.length} reminders (ID: ${result.data?.id})`);
          successCount++;
        }

        // Rate limiting: wait 100ms between emails to avoid Resend rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ❌ User ${user.email}: Error processing`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📧 Total processed: ${users.length}`);
    console.log('✅ Cron job completed\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
