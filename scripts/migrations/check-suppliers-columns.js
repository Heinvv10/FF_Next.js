const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function checkSuppliersColumns() {
  console.log('Checking suppliers table columns...');

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'suppliers'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    console.log('Available columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\nNow inserting simple test data...');

    // Insert very basic data
    await sql`
      INSERT INTO suppliers (code, company_name, email, status)
      VALUES ('SUP-TEST', 'Test Supplier', 'test@example.com', 'ACTIVE')
      ON CONFLICT (code) DO NOTHING
    `;

    console.log('✓ Inserted basic test supplier');

    const count = await sql`SELECT COUNT(*) as total FROM suppliers`;
    console.log(`\n📊 Suppliers table contains ${count[0].total} records`);

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkSuppliersColumns();