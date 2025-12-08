require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkDrop() {
  try {
    console.log('Checking for DR1733647...\n');

    // Check if drop exists
    const drop = await sql`
      SELECT drop_number, review_date, project, user_name,
             completed_photos, outstanding_photos, assigned_agent,
             completed, incomplete, feedback_sent
      FROM qa_photo_reviews
      WHERE drop_number = 'DR1733647'
    `;

    if (drop.length > 0) {
      console.log('✅ Drop FOUND in qa_photo_reviews:');
      console.log(JSON.stringify(drop[0], null, 2));
    } else {
      console.log('❌ Drop NOT FOUND in qa_photo_reviews');

      // Check recent Lawley drops
      console.log('\n📋 Recent Lawley drops around Nov 27, 2025:');
      const recent = await sql`
        SELECT drop_number, review_date, project, user_name
        FROM qa_photo_reviews
        WHERE project = 'Lawley'
          AND review_date >= '2025-11-27'
        ORDER BY review_date DESC
        LIMIT 10
      `;

      console.log(`Found ${recent.length} drops:`);
      recent.forEach(r => {
        console.log(`- ${r.drop_number} (${r.review_date}) by ${r.user_name}`);
      });

      // Check if it might be in drops table instead
      console.log('\n🔍 Checking SOW drops table...');
      const sowDrop = await sql`
        SELECT drop_number, project_id, installation_date, address
        FROM drops
        WHERE drop_number = 'DR1733647'
      `;

      if (sowDrop.length > 0) {
        console.log('⚠️  Drop found in SOW drops table (not WA Monitor):');
        console.log(JSON.stringify(sowDrop[0], null, 2));
      } else {
        console.log('❌ Drop not found in SOW drops table either');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDrop();
