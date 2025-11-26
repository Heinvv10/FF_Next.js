import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

const drNumbers = [
  'DR1733545', 'DR1733540', 'DR1752182', 'DR1733476', 'DR1734241',
  'DR1733512', 'DR1733509', 'Dr1733484', 'DR1733515', 'DR1733496',
  'DR1733477', 'DR1732223', 'DR1734329', 'DR1733516', 'DR1752177',
  'DR1734515', 'DR1734510', 'DR1733197', 'DR1733200', 'DR1734591',
  'DR1734344', 'DR1732261', 'DR1732263', 'DR1752141', 'DR1733259',
  'DR1734849', 'DR1752152', 'DR1734284', 'DR1752167', 'DR1733237',
  'DR1732234', 'DR1752143', 'DR1733227', 'DR1732173', 'DR1752142',
  'DR1734943', 'DR1752133', 'DR1752161', 'DR1752159', 'DR1752101',
  'DR1734844', 'DR1752106'
];

async function checkQaReviews() {
  console.log('🔍 Checking qa_photo_reviews table for Lawley drops...\n');

  try {
    // First check DR1752169 that user showed us
    const testDrop = await sql`
      SELECT drop_number, created_at, project, sender_phone
      FROM qa_photo_reviews
      WHERE drop_number = 'DR1752169'
    `;

    console.log('📋 Testing with DR1752169 (shown by user):');
    if (testDrop.length > 0) {
      console.log('  ✅ FOUND!');
      console.log(`  Created: ${testDrop[0].created_at}`);
      console.log(`  Project: ${testDrop[0].project}`);
    } else {
      console.log('  ❌ NOT FOUND\n');
    }

    // Get total Lawley drops
    const total = await sql`
      SELECT COUNT(*) as count
      FROM qa_photo_reviews
      WHERE project = 'Lawley'
    `;

    console.log(`\n📊 Total Lawley drops in qa_photo_reviews: ${total[0].count}\n`);

    // Check for drops from Nov 25, 2025
    const nov25 = await sql`
      SELECT drop_number, created_at
      FROM qa_photo_reviews
      WHERE project = 'Lawley'
        AND DATE(created_at) = '2025-11-25'
      ORDER BY created_at
    `;

    console.log(`📅 Drops from Nov 25, 2025: ${nov25.length}`);

    // Check the specific drops from user's list
    const found = await sql`
      SELECT drop_number, created_at
      FROM qa_photo_reviews
      WHERE project = 'Lawley'
        AND drop_number = ANY(${drNumbers})
      ORDER BY drop_number
    `;

    console.log(`\n✅ Found ${found.length} out of 42 drops from your list\n`);

    // Create a set of found DR numbers (case-insensitive)
    const foundDRs = new Set(found.map(d => d.drop_number.toUpperCase()));

    // Check which ones are missing
    const missing = drNumbers.filter(dr => !foundDRs.has(dr.toUpperCase()));

    if (found.length > 0) {
      console.log('📋 Found drops:');
      found.slice(0, 10).forEach(drop => {
        console.log(`  ✓ ${drop.drop_number} - ${drop.created_at}`);
      });
      if (found.length > 10) {
        console.log(`  ... and ${found.length - 10} more`);
      }
    }

    if (missing.length > 0) {
      console.log(`\n❌ Missing ${missing.length} drops:`);
      missing.slice(0, 10).forEach(dr => console.log(`  ✗ ${dr}`));
      if (missing.length > 10) {
        console.log(`  ... and ${missing.length - 10} more`);
      }
    } else {
      console.log('\n✅ All 42 drops found in database!');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total expected: 42`);
    console.log(`   Found: ${found.length}`);
    console.log(`   Missing: ${missing.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkQaReviews();
