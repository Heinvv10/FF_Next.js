const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require');

async function checkRecords() {
  try {
    const rows = await sql`
      SELECT dr_number, overall_status, average_score, created_at
      FROM foto_ai_reviews
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log(`\nFound ${rows.length} records in foto_ai_reviews table:\n`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.dr_number} - ${row.overall_status} - ${row.average_score}/10 - ${row.created_at}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRecords();
