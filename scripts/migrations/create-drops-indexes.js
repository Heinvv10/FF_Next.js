const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createIndexes() {
  console.log('Creating database indexes for drops table...');

  try {
    // Create composite index for project_id and created_at (most common query)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_project_created
      ON sow_drops(project_id, created_at DESC)
    `;
    console.log('✓ Created idx_sow_drops_project_created');

    // Create index for drop_number (search functionality)
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_drop_number
      ON sow_drops(drop_number)
    `;
    console.log('✓ Created idx_sow_drops_drop_number');

    // Create index for status filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_status
      ON sow_drops(status)
    `;
    console.log('✓ Created idx_sow_drops_status');

    // Create index for address search
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_address
      ON sow_drops USING GIN(to_tsvector('english', address || ' ' || end_point))
    `;
    console.log('✓ Created idx_sow_drops_address');

    // Create composite index for status and created_at
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_status_created
      ON sow_drops(status, created_at DESC)
    `;
    console.log('✓ Created idx_sow_drops_status_created');

    // Create index for municipality filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sow_drops_municipality
      ON sow_drops(municipality)
    `;
    console.log('✓ Created idx_sow_drops_municipality');

    console.log('All indexes created successfully!');

    // Analyze the table to update statistics
    await sql`ANALYZE sow_drops`;
    console.log('✓ Analyzed sow_drops table');

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

// Run the migration
createIndexes()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });