#!/usr/bin/env node

/**
 * Run Contractor Onboarding Migration
 * Creates contractor_documents and contractor_onboarding_stages tables
 *
 * Usage: node scripts/run-onboarding-migration.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });

// Use neon serverless client
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('');
  console.error('Make sure you have .env.local or .env.production with DATABASE_URL');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('🚀 Running contractor onboarding migration...');
  console.log('');

  try {
    console.log('📝 Creating tables and indexes...');
    console.log('');

    // Execute migration statements one by one
    const statements = [
      // 1. Create contractor_documents table
      { name: 'contractor_documents table', sql: `
        CREATE TABLE IF NOT EXISTS contractor_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contractor_id UUID NOT NULL,
          document_type VARCHAR(100) NOT NULL,
          document_name VARCHAR(255) NOT NULL,
          document_number VARCHAR(100),
          file_name VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_size BIGINT,
          mime_type VARCHAR(100),
          issue_date DATE,
          expiry_date DATE,
          is_expired BOOLEAN DEFAULT FALSE,
          days_until_expiry INTEGER,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_by VARCHAR(255),
          verified_at TIMESTAMP WITH TIME ZONE,
          verification_notes TEXT,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'replaced')),
          rejection_reason TEXT,
          notes TEXT,
          tags JSONB DEFAULT '[]',
          uploaded_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
        )
      `},
      // 2. Contractor onboarding stages table
      { name: 'contractor_onboarding_stages table', sql: `
        CREATE TABLE IF NOT EXISTS contractor_onboarding_stages (
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
      `},
      // 3. Add onboarding columns to contractors
      { name: 'contractors onboarding columns', sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'onboarding_progress') THEN
            ALTER TABLE contractors ADD COLUMN onboarding_progress INTEGER DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractors' AND column_name = 'onboarding_completed_at') THEN
            ALTER TABLE contractors ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
          END IF;
        END $$
      `},
    ];

    for (const stmt of statements) {
      try {
        await sql.unsafe(stmt.sql);
        console.log(`✓ Created ${stmt.name}`);
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⊘ ${stmt.name} already exists (skipped)`);
        } else {
          console.error(`✗ Failed to create ${stmt.name}`);
          throw error;
        }
      }
    }

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Tables created/updated:');
    console.log('  - contractor_documents');
    console.log('  - contractor_onboarding_stages');
    console.log('  - contractors (added onboarding columns)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration();
