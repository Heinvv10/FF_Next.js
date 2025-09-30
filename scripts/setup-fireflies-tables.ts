import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config();

if (!process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL or NEON_DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL!);

async function setupFirefliesTables() {
  try {
    console.log('Creating Fireflies database tables...');

    // Create meetings table
    await sql`
      CREATE TABLE IF NOT EXISTS fireflies_meetings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE,
        participants JSONB,
        duration DECIMAL(10,2),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create transcripts table
    await sql`
      CREATE TABLE IF NOT EXISTS fireflies_transcripts (
        id TEXT PRIMARY KEY REFERENCES fireflies_meetings(id) ON DELETE CASCADE,
        full_text TEXT,
        speaker_labels JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create notes table
    await sql`
      CREATE TABLE IF NOT EXISTS fireflies_notes (
        id TEXT PRIMARY KEY REFERENCES fireflies_meetings(id) ON DELETE CASCADE,
        summary TEXT,
        bullet_points JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create sync log table
    await sql`
      CREATE TABLE IF NOT EXISTS fireflies_sync_log (
        id SERIAL PRIMARY KEY,
        sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        meetings_synced INTEGER DEFAULT 0,
        last_meeting_id TEXT,
        status TEXT DEFAULT 'completed'
      );
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fireflies_meetings_created_at
      ON fireflies_meetings(created_at DESC);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_fireflies_meetings_updated_at
      ON fireflies_meetings(updated_at DESC);
    `;

    console.log('✅ Fireflies database tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}

// Run the setup
setupFirefliesTables()
  .then(() => {
    console.log('Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });