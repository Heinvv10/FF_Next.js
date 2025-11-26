import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function checkReal() {
  console.log('🔍 Checking actual Lawley drops in database...\n');

  try {
    // Get total count first
    const total = await sql`
      SELECT COUNT(*) as count
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
    `;

    console.log(`📊 Total Lawley drops in database: ${total[0].count}\n`);

    // Get recent drops
    const recent = await sql`
      SELECT drop_number, created_at, status
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log('📋 Most recent 50 drops:');
    recent.forEach((d, i) => {
      const date = new Date(d.created_at);
      console.log(`  ${i+1}. ${d.drop_number} - ${date.toLocaleString()} - ${d.status}`);
    });

    // Check for the specific drop user showed
    const specific = await sql`
      SELECT *
      FROM drops
      WHERE drop_number = 'DR1752169'
    `;

    console.log('\n🎯 Checking DR1752169 specifically:');
    if (specific.length > 0) {
      console.log('  ✅ FOUND!');
      console.log(`  Created: ${specific[0].created_at}`);
      console.log(`  Status: ${specific[0].status}`);
      console.log(`  Project ID: ${specific[0].project_id}`);
    } else {
      console.log('  ❌ NOT FOUND');
    }

    // Check for drops from Nov 25, 2025
    const nov25 = await sql`
      SELECT drop_number, created_at
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
        AND created_at::date = '2025-11-25'
      ORDER BY created_at
    `;

    console.log(`\n📅 Drops from Nov 25, 2025: ${nov25.length}`);
    if (nov25.length > 0) {
      nov25.slice(0, 10).forEach(d => {
        console.log(`  ✓ ${d.drop_number} - ${d.created_at}`);
      });
    }

    // Check today
    const today = await sql`
      SELECT drop_number, created_at
      FROM drops
      WHERE project_id = '4eb13426-b2a1-472d-9b3c-277082ae9b55'
        AND created_at::date = CURRENT_DATE
      ORDER BY created_at DESC
    `;

    console.log(`\n📅 Drops added TODAY (Nov 26): ${today.length}`);
    if (today.length > 0) {
      today.forEach(d => {
        console.log(`  ✓ ${d.drop_number} - ${new Date(d.created_at).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkReal();
