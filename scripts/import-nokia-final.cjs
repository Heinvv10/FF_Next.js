const { Client } = require('pg');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

async function importNokiaFinal() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
    const filePath = path.join(require('os').homedir(), 'Downloads', 'Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx');

    console.log('📁 Reading Excel file...');
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets['1Map Field App'];

    // Read raw data first to understand structure
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });

    // Find header row (row 3 has the column names)
    const headers = rawData[2]; // Row 3 (0-indexed as 2)
    const dataRows = rawData.slice(3); // Data starts from row 4

    console.log(`Found ${dataRows.length} data rows (excluding headers)\n`);
    console.log('Sample headers:', headers.slice(0, 10));

    // Map headers to indices
    const getIndex = (name) => headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));

    const colIndices = {
      propertyId: getIndex('Property ID'),
      poleNumber: getIndex('Pole Number'),
      dropNumber: getIndex('Drop Number'),
      status: getIndex('Status'),
      ontBarcode: getIndex('ONT Barcode'),
      latitude: getIndex('Latitude'),
      longitude: getIndex('Longitude'),
      installDate: getIndex('Installation Date'),
      permissionDate: getIndex('Permission Date'),
      customerName: getIndex('Customer Name'),
      standNumber: getIndex('Stand Number')
    };

    console.log('\nColumn mappings found:');
    Object.entries(colIndices).forEach(([key, idx]) => {
      if (idx >= 0) console.log(`  ${key}: column ${idx} ("${headers[idx]}")`);
    });

    // Clear existing data
    await client.query('BEGIN');
    const clearResult = await client.query('DELETE FROM nokia_velocity WHERE project_id = $1', [projectId]);
    console.log(`\nCleared ${clearResult.rowCount} existing records\n`);

    // Process in batches
    const BATCH_SIZE = 1000;
    let totalProcessed = 0;
    const startTime = Date.now();

    console.log('🚀 Starting import...\n');

    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, Math.min(i + BATCH_SIZE, dataRows.length));

      // Prepare multi-row insert
      const values = [];
      const rows = [];

      for (const row of batch) {
        // Skip empty rows
        if (!row || row.length === 0) continue;

        // Extract data using mapped indices
        const propertyId = row[colIndices.propertyId] || null;
        const poleNumber = row[colIndices.poleNumber] || null;
        const dropNumber = row[colIndices.dropNumber] || null;
        const status = row[colIndices.status] || null;
        const ontBarcode = row[colIndices.ontBarcode] || null;
        const latitude = parseFloat(row[colIndices.latitude]) || null;
        const longitude = parseFloat(row[colIndices.longitude]) || null;
        const standNumber = row[colIndices.standNumber] || null;

        // Only add rows with at least some data
        if (propertyId || poleNumber || dropNumber) {
          rows.push({
            project_id: projectId,
            property_id: propertyId,
            pole_number: poleNumber,
            drop_number: dropNumber,
            status: status,
            ont_barcode: ontBarcode,
            latitude: latitude,
            longitude: longitude,
            stand_number: standNumber,
            week_ending: new Date('2025-09-15')
          });
        }
      }

      // Build INSERT query
      if (rows.length > 0) {
        let valueIndex = 1;
        const placeholders = rows.map(r => {
          values.push(r.project_id, r.property_id, r.pole_number, r.drop_number,
                     r.status, r.ont_barcode, r.latitude, r.longitude,
                     r.stand_number, r.week_ending);
          const ph = `($${valueIndex},$${valueIndex+1},$${valueIndex+2},$${valueIndex+3},$${valueIndex+4},$${valueIndex+5},$${valueIndex+6},$${valueIndex+7},$${valueIndex+8},$${valueIndex+9})`;
          valueIndex += 10;
          return ph;
        });

        const insertQuery = `
          INSERT INTO nokia_velocity (
            project_id, property_id, pole_number, drop_number,
            status, ont_barcode, latitude, longitude, stand_number, week_ending
          ) VALUES ${placeholders.join(',')}
        `;

        await client.query(insertQuery, values);
        totalProcessed += rows.length;

        // Progress update
        const progress = Math.round((totalProcessed / dataRows.length) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = Math.round(totalProcessed / elapsed);

        process.stdout.write(`\r  Progress: ${progress}% | Records: ${totalProcessed}/${dataRows.length} | Speed: ${speed} rec/sec`);
      }
    }

    await client.query('COMMIT');
    console.log('\n\n✅ Import completed!\n');

    // Verify import and linking
    console.log('📊 VERIFICATION:');
    console.log('-'.repeat(60));

    const stats = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT property_id) as properties,
        COUNT(DISTINCT pole_number) as poles,
        COUNT(DISTINCT drop_number) as drops,
        COUNT(ont_barcode) as with_ont
      FROM nokia_velocity
      WHERE project_id = $1
    `, [projectId]);

    const s = stats.rows[0];
    console.log(`Total Records: ${s.total}`);
    console.log(`Properties: ${s.properties}`);
    console.log(`Poles: ${s.poles}`);
    console.log(`Drops: ${s.drops}`);
    console.log(`With ONT: ${s.with_ont}`);

    // Check linking
    console.log('\n🔗 LINKING CHECK:');
    console.log('-'.repeat(60));

    const linking = await client.query(`
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

    const l = linking.rows[0];
    const dropRate = l.nokia_drops > 0 ? ((l.linked_drops / l.nokia_drops) * 100).toFixed(1) : 0;
    const poleRate = l.nokia_poles > 0 ? ((l.linked_poles / l.nokia_poles) * 100).toFixed(1) : 0;

    console.log(`Drops: ${l.linked_drops} of ${l.nokia_drops} linked (${dropRate}%)`);
    console.log(`Poles: ${l.linked_poles} of ${l.nokia_poles} linked (${poleRate}%)`);

    // Sample data
    console.log('\n📋 SAMPLE RECORDS WITH DATA:');
    console.log('-'.repeat(60));

    const samples = await client.query(`
      SELECT property_id, pole_number, drop_number, status, ont_barcode
      FROM nokia_velocity
      WHERE project_id = $1
        AND (pole_number IS NOT NULL OR drop_number IS NOT NULL)
      LIMIT 5
    `, [projectId]);

    samples.rows.forEach((s, i) => {
      console.log(`${i+1}. Property: ${s.property_id || 'None'}`);
      console.log(`   Pole: ${s.pole_number || 'None'}, Drop: ${s.drop_number || 'None'}`);
      console.log(`   Status: ${s.status || 'N/A'}`);
      if (s.ont_barcode) console.log(`   ONT: ${s.ont_barcode}`);
    });

    const totalTime = (Date.now() - startTime) / 1000;
    console.log('\n' + '='.repeat(60));
    console.log(`COMPLETED in ${totalTime.toFixed(1)}s (${Math.round(totalProcessed/totalTime)} rec/sec)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

console.log('NOKIA FINAL DATA IMPORT - WITH CORRECT HEADERS');
console.log('='.repeat(60));
console.log('Project: louissep15');
console.log('Processing 1Map Field App tab (row 3 has headers, data starts row 4)\n');

importNokiaFinal();