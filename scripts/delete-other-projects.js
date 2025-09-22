const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function deleteOtherProjects() {
  try {
    console.log('='.repeat(70));
    console.log('        CLEANING UP - REMOVING OTHER PROJECTS');
    console.log('='.repeat(70));
    console.log('');

    // First, show what we're about to delete
    console.log('📋 PROJECTS TO DELETE:');
    console.log('-'.repeat(50));

    const projectsToDelete = await sql`
      SELECT id, project_name, created_at
      FROM projects
      WHERE id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      ORDER BY project_name
    `;

    if (projectsToDelete.length === 0) {
      console.log('No other projects to delete. Only louissep15 remains.');
      return;
    }

    projectsToDelete.forEach(p => {
      console.log(`• ${p.project_name} (${p.id})`);
      console.log(`  Created: ${p.created_at}`);
    });

    console.log('\n⚠️ WARNING: This will permanently delete:');
    console.log('  - Projects: Lawley, louistest, louisep15B');
    console.log('  - All associated SOW data (drops, fibre)');
    console.log('  - All mappings for these projects');
    console.log('');

    // Delete in order to respect foreign key constraints
    console.log('🗑️ DELETING DATA...\n');

    // 1. Delete SOW mappings
    console.log('Deleting mappings...');
    const mappingResult = await sql`
      DELETE FROM sow_onemap_mapping
      WHERE project_id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      RETURNING id
    `;
    console.log(`  ✅ Deleted ${mappingResult.length} mapping records`);

    // 2. Delete SOW drops
    console.log('Deleting SOW drops...');
    const dropsResult = await sql`
      DELETE FROM sow_drops
      WHERE project_id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      RETURNING id
    `;
    console.log(`  ✅ Deleted ${dropsResult.length} drop records`);

    // 3. Delete SOW poles (should be 0)
    console.log('Deleting SOW poles...');
    const polesResult = await sql`
      DELETE FROM sow_poles
      WHERE project_id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      RETURNING id
    `;
    console.log(`  ✅ Deleted ${polesResult.length} pole records`);

    // 4. Delete SOW fibre
    console.log('Deleting SOW fibre...');
    const fibreResult = await sql`
      DELETE FROM sow_fibre
      WHERE project_id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      RETURNING id
    `;
    console.log(`  ✅ Deleted ${fibreResult.length} fibre records`);

    // 5. Delete project phases if any
    console.log('Deleting project phases...');
    try {
      const phasesResult = await sql`
        DELETE FROM project_phases
        WHERE project_id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
        RETURNING id
      `;
      console.log(`  ✅ Deleted ${phasesResult.length} phase records`);
    } catch (e) {
      console.log('  ⚠️ No project_phases table or already empty');
    }

    // 6. Finally, delete the projects themselves
    console.log('Deleting projects...');
    const projectResult = await sql`
      DELETE FROM projects
      WHERE id != 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      RETURNING project_name
    `;
    console.log(`  ✅ Deleted ${projectResult.length} projects: ${projectResult.map(p => p.project_name).join(', ')}`);

    // Verify what remains
    console.log('\n' + '='.repeat(70));
    console.log('                    CLEANUP COMPLETE');
    console.log('='.repeat(70));
    console.log('');

    const [remaining] = await sql`
      SELECT
        p.project_name,
        (SELECT COUNT(*) FROM sow_poles WHERE project_id = p.id) as poles,
        (SELECT COUNT(*) FROM sow_drops WHERE project_id = p.id) as drops,
        (SELECT COUNT(*) FROM sow_fibre WHERE project_id = p.id) as fibre
      FROM projects p
    `;

    console.log('✅ REMAINING PROJECT:');
    console.log(`  ${remaining.project_name}`);
    console.log(`  - Poles: ${remaining.poles}`);
    console.log(`  - Drops: ${remaining.drops}`);
    console.log(`  - Fibre: ${remaining.fibre}`);
    console.log('');
    console.log('Database is now clean with only louissep15 project!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️ Are you sure you want to delete all projects except louissep15? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    deleteOtherProjects()
      .then(() => {
        console.log('✅ Cleanup completed successfully');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
      });
  } else {
    console.log('Cancelled. No changes made.');
    process.exit(0);
  }
  rl.close();
});