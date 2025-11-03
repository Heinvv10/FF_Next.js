/**
 * Test script to create a contractor project assignment
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function testAssignment() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Get first contractor
    const contractorResult = await client.query(`
      SELECT id, company_name FROM contractors LIMIT 1
    `);

    if (contractorResult.rows.length === 0) {
      console.log('✗ No contractors found. Create a contractor first.');
      return;
    }

    const contractor = contractorResult.rows[0];
    console.log(`✓ Found contractor: ${contractor.company_name} (${contractor.id})`);

    // Get first project
    const projectResult = await client.query(`
      SELECT id, project_name, project_code FROM projects LIMIT 1
    `);

    if (projectResult.rows.length === 0) {
      console.log('✗ No projects found. Create a project first.');
      return;
    }

    const project = projectResult.rows[0];
    console.log(`✓ Found project: ${project.project_name} (${project.project_code})`);

    // Create assignment
    console.log('\n📝 Creating assignment...');

    const result = await client.query(`
      INSERT INTO contractor_projects (
        contractor_id,
        project_id,
        role,
        assignment_status,
        start_date,
        end_date,
        workload_percentage,
        estimated_hours,
        contract_value,
        payment_terms,
        is_primary_contractor,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `, [
      contractor.id,
      project.id,
      'Fiber Splicing',
      'active',
      new Date(),
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      100,
      320,
      150000,
      'Net 30',
      true,
      'Test assignment created by script'
    ]);

    console.log('\n✅ Assignment created successfully!');
    console.log('\nAssignment Details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Contractor: ${contractor.company_name}`);
    console.log(`  Project: ${project.project_name}`);
    console.log(`  Role: ${result.rows[0].role}`);
    console.log(`  Status: ${result.rows[0].assignment_status}`);
    console.log(`  Contract Value: R ${result.rows[0].contract_value}`);

    console.log(`\n🌐 View at: http://localhost:3005/contractors/${contractor.id}`);

  } catch (error) {
    console.error('✗ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

testAssignment().catch(console.error);
