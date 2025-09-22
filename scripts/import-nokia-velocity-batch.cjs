const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BATCH_SIZE = 500; // Proven batch size from SOW imports

async function importNokiaVelocityBatch() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database via pg client');

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
    const homeDir = require('os').homedir();
    const filePath = path.join(homeDir, 'Downloads', 'Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx');

    if (!fs.existsSync(filePath)) {
      console.error('Excel file not found at:', filePath);
      return;
    }

    console.log('Reading Excel file:', filePath);
    const workbook = xlsx.readFile(filePath);

    // ONLY process the first tab (1Map Field App) - other tabs are SOW data already imported
    const sheetName = '1Map Field App';

    if (!workbook.SheetNames.includes(sheetName)) {
      console.error(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
      return;
    }

    console.log('Processing ONLY the 1Map Field App tab (installation progress data)');
    console.log('Other tabs contain SOW data that is already imported\n');

    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    console.log(`Found ${data.length} rows in 1Map Field App sheet`);

    // First, check existing table structure and add missing columns if needed
    await client.query(`
      CREATE TABLE IF NOT EXISTS nokia_velocity (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL,
        property_id VARCHAR(255),
        pole_number VARCHAR(255),
        drop_number VARCHAR(255),
        status VARCHAR(500),
        ont_barcode VARCHAR(255),
        installation_date DATE,
        pole_permission_date DATE,
        latitude NUMERIC(10,8),
        longitude NUMERIC(11,8),
        week_ending DATE,
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        raw_data JSONB,
        UNIQUE(project_id, property_id, week_ending)
      )
    `);

    // Add missing columns if they don't exist
    await client.query(`
      ALTER TABLE nokia_velocity
      ADD COLUMN IF NOT EXISTS customer_address TEXT,
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)
    `).catch(() => {
      console.log('Columns might already exist or table structure is fine');
    });

    // Clear existing data for clean import
    const clearResult = await client.query(`
      DELETE FROM nokia_velocity WHERE project_id = $1
    `, [projectId]);
    console.log(`Cleared ${clearResult.rowCount} existing records for fresh import\n`);

    // Process in batches
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const startTime = Date.now();

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, Math.min(i + BATCH_SIZE, data.length));
      const batchStart = Date.now();

      // Prepare batch values
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const row of batch) {
        // Map columns - focusing on drops that are already done
        const propertyId = row['Property Wired Property ID'] || row['Property ID'] || null;
        const poleNumber = row['New Pole Field'] || row['Pole Number'] || null;
        const dropNumber = row['Drop Number'] || row['Drop Cable'] || null;
        const status = row['StrappingConsentStatus'] || row['Status'] || null;
        const ontBarcode = row['Drop_Cable_ONT_Barcode'] || null;

        // Handle Excel date conversion
        const installDate = row['Drop_Cable_Installation_Date'] ?
          excelDateToJS(row['Drop_Cable_Installation_Date']) : null;
        const permissionDate = row['PoleColdBuildPolePolePermissionsRequestDate'] ?
          excelDateToJS(row['PoleColdBuildPolePolePermissionsRequestDate']) : null;

        const latitude = parseFloat(row['pole_cold_build_pole_latitude']) || null;
        const longitude = parseFloat(row['pole_cold_build_pole_longitude']) || null;
        const customerAddress = row['Customer Street Address'] || null;
        const customerName = row['CustomerBusinessName'] || null;
        const customerPhone = row['Customer Telephone Number'] || null;
        const weekEnding = new Date('2025-09-15');

        values.push(
          projectId,
          propertyId,
          poleNumber,
          dropNumber,
          status,
          ontBarcode,
          installDate,
          permissionDate,
          latitude,
          longitude,
          customerAddress,
          customerName,
          customerPhone,
          weekEnding,
          JSON.stringify(row)
        );

        placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12}, $${paramIndex+13}, $${paramIndex+14})`);
        paramIndex += 15;
      }

      // Execute batch insert with ON CONFLICT
      if (placeholders.length > 0) {
        try {
          const query = `
            INSERT INTO nokia_velocity (
              project_id, property_id, pole_number, drop_number, status,
              ont_barcode, installation_date, pole_permission_date,
              latitude, longitude, customer_address, customer_name, customer_phone,
              week_ending, raw_data
            ) VALUES ${placeholders.join(', ')}
            ON CONFLICT (project_id, property_id, week_ending)
            DO UPDATE SET
              pole_number = EXCLUDED.pole_number,
              drop_number = EXCLUDED.drop_number,
              status = EXCLUDED.status,
              ont_barcode = EXCLUDED.ont_barcode,
              installation_date = EXCLUDED.installation_date,
              pole_permission_date = EXCLUDED.pole_permission_date,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              customer_address = EXCLUDED.customer_address,
              customer_name = EXCLUDED.customer_name,
              customer_phone = EXCLUDED.customer_phone,
              raw_data = EXCLUDED.raw_data,
              import_date = CURRENT_TIMESTAMP
            RETURNING (xmax = 0) as inserted
          `;

          const result = await client.query(query, values);
          const inserted = result.rows.filter(r => r.inserted).length;
          const updated = result.rows.length - inserted;

          totalInserted += inserted;
          totalUpdated += updated;
          totalProcessed += batch.length;

          const batchTime = Date.now() - batchStart;
          const recordsPerSecond = Math.round((batch.length / batchTime) * 1000);

          console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: Processed ${batch.length} records (${inserted} new, ${updated} updated) at ${recordsPerSecond} records/sec`);
        } catch (err) {
          console.error(`Error in batch ${Math.floor(i/BATCH_SIZE) + 1}:`, err.message);
          totalErrors += batch.length;
        }
      }

      // Progress update every 5 batches
      if ((i + BATCH_SIZE) % (BATCH_SIZE * 5) === 0 || i + BATCH_SIZE >= data.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        const avgSpeed = Math.round(totalProcessed / elapsed);
        console.log(`\nProgress: ${totalProcessed}/${data.length} records (${Math.round(totalProcessed/data.length*100)}%) at avg ${avgSpeed} records/sec`);
      }
    }

    // Final statistics
    const totalTime = (Date.now() - startTime) / 1000;
    const avgSpeed = Math.round(totalProcessed / totalTime);

    console.log('\n' + '='.repeat(80));
    console.log('NOKIA VELOCITY BATCH IMPORT COMPLETED');
    console.log('='.repeat(80));
    console.log(`Total Records Processed: ${totalProcessed}`);
    console.log(`New Records Inserted: ${totalInserted}`);
    console.log(`Records Updated: ${totalUpdated}`);
    console.log(`Errors: ${totalErrors}`);
    console.log(`Total Time: ${totalTime.toFixed(2)} seconds`);
    console.log(`Average Speed: ${avgSpeed} records/second`);
    console.log('='.repeat(80));

    // Verify final count
    const countResult = await client.query(`
      SELECT COUNT(*) as total FROM nokia_velocity
      WHERE project_id = $1
    `, [projectId]);

    console.log(`\nDatabase Verification: ${countResult.rows[0].total} total Nokia records for project`);

    // Quick linking check
    console.log('\n📊 QUICK LINKING CHECK:');
    console.log('-'.repeat(40));

    const linkingCheck = await client.query(`
      SELECT
        COUNT(DISTINCT nv.drop_number) as nokia_drops,
        COUNT(DISTINCT CASE WHEN sd.drop_number IS NOT NULL THEN nv.drop_number END) as linked_drops,
        COUNT(DISTINCT nv.pole_number) as nokia_poles,
        COUNT(DISTINCT CASE WHEN sp.pole_number IS NOT NULL THEN nv.pole_number END) as linked_poles
      FROM nokia_velocity nv
      LEFT JOIN sow_drops sd ON nv.drop_number = sd.drop_number
        AND sd.project_id = $1
      LEFT JOIN sow_poles sp ON nv.pole_number = sp.pole_number
        AND sp.project_id = $1
      WHERE nv.project_id = $1
        AND (nv.drop_number IS NOT NULL OR nv.pole_number IS NOT NULL)
    `, [projectId]);

    const links = linkingCheck.rows[0];
    const dropLinkRate = links.nokia_drops > 0 ?
      ((links.linked_drops / links.nokia_drops) * 100).toFixed(1) : 0;
    const poleLinkRate = links.nokia_poles > 0 ?
      ((links.linked_poles / links.nokia_poles) * 100).toFixed(1) : 0;

    console.log(`Drops: ${links.linked_drops} of ${links.nokia_drops} linked (${dropLinkRate}%)`);
    console.log(`Poles: ${links.linked_poles} of ${links.nokia_poles} linked (${poleLinkRate}%)`);
    console.log('\nNote: This data shows installation progress - drops already completed');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Excel date conversion helper
function excelDateToJS(excelDate) {
  if (!excelDate) return null;
  const numericDate = parseFloat(excelDate);
  if (isNaN(numericDate)) {
    const date = new Date(excelDate);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date((numericDate - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}

// Run import
console.log('Starting Nokia Velocity batch import using pg client...');
console.log('Project: louissep15');
console.log('Batch size:', BATCH_SIZE);
console.log('NOTE: Processing ONLY 1Map Field App tab (installation/drops progress)');
console.log('      Other tabs contain SOW planning data already imported');
console.log('-'.repeat(80));

importNokiaVelocityBatch();