#!/usr/bin/env node

/**
 * Fix contractor_onboarding_stages table to use UUID
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function fixSchema() {
  console.log('🔧 Fixing contractor_onboarding_stages schema...\n');

  try {
    // Drop existing table if it exists
    console.log('1. Dropping existing table (if exists)...');
    await sql`DROP TABLE IF EXISTS contractor_onboarding_stages CASCADE`;
    console.log('✅ Dropped\n');

    // Create table with UUID
    console.log('2. Creating table with UUID support...');
    await sql`
      CREATE TABLE contractor_onboarding_stages (
          id SERIAL PRIMARY KEY,
          contractor_id UUID NOT NULL,

          stage_name VARCHAR(100) NOT NULL,
          stage_order INTEGER NOT NULL,

          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
          completion_percentage INTEGER DEFAULT 0,

          required_documents JSONB DEFAULT '[]',
          completed_documents JSONB DEFAULT '[]',

          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          due_date DATE,

          notes TEXT,

          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          UNIQUE(contractor_id, stage_name),
          FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Table created\n');

    // Create indexes
    console.log('3. Creating indexes...');
    await sql`CREATE INDEX idx_contractor_onboarding_contractor ON contractor_onboarding_stages(contractor_id)`;
    await sql`CREATE INDEX idx_contractor_onboarding_status ON contractor_onboarding_stages(status)`;
    console.log('✅ Indexes created\n');

    // Create trigger
    console.log('4. Creating update trigger...');
    await sql`
      CREATE OR REPLACE FUNCTION update_onboarding_stages_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      CREATE TRIGGER update_contractor_onboarding_stages_updated_at
      BEFORE UPDATE ON contractor_onboarding_stages
      FOR EACH ROW EXECUTE FUNCTION update_onboarding_stages_updated_at()
    `;
    console.log('✅ Trigger created\n');

    console.log('✅ Schema fixed successfully!');
    console.log('\nTable now supports UUID contractor IDs ✨');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  }
}

fixSchema();
