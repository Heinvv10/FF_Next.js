require('dotenv').config({ path: ['.env.production.local'] });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'contractor_documents'
    ORDER BY ordinal_position
  `;
  console.log('All columns in contractor_documents:');
  cols.forEach(c => console.log(`  - ${c.column_name}`));

  // Check for specific columns
  const hasStatus = cols.some(c => c.column_name === 'status');
  const hasIsVerified = cols.some(c => c.column_name === 'is_verified');
  const hasFilePath = cols.some(c => c.column_name === 'file_path');
  const hasUploadedBy = cols.some(c => c.column_name === 'uploaded_by');

  console.log('');
  console.log('Status check:');
  console.log(`  status: ${hasStatus ? '✓' : '✗'}`);
  console.log(`  is_verified: ${hasIsVerified ? '✓' : '✗'}`);
  console.log(`  file_path: ${hasFilePath ? '✓' : '✗'}`);
  console.log(`  uploaded_by: ${hasUploadedBy ? '✓' : '✗'}`);
})();
