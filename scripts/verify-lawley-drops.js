/**
 * Verify Lawley drops count in database
 * Check what's in qa_photo_reviews for today
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function verifyLawleyDrops() {
  try {
    console.log('🔍 Checking today\'s drops in qa_photo_reviews...\n');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Today: ${today}\n`);

    // Count by project for today
    const projectCounts = await sql`
      SELECT
        COALESCE(project, 'Unknown') as project,
        COUNT(*) as count,
        MIN(created_at) as first_entry,
        MAX(created_at) as last_entry
      FROM qa_photo_reviews
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY project
      ORDER BY project ASC
    `;

    console.log('📊 Today\'s Drops by Project:');
    console.log('─'.repeat(80));
    projectCounts.forEach(row => {
      console.log(`${row.project}: ${row.count} drops`);
      console.log(`  First: ${row.first_entry}`);
      console.log(`  Last: ${row.last_entry}`);
      console.log('');
    });

    const total = projectCounts.reduce((sum, row) => sum + parseInt(row.count), 0);
    console.log('─'.repeat(80));
    console.log(`TOTAL: ${total} drops\n`);

    // Get sample Lawley drops to inspect
    console.log('🔎 Sample Lawley drops (first 5):');
    console.log('─'.repeat(80));
    const lawleyDrops = await sql`
      SELECT
        id,
        drop_number,
        project,
        created_at,
        user_name,
        sender_phone
      FROM qa_photo_reviews
      WHERE DATE(created_at) = CURRENT_DATE
        AND project = 'Lawley'
      ORDER BY created_at ASC
      LIMIT 5
    `;

    lawleyDrops.forEach((drop, idx) => {
      console.log(`${idx + 1}. Drop: ${drop.drop_number}`);
      console.log(`   Project: ${drop.project}`);
      console.log(`   Created: ${drop.created_at}`);
      console.log(`   User: ${drop.user_name || 'N/A'}`);
      console.log(`   Phone: ${drop.sender_phone || 'N/A'}`);
      console.log('');
    });

    // Check for potential duplicates
    console.log('🔍 Checking for duplicate drop_numbers (Lawley):');
    console.log('─'.repeat(80));
    const duplicates = await sql`
      SELECT
        drop_number,
        COUNT(*) as count
      FROM qa_photo_reviews
      WHERE DATE(created_at) = CURRENT_DATE
        AND project = 'Lawley'
      GROUP BY drop_number
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `;

    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate drop numbers:');
      duplicates.forEach(dup => {
        console.log(`   ${dup.drop_number}: ${dup.count} entries`);
      });
    } else {
      console.log('✅ No duplicates found');
    }

    console.log('\n✅ Verification complete');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyLawleyDrops();
