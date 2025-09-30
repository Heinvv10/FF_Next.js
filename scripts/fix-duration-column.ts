import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL!);

async function fixDurationColumnType() {
  try {
    console.log('Fixing duration column type in fireflies_meetings table...');

    // Check if the column exists and its current type
    const columnInfo = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'fireflies_meetings'
      AND column_name = 'duration'
    `;

    if (columnInfo.length === 0) {
      console.log('Duration column not found - table may not exist yet');
      return;
    }

    console.log('Current duration column type:', columnInfo[0].data_type);

    // Alter the column to use DECIMAL(10,2) instead of INTEGER
    await sql`
      ALTER TABLE fireflies_meetings
      ALTER COLUMN duration
      TYPE DECIMAL(10,2)
      USING duration::DECIMAL(10,2)
    `;

    console.log('✅ Duration column type successfully changed to DECIMAL(10,2)');

  } catch (error) {
    console.error('❌ Error fixing duration column type:', error);
    throw error;
  }
}

// Run the fix
fixDurationColumnType()
  .then(() => {
    console.log('Column type fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Column type fix failed:', error);
    process.exit(1);
  });