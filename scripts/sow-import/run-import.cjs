#!/usr/bin/env node
const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

// PostgreSQL connection using pg library
const pgConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

async function fastBatchImport(projectId, polesFile) {
  console.log('\n🚀 FAST BATCH SOW IMPORT (Using Proven Method from GitHub)');
  console.log('=' .repeat(60));
  console.log(`Project: ${projectId}`);
  console.log(`Poles: ${path.basename(polesFile)}`);
  console.log('=' .repeat(60) + '\n');

  const client = new Client(pgConfig);
  
  try {
    await client.connect();
    console.log('✓ Connected to Neon Database\n');
    
    // Clear existing data for fresh import
    console.log('Clearing existing data for project...');
    await client.query(`DELETE FROM sow_poles WHERE project_id = $1`, [projectId]);
    console.log('✓ Cleared existing poles\n');
    
    // IMPORT POLES WITH BATCH INSERT
    console.log('📍 IMPORTING POLES (Batch Mode)...');
    const polesWB = XLSX.readFile(polesFile);
    const polesData = XLSX.utils.sheet_to_json(polesWB.Sheets[polesWB.SheetNames[0]]);
    
    console.log(`Total records in Excel: ${polesData.length}`);
    
    const BATCH_SIZE = 1000;
    let polesImported = 0;
    let skipped = 0;
    const startTime = Date.now();
    
    // Process poles in batches
    for (let i = 0; i < polesData.length; i += BATCH_SIZE) {
      const batch = polesData.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      
      let valueIndex = 1;
      batch.forEach((row, rowIndex) => {
        // Try different column names for pole number
        const poleNumber = row.label_1 || row.Label_1 || row.pole_number || row['Pole Number'] || '';
        if (!poleNumber) {
          skipped++;
          return;
        }
        
        // Build placeholders for this row (18 columns)
        const rowPlaceholders = [];
        for (let j = 0; j < 18; j++) {
          rowPlaceholders.push(`$${valueIndex++}`);
        }
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
        
        // Add values - matching the exact columns from sow_poles table
        values.push(
          projectId,                                    // project_id
          poleNumber,                                   // pole_number
          parseFloat(row.lat || row.Lat || row.latitude) || null,     // latitude
          parseFloat(row.lon || row.Lon || row.longitude) || null,    // longitude
          row.status || row.Status || 'pending',       // status
          row.pole_type || null,                       // pole_type
          row.pole_spec || null,                       // pole_spec
          parseFloat(row.height) || null,              // height
          parseFloat(row.diameter) || null,            // diameter
          row.owner || row.cmpownr || null,           // owner
          row.pon_no || row['PON No'] || null,        // pon_no
          row.zone_no || row['Zone No'] || null,      // zone_no
          row.address || null,                        // address
          row.municipality || null,                   // municipality
          row.created_date || row.datecrtd ? new Date(row.created_date || row.datecrtd) : null,  // created_date
          row.created_by || row.cmpownr || null,      // created_by
          row.comments || null,                       // comments
          JSON.stringify(row)                         // raw_data (store entire row as JSON)
        );
      });
      
      if (placeholders.length > 0) {
        const query = `
          INSERT INTO sow_poles (
            project_id, pole_number, latitude, longitude, status,
            pole_type, pole_spec, height, diameter, owner,
            pon_no, zone_no, address, municipality,
            created_date, created_by, comments, raw_data
          ) VALUES ${placeholders.join(', ')}
          ON CONFLICT (project_id, pole_number) DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            status = EXCLUDED.status,
            pole_type = EXCLUDED.pole_type,
            pole_spec = EXCLUDED.pole_spec,
            height = EXCLUDED.height,
            diameter = EXCLUDED.diameter,
            owner = EXCLUDED.owner,
            pon_no = EXCLUDED.pon_no,
            zone_no = EXCLUDED.zone_no,
            address = EXCLUDED.address,
            municipality = EXCLUDED.municipality,
            created_date = EXCLUDED.created_date,
            created_by = EXCLUDED.created_by,
            comments = EXCLUDED.comments,
            raw_data = EXCLUDED.raw_data,
            updated_at = NOW()
        `;
        
        try {
          const result = await client.query(query, values);
          polesImported += result.rowCount;
          
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = Math.round(polesImported / elapsed);
          console.log(`✅ Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${polesImported} poles imported (${rate}/sec)`);
        } catch (batchError) {
          console.error(`❌ Error in batch starting at ${i}:`, batchError.message);
        }
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '=' .repeat(60));
    console.log('✅ IMPORT COMPLETE');
    console.log(`   Imported: ${polesImported} poles`);
    console.log(`   Skipped: ${skipped} records (no pole number)`);
    console.log(`   Time: ${totalTime} seconds`);
    console.log(`   Rate: ${Math.round(polesImported / totalTime)} poles/sec`);
    
    // Verify final count
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM sow_poles WHERE project_id = $1',
      [projectId]
    );
    console.log(`\n📊 Final verification: ${countResult.rows[0].count} poles in database`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Run the import
const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15
const polesFile = '/home/louisdup/Downloads/Lawley Poles.xlsx';

console.log('Starting import with:');
console.log('Project ID:', projectId);
console.log('Poles file:', polesFile);

fastBatchImport(projectId, polesFile).catch(console.error);