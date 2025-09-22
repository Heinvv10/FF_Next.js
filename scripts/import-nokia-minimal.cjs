const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BATCH_SIZE = 2000; // Even larger batch

async function importNokiaMinimal() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
    const homeDir = require('os').homedir();
    const filePath = path.join(homeDir, 'Downloads', 'Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx');

    console.log('Reading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets['1Map Field App'];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    console.log(`Processing ${data.length} records\n`);

    // Clear and recreate table for speed
    await client.query('BEGIN');

    // Drop and recreate for clean slate
    await client.query('DROP TABLE IF EXISTS nokia_velocity_temp');
    await client.query(`
      CREATE TABLE nokia_velocity_temp (
        project_id UUID,
        property_id VARCHAR(255),
        pole_number VARCHAR(255),
        drop_number VARCHAR(255),
        status VARCHAR(500),
        ont_barcode VARCHAR(255)
      )
    `);

    // Process all data in large batches
    let totalProcessed = 0;
    const startTime = Date.now();

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, Math.min(i + BATCH_SIZE, data.length));

      // Build values array
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const row of batch) {
        values.push(
          projectId,
          row['Property Wired Property ID'] || null,
          row['New Pole Field'] || null,
          row['Drop Number'] || null,
          row['StrappingConsentStatus'] || null,
          row['Drop_Cable_ONT_Barcode'] || null
        );

        placeholders.push(`($${paramIndex},$${paramIndex+1},$${paramIndex+2},$${paramIndex+3},$${paramIndex+4},$${paramIndex+5})`);
        paramIndex += 6;
      }

      // Simple INSERT without any constraints
      const query = `
        INSERT INTO nokia_velocity_temp VALUES ${placeholders.join(',')}
      `;

      await client.query(query, values);
      totalProcessed += batch.length;

      const elapsed = (Date.now() - startTime) / 1000;
      const speed = Math.round(totalProcessed / elapsed);
      console.log(`Progress: ${totalProcessed}/${data.length} (${Math.round(totalProcessed/data.length*100)}%) - ${speed} rec/sec`);
    }

    // Now move to final table
    console.log('\nMoving to final table...');

    // Clear old data
    await client.query('DELETE FROM nokia_velocity WHERE project_id = $1', [projectId]);

    // Insert from temp table
    await client.query(`
      INSERT INTO nokia_velocity (project_id, property_id, pole_number, drop_number, status, ont_barcode, week_ending)
      SELECT project_id, property_id, pole_number, drop_number, status, ont_barcode, '2025-09-15'::date
      FROM nokia_velocity_temp
    `);

    await client.query('DROP TABLE nokia_velocity_temp');
    await client.query('COMMIT');

    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n' + '='.repeat(60));
    console.log(`COMPLETED: ${totalProcessed} records in ${totalTime.toFixed(1)}s`);
    console.log(`Speed: ${Math.round(totalProcessed/totalTime)} records/second`);

    // Verify
    const result = await client.query(
      'SELECT COUNT(*) as cnt FROM nokia_velocity WHERE project_id = $1',
      [projectId]
    );
    console.log(`Verified: ${result.rows[0].cnt} records in database`);

  } catch (error) {
    console.error('Error:', error.message);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

console.log('Nokia Minimal Import - Maximum Speed');
console.log('-'.repeat(60));
importNokiaMinimal();