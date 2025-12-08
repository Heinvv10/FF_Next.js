require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function addDrop() {
  try {
    console.log('Adding DR1733647 to qa_photo_reviews...\n');

    // Insert the missing drop
    const result = await sql`
      INSERT INTO qa_photo_reviews (
        drop_number,
        review_date,
        project,
        user_name,
        completed_photos,
        outstanding_photos,
        completed,
        incomplete,
        created_at
      ) VALUES (
        'DR1733647',
        '2025-11-27',
        'Lawley',
        'Manual Entry',
        0,
        12,
        false,
        true,
        NOW()
      )
      RETURNING drop_number, review_date, project, created_at
    `;

    console.log('✅ Successfully added DR1733647:');
    console.log(JSON.stringify(result[0], null, 2));

    // Verify it was added
    console.log('\n✅ Verifying insertion...');
    const verify = await sql`
      SELECT drop_number, review_date, project, user_name, created_at
      FROM qa_photo_reviews
      WHERE drop_number = 'DR1733647'
    `;

    if (verify.length > 0) {
      console.log('✅ Confirmed - DR1733647 now in database');
    } else {
      console.log('❌ Verification failed');
    }

  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('⚠️  DR1733647 already exists in database');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

addDrop();
