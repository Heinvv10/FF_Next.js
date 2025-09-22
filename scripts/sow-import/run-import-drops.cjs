const { Client } = require('pg');
const XLSX = require('xlsx');
require('dotenv').config();

const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15
const DROPS_FILE = '/home/louisdup/Downloads/Lawley Drops.xlsx';
const BATCH_SIZE = 1000;

async function importDrops() {
  console.log('🚀 DROPS IMPORT (Using Same Proven Method)');
  console.log('============================================================');
  console.log('Project:', PROJECT_ID);
  console.log('Drops file:', DROPS_FILE);
  console.log('============================================================\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('✓ Connected to Neon Database\n');
  
  // Read Excel file
  const workbook = XLSX.readFile(DROPS_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const drops = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`📊 Total records in Excel: ${drops.length}`);
  
  // Clear existing drops for this project
  console.log('\nClearing existing drops for project...');
  await client.query('DELETE FROM sow_drops WHERE project_id = $1', [PROJECT_ID]);
  console.log('✓ Cleared existing drops\n');
  
  console.log('💧 IMPORTING DROPS (Batch Mode)...');
  
  const startTime = Date.now();
  let totalInserted = 0;
  let skipped = 0;
  
  // Process in batches
  for (let i = 0; i < drops.length; i += BATCH_SIZE) {
    const batch = drops.slice(i, i + BATCH_SIZE);
    const batchStart = Date.now();
    
    // Build multi-value INSERT
    const values = [];
    const placeholders = [];
    let valueIndex = 1;
    
    batch.forEach((drop, rowIndex) => {
      // Map Excel columns to database fields
      const dropNumber = drop.label || drop.drop_number || drop['Drop Number'];
      const poleNumber = drop.strtfeat || drop.pole_number || drop['Pole Number'];
      
      if (!dropNumber) {
        skipped++;
        return;
      }
      
      // Build placeholders for this row (19 columns)
      const rowPlaceholders = [];
      for (let j = 0; j < 19; j++) {
        rowPlaceholders.push(`$${valueIndex++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
      
      // Add values
      values.push(
        PROJECT_ID,                                          // project_id
        dropNumber,                                          // drop_number
        poleNumber || null,                                  // pole_number
        drop.type || null,                                  // cable_type
        drop.spec || null,                                  // cable_spec
        parseFloat(drop.dim2) || null,                      // cable_length
        drop.cblcpty || null,                               // cable_capacity
        drop.strtfeat || null,                              // start_point
        drop.endfeat || null,                               // end_point
        null,                                                // latitude
        null,                                                // longitude
        drop.endfeat || null,                               // address
        parseInt(drop.pon_no) || null,                      // pon_no
        parseInt(drop.zone_no) || null,                     // zone_no
        drop.mun || null,                                   // municipality
        drop.status || 'planned',                           // status
        drop.datecrtd ? new Date(drop.datecrtd) : null,    // created_date
        drop.crtdby || null,                               // created_by
        JSON.stringify(drop)                               // raw_data
      );
    });
    
    if (placeholders.length > 0) {
      const query = `
        INSERT INTO sow_drops (
          project_id, drop_number, pole_number, cable_type, cable_spec,
          cable_length, cable_capacity, start_point, end_point,
          latitude, longitude, address, pon_no, zone_no,
          municipality, status, created_date, created_by, raw_data
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (project_id, drop_number) DO UPDATE SET
          pole_number = EXCLUDED.pole_number,
          cable_type = EXCLUDED.cable_type,
          cable_spec = EXCLUDED.cable_spec,
          cable_length = EXCLUDED.cable_length,
          cable_capacity = EXCLUDED.cable_capacity,
          start_point = EXCLUDED.start_point,
          end_point = EXCLUDED.end_point,
          address = EXCLUDED.address,
          status = EXCLUDED.status,
          updated_at = NOW()
        RETURNING id, drop_number
      `;
      
      const result = await client.query(query, values);
      totalInserted += result.rows.length;
      
      const batchTime = ((Date.now() - batchStart) / 1000).toFixed(2);
      const rate = Math.round(result.rows.length / parseFloat(batchTime));
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${totalInserted} drops imported (${rate}/sec)`);
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgRate = Math.round(totalInserted / parseFloat(totalTime));
  
  // Verify final count
  const countResult = await client.query(
    'SELECT COUNT(*) FROM sow_drops WHERE project_id = $1',
    [PROJECT_ID]
  );
  
  console.log('\n============================================================');
  console.log('✅ IMPORT COMPLETE');
  console.log(`   Imported: ${totalInserted} drops`);
  console.log(`   Skipped: ${skipped} records (no drop number)`);
  console.log(`   Time: ${totalTime} seconds`);
  console.log(`   Rate: ${avgRate} drops/sec`);
  console.log(`\n📊 Final verification: ${countResult.rows[0].count} drops in database`);
  
  await client.end();
}

importDrops().catch(console.error);