import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function checkAllLawleyDrops() {
  console.log('🔍 Checking all drops for Lawley project...\n');

  try {
    // Find the Lawley project ID
    const projects = await sql`
      SELECT id, project_name
      FROM projects
      WHERE LOWER(project_name) LIKE '%lawley%'
    `;

    if (projects.length === 0) {
      console.log('❌ No Lawley project found in database');
      return;
    }

    console.log(`📊 Found project: ${projects[0].project_name} (ID: ${projects[0].id})\n`);
    const projectId = projects[0].id;

    // Get all drops for this project
    const drops = await sql`
      SELECT
        drop_number,
        installation_date,
        status,
        created_at
      FROM drops
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    console.log(`📋 Total drops found: ${drops.length}\n`);

    if (drops.length > 0) {
      console.log('Recent drops:');
      drops.forEach((drop, i) => {
        console.log(`  ${i+1}. ${drop.drop_number} - Date: ${drop.installation_date || 'N/A'} - Status: ${drop.status} - Created: ${drop.created_at}`);
      });
    } else {
      console.log('⚠️  No drops found for this project');
    }

    // Check if there are drops from 25/11/2025
    const nov25Drops = await sql`
      SELECT COUNT(*) as count
      FROM drops
      WHERE project_id = ${projectId}
        AND installation_date = '2025-11-25'
    `;

    console.log(`\n📅 Drops with installation_date = 2025-11-25: ${nov25Drops[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkAllLawleyDrops();
