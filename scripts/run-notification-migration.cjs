const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('Running notification logs migration...');

    // Create notification_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS notification_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          submission_id UUID REFERENCES drop_submissions(id) ON DELETE CASCADE,
          drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
          contractor_id UUID REFERENCES drops_contractors(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          channel VARCHAR(50) NOT NULL,
          sent BOOLEAN DEFAULT false,
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✓ Created notification_logs table');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_drop_id ON notification_logs(drop_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_contractor_id ON notification_logs(contractor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type)`;

    console.log('✓ Created indexes');

    // Create update function
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create trigger
    await sql`
      DROP TRIGGER IF EXISTS update_notification_logs_updated_at ON notification_logs
    `;

    await sql`
      CREATE TRIGGER update_notification_logs_updated_at
          BEFORE UPDATE ON notification_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✓ Created triggers');

    console.log('✅ Notification logs migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();