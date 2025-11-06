const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_RIgDxzo4St6d@ep-damp-credit-a857vku0-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require');

(async () => {
  console.log('🔧 Running database migration: add_whatsapp_message_date');
  console.log('='.repeat(80));
  
  try {
    // Add column
    console.log('\n1️⃣ Adding whatsapp_message_date column...');
    await sql`
      ALTER TABLE qa_photo_reviews
      ADD COLUMN IF NOT EXISTS whatsapp_message_date TIMESTAMP WITH TIME ZONE
    `;
    console.log('✅ Column added');
    
    // Create index
    console.log('\n2️⃣ Creating index...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_qa_photo_reviews_whatsapp_message_date
      ON qa_photo_reviews(whatsapp_message_date)
    `;
    console.log('✅ Index created');
    
    // Backfill existing rows
    console.log('\n3️⃣ Backfilling existing rows...');
    const result = await sql`
      UPDATE qa_photo_reviews
      SET whatsapp_message_date = created_at
      WHERE whatsapp_message_date IS NULL
    `;
    console.log(`✅ Updated ${result.count} rows`);
    
    // Verify
    console.log('\n4️⃣ Verifying migration...');
    const verification = await sql`
      SELECT
        COUNT(*) as total_rows,
        COUNT(whatsapp_message_date) as rows_with_message_date,
        COUNT(*) - COUNT(whatsapp_message_date) as rows_missing_message_date
      FROM qa_photo_reviews
    `;
    console.table(verification);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Migration complete!');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
