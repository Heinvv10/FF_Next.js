#!/usr/bin/env node

/**
 * Create Action Items Table Migration Script
 * Creates the action_items table and required indexes
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function createActionItemsTable() {
  console.log('🚀 Creating action_items table...\n');

  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'action_items'
      ) as exists
    `;

    console.log(`📊 Table exists: ${tableExists[0].exists}`);

    if (!tableExists[0].exists) {
      console.log('🔧 Creating action_items table...');

      // Create the table
      await sql`
        CREATE TABLE action_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          action_id VARCHAR(50) NOT NULL UNIQUE,
          project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
          related_table VARCHAR(50),
          related_id UUID,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) DEFAULT 'General',
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
          due_date TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      console.log('✅ Table created successfully');

      // Create indexes for performance
      console.log('📈 Creating indexes...');

      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_priority ON action_items(priority)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_created_at ON action_items(created_at)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_action_items_action_id ON action_items(action_id)`;

      console.log('✅ Indexes created successfully');

      // Insert sample data for testing
      console.log('📝 Inserting sample data...');

      const sampleItems = [
        {
          action_id: 'ACT-000001',
          title: 'Review project requirements',
          description: 'Review and approve the project requirements document',
          category: 'Project Management',
          priority: 'high',
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        },
        {
          action_id: 'ACT-000002',
          title: 'Schedule team meeting',
          description: 'Schedule weekly team sync meeting',
          category: 'Communication',
          priority: 'medium',
          status: 'completed',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          action_id: 'ACT-000003',
          title: 'Update documentation',
          description: 'Update API documentation with latest changes',
          category: 'Documentation',
          priority: 'low',
          status: 'pending',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        },
        {
          action_id: 'ACT-000004',
          title: 'Fix critical bug',
          description: 'Fix authentication issue in production',
          category: 'Development',
          priority: 'high',
          status: 'pending',
          due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago (overdue)
        }
      ];

      for (const item of sampleItems) {
        await sql`
          INSERT INTO action_items (
            action_id, title, description, category, priority,
            status, due_date
          ) VALUES (
            ${item.action_id}, ${item.title}, ${item.description},
            ${item.category}, ${item.priority}, ${item.status}, ${item.due_date}
          )
        `;
      }

      console.log('✅ Sample data inserted successfully');

      // Verify the data
      const count = await sql`SELECT COUNT(*) as count FROM action_items`;
      const pending = await sql`SELECT COUNT(*) as count FROM action_items WHERE status = 'pending'`;
      const completed = await sql`SELECT COUNT(*) as count FROM action_items WHERE status = 'completed'`;
      const overdue = await sql`
        SELECT COUNT(*) as count
        FROM action_items
        WHERE due_date < NOW() AND status != 'completed'
      `;

      console.log('\n📋 Summary:');
      console.log(`   Total items: ${count[0].count}`);
      console.log(`   Pending: ${pending[0].count}`);
      console.log(`   Completed: ${completed[0].count}`);
      console.log(`   Overdue: ${overdue[0].count}`);

    } else {
      console.log('ℹ️  Table already exists');

      // Show current stats
      const count = await sql`SELECT COUNT(*) as count FROM action_items`;
      console.log(`   Current records: ${count[0].count}`);
    }

    console.log('\n🎉 Action items table setup complete!');
    console.log('🚀 API endpoints should now work correctly');

  } catch (error) {
    console.error('❌ Error creating action_items table:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await createActionItemsTable();
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();