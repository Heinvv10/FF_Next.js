const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BATCH_SIZE = 1000; // Larger batch for speed

async function importNokiaFast() {
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

    console.log(`Processing ${data.length} records from 1Map Field App sheet\n`);

    // Clear existing data first
    await client.query('BEGIN');
    const clearResult = await client.query(
      'DELETE FROM nokia_velocity WHERE project_id = $1',
      [projectId]
    );
    console.log(`Cleared ${clearResult.rowCount} existing records\n`);

    // Process in batches WITHOUT ON CONFLICT for speed
    let totalProcessed = 0;
    const startTime = Date.now();

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, Math.min(i + BATCH_SIZE, data.length));
      const batchStart = Date.now();

      // Build multi-row insert
      const values = [];
      let valueIndex = 1;
      const placeholders = [];

      for (const row of batch) {
        // Only extract essential fields for speed
        values.push(
          projectId,
          row['Property Wired Property ID'] || null,
          row['New Pole Field'] || null,
          row['Drop Number'] || null,
          row['StrappingConsentStatus'] || null,
          row['Drop_Cable_ONT_Barcode'] || null,
          excelDateToJS(row['Drop_Cable_Installation_Date']),
          excelDateToJS(row['PoleColdBuildPolePolePermissionsRequestDate']),
          parseFloat(row['pole_cold_build_pole_latitude']) || null,
          parseFloat(row['pole_cold_build_pole_longitude']) || null,
          new Date('2025-09-15'),
          JSON.stringify(row)
        );

        const params = [];
        for (let j = 0; j < 12; j++) {
          params.push(`$${valueIndex++}`);
        }
        placeholders.push(`(${params.join(', ')})`);
      }

      // Execute batch insert (no ON CONFLICT for speed)
      const insertQuery = `
        INSERT INTO nokia_velocity (
          project_id, property_id, pole_number, drop_number, status,
          ont_barcode, installation_date, pole_permission_date,
          latitude, longitude, week_ending, raw_data
        ) VALUES ${placeholders.join(', ')}
      `;

      try {
        await client.query(insertQuery, values);
        totalProcessed += batch.length;

        const batchTime = Date.now() - batchStart;
        const speed = Math.round((batch.length / batchTime) * 1000);
        const progress = Math.round((totalProcessed / data.length) * 100);

        console.log(`Batch ${Math.ceil(totalProcessed/BATCH_SIZE)}: ${batch.length} records at ${speed}/sec (${progress}% complete)`);
      } catch (err) {
        console.error('Batch error:', err.message);
      }
    }

    await client.query('COMMIT');

    const totalTime = (Date.now() - startTime) / 1000;
    const avgSpeed = Math.round(totalProcessed / totalTime);

    console.log('\n' + '='.repeat(60));
    console.log('IMPORT COMPLETED');
    console.log('='.repeat(60));
    console.log(`Records Imported: ${totalProcessed}`);
    console.log(`Total Time: ${totalTime.toFixed(1)} seconds`);
    console.log(`Average Speed: ${avgSpeed} records/second`);

    // Verify
    const count = await client.query(
      'SELECT COUNT(*) as total FROM nokia_velocity WHERE project_id = $1',
      [projectId]
    );
    console.log(`\nDatabase Verification: ${count.rows[0].total} records`);

  } catch (error) {
    console.error('Fatal error:', error);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

function excelDateToJS(excelDate) {
  if (!excelDate) return null;
  const num = parseFloat(excelDate);
  if (!isNaN(num)) {
    return new Date((num - 25569) * 86400 * 1000);
  }
  const date = new Date(excelDate);
  return isNaN(date.getTime()) ? null : date;
}

console.log('Nokia Fast Import - Optimized for Speed');
console.log('-'.repeat(60));
importNokiaFast();