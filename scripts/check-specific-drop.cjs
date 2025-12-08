require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkDrop() {
  try {
    // Check for DR1733647
    console.log('Checking for DR1733647...\n');
    const drop1 = await sql`
      SELECT drop_number, review_date, project, user_name, created_at
      FROM qa_photo_reviews
      WHERE drop_number = 'DR1733647'
    `;

    if (drop1.length > 0) {
      console.log('✅ DR1733647 FOUND:');
      console.log(JSON.stringify(drop1[0], null, 2));
    } else {
      console.log('❌ DR1733647 NOT FOUND');

      // Check for similar drop numbers
      console.log('\n🔍 Checking for similar drops (DR1733xxx)...');
      const similar = await sql`
        SELECT drop_number, review_date, project, user_name
        FROM qa_photo_reviews
        WHERE drop_number LIKE 'DR1733%'
        ORDER BY drop_number
      `;
      console.log(`Found ${similar.length} similar drops:`);
      similar.forEach(d => console.log(`- ${d.drop_number} (${d.project})`));
    }

    // Check recent Lawley drops from Nov 27
    console.log('\n📅 Lawley drops from Nov 27, 2025:');
    const nov27 = await sql`
      SELECT drop_number, review_date, user_name, created_at
      FROM qa_photo_reviews
      WHERE project = 'Lawley'
        AND DATE(review_date) = '2025-11-27'
      ORDER BY created_at
    `;

    console.log(`Found ${nov27.length} Lawley drops on Nov 27:`);
    nov27.forEach(d => {
      console.log(`- ${d.drop_number} at ${d.created_at} by ${d.user_name}`);
    });

    // Verify system is working with recent drop
    console.log('\n✅ Verifying system is working - checking DR1855489:');
    const recent = await sql`
      SELECT drop_number, review_date, project, user_name, created_at, updated_at
      FROM qa_photo_reviews
      WHERE drop_number = 'DR1855489'
    `;

    if (recent.length > 0) {
      console.log('✅ System IS working - DR1855489 found:');
      console.log(JSON.stringify(recent[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkDrop();
