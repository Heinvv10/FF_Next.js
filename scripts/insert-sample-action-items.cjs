#!/usr/bin/env node

/**
 * Insert Sample Action Items
 * Populates the action_items table with test data
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function insertSampleActionItems() {
  console.log('🚀 Inserting sample action items...\n');

  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);

    // Clear existing data first
    await sql`DELETE FROM action_items`;
    console.log('🗑️  Cleared existing data');

    // Insert sample data
    const sampleItems = [
      {
        action_id: 'ACT-000001',
        title: 'Review project requirements',
        description: 'Review and approve the project requirements document for Q4 initiatives',
        category: 'Project Management',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      {
        action_id: 'ACT-000002',
        title: 'Schedule team meeting',
        description: 'Schedule weekly team sync meeting to discuss project progress',
        category: 'Communication',
        priority: 'medium',
        status: 'completed',
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        action_id: 'ACT-000003',
        title: 'Update API documentation',
        description: 'Update API documentation with latest changes and new endpoints',
        category: 'Documentation',
        priority: 'low',
        status: 'pending',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      },
      {
        action_id: 'ACT-000004',
        title: 'Fix critical authentication bug',
        description: 'Fix authentication issue in production environment affecting user login',
        category: 'Development',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago (overdue)
      },
      {
        action_id: 'ACT-000005',
        title: 'Prepare quarterly report',
        description: 'Compile and prepare quarterly performance report for stakeholders',
        category: 'Reporting',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      },
      {
        action_id: 'ACT-000006',
        title: 'Code review for new feature',
        description: 'Review pull request for new dashboard functionality',
        category: 'Development',
        priority: 'medium',
        status: 'completed',
        due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        action_id: 'ACT-000007',
        title: 'Client presentation preparation',
        description: 'Prepare slides and materials for upcoming client presentation',
        category: 'Client Management',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
      },
      {
        action_id: 'ACT-000008',
        title: 'Database backup verification',
        description: 'Verify and test database backup and recovery procedures',
        category: 'Infrastructure',
        priority: 'high',
        status: 'pending',
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago (overdue)
      },
      {
        action_id: 'ACT-000009',
        title: 'Update security protocols',
        description: 'Review and update security protocols based on latest audit findings',
        category: 'Security',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now
      },
      {
        action_id: 'ACT-000010',
        title: 'Team training session',
        description: 'Conduct training session on new development tools and workflows',
        category: 'Training',
        priority: 'low',
        status: 'completed',
        due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        action_id: 'ACT-000011',
        title: 'Optimize database queries',
        description: 'Optimize slow database queries affecting application performance',
        category: 'Performance',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      },
      {
        action_id: 'ACT-000012',
        title: 'Mobile app testing',
        description: 'Test mobile application on various devices and screen sizes',
        category: 'Quality Assurance',
        priority: 'medium',
        status: 'pending',
        due_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days from now
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
    const inProgress = await sql`SELECT COUNT(*) as count FROM action_items WHERE status = 'in_progress'`;
    const completed = await sql`SELECT COUNT(*) as count FROM action_items WHERE status = 'completed'`;
    const overdue = await sql`
        SELECT COUNT(*) as count
        FROM action_items
        WHERE due_date < NOW() AND status != 'completed'
      `;
    const highPriority = await sql`SELECT COUNT(*) as count FROM action_items WHERE priority = 'high'`;
    const mediumPriority = await sql`SELECT COUNT(*) as count FROM action_items WHERE priority = 'medium'`;
    const lowPriority = await sql`SELECT COUNT(*) as count FROM action_items WHERE priority = 'low'`;

    console.log('\n📋 Summary:');
    console.log(`   Total items: ${count[0].count}`);
    console.log(`   Pending: ${pending[0].count}`);
    console.log(`   In Progress: ${inProgress[0].count}`);
    console.log(`   Completed: ${completed[0].count}`);
    console.log(`   Overdue: ${overdue[0].count}`);
    console.log(`   High Priority: ${highPriority[0].count}`);
    console.log(`   Medium Priority: ${mediumPriority[0].count}`);
    console.log(`   Low Priority: ${lowPriority[0].count}`);

    // Calculate completion rate
    const completionRate = ((parseInt(completed[0].count) / parseInt(count[0].count)) * 100).toFixed(1);
    console.log(`   Completion Rate: ${completionRate}%`);

    console.log('\n🎉 Sample action items created successfully!');
    console.log('🚀 API endpoints should now return meaningful data');

  } catch (error) {
    console.error('❌ Error inserting sample action items:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await insertSampleActionItems();
    console.log('\n✅ Sample data insertion completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sample data insertion failed:', error);
    process.exit(1);
  }
}

main();