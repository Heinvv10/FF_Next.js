import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function checkToday() {
  console.log('📊 Checking Lawley drops activity...\n');

  try {
    // Get Lawley project
    const project = await sql`
      SELECT id, project_name
      FROM projects
      WHERE LOWER(project_name) LIKE '%lawley%'
      LIMIT 1
    `;

    if (project.length === 0) {
      console.log('❌ Lawley project not found');
      return;
    }

    const projectId = project[0].id;
    console.log(`✅ Project: ${project[0].project_name} (${projectId})\n`);

    // Get drops added today
    const today = await sql`
      SELECT drop_number, installation_date, created_at::text, status
      FROM drops
      WHERE project_id = ${projectId}
        AND created_at::date = CURRENT_DATE
      ORDER BY created_at DESC
    `;

    console.log(`📅 Drops added TODAY (${new Date().toISOString().split('T')[0]}):`);
    console.log(`   Count: ${today.length}\n`);

    if (today.length > 0) {
      console.log('Recent drops added today:');
      today.slice(0, 10).forEach((d, i) => {
        console.log(`  ${i+1}. ${d.drop_number} - Added at ${d.created_at}`);
      });
    }

    // Get drops added in last 7 days
    const week = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM drops
      WHERE project_id = ${projectId}
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    console.log('\n📊 Drops added in last 7 days:');
    week.forEach(d => {
      console.log(`  ${d.date}: ${d.count} drops`);
    });

    // Check for the specific drops from user's list
    const userDrops = [
      'DR1733545', 'DR1733540', 'DR1752182', 'DR1733476', 'DR1734241'
    ];

    const found = await sql`
      SELECT drop_number, created_at::text
      FROM drops
      WHERE project_id = ${projectId}
        AND drop_number = ANY(${userDrops})
    `;

    console.log(`\n🔍 Checking sample drops from user's list (${userDrops.length} samples):`);
    console.log(`   Found: ${found.length}/${userDrops.length}`);

    if (found.length > 0) {
      found.forEach(d => {
        console.log(`  ✓ ${d.drop_number} - Added: ${d.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkToday();
