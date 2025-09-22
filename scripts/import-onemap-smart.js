#!/usr/bin/env node

/**
 * Smart OneMap Import Script
 * Links OneMap field data with existing SOW data without duplicating
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

const sql = neon(process.env.DATABASE_URL);

// Project configuration
const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15
const FILE_PATH = '/home/louisdup/Downloads/Lawley_12092025.xlsx';

async function main() {
  console.log('🔍 Smart OneMap Import - Linking field data with SOW planning data');
  console.log(`📁 File: ${path.basename(FILE_PATH)}`);
  console.log(`🏗️ Project: louissep15`);
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Parse the OneMap file
    console.log('📊 Reading OneMap export file...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`✅ Found ${data.length} records\n`);

    // 2. Check existing data
    console.log('🔍 Checking existing data...');

    // Get existing pole numbers from SOW
    const existingPoles = await sql`
      SELECT pole_number, id
      FROM sow_poles
      WHERE project_id = ${PROJECT_ID}
    `;
    const poleMap = new Map(existingPoles.map(p => [p.pole_number, p.id]));
    console.log(`  SOW Poles: ${poleMap.size} poles`);

    // Get existing drops from SOW
    const existingDrops = await sql`
      SELECT drop_number, id, pole_number
      FROM sow_drops
      WHERE project_id = ${PROJECT_ID}
    `;
    const dropMap = new Map(existingDrops.map(d => [d.drop_number, d]));
    console.log(`  SOW Drops: ${dropMap.size} drops`);

    // Check what's already in OneMap tables
    const existingOneMapCount = await sql`
      SELECT COUNT(*) as count
      FROM onemap_imports
      WHERE project_id = ${PROJECT_ID}
    `;
    console.log(`  OneMap imports: ${existingOneMapCount[0].count} existing records\n`);

    // 3. Process OneMap data
    console.log('🔄 Processing OneMap data...');

    const stats = {
      polesLinked: 0,
      polesNew: 0,
      dropsLinked: 0,
      dropsNew: 0,
      statusUpdates: 0,
      skipped: 0
    };

    const batch = [];
    const statusUpdates = [];

    for (const row of data) {
      const poleNumber = row['Pole Number'];
      const dropNumber = row['Drop Number'];
      const status = row['Status'];
      const lat = parseFloat(row['Latitude']) || null;
      const lng = parseFloat(row['Longitude']) || null;
      const propertyId = row['Property ID'];
      const onemapId = row['1map NAD ID'];

      // Skip invalid records
      if (!poleNumber && !dropNumber) {
        stats.skipped++;
        continue;
      }

      // Prepare record for import
      const importRecord = {
        project_id: PROJECT_ID,
        onemap_id: onemapId,
        property_id: propertyId,
        pole_number: poleNumber,
        drop_number: dropNumber,
        status: status,
        latitude: lat,
        longitude: lng,
        location_address: row['Location Address'],
        contact_name: row['Contact Person: Name'],
        contact_surname: row['Contact Person: Surname'],
        contact_number: row['Contact Number (e.g.0123456789)'],
        field_agent: row['Field Agent Name (pole permission)'] || row['Field Agent Name (Home Sign Ups)'],
        survey_date: row['Survey Date'],
        last_modified_by: row['lst_mod_by'],
        last_modified_date: row['lst_mod_dt'],
        raw_data: JSON.stringify(row),
        sow_pole_id: null,
        sow_drop_id: null,
        linked: false
      };

      // Link to existing SOW data
      if (poleNumber && poleMap.has(poleNumber)) {
        importRecord.sow_pole_id = poleMap.get(poleNumber);
        importRecord.linked = true;
        stats.polesLinked++;

        // Prepare status update for SOW table
        if (status && status.includes('Approved')) {
          statusUpdates.push({
            pole_number: poleNumber,
            status: 'field_verified',
            lat: lat,
            lng: lng
          });
        }
      } else if (poleNumber) {
        stats.polesNew++;
      }

      if (dropNumber && dropMap.has(dropNumber)) {
        const drop = dropMap.get(dropNumber);
        importRecord.sow_drop_id = drop.id;
        importRecord.linked = true;
        stats.dropsLinked++;
      } else if (dropNumber) {
        stats.dropsNew++;
      }

      batch.push(importRecord);
    }

    console.log(`\n📊 Data Analysis:`);
    console.log(`  Poles linked to SOW: ${stats.polesLinked}`);
    console.log(`  New poles (not in SOW): ${stats.polesNew}`);
    console.log(`  Drops linked to SOW: ${stats.dropsLinked}`);
    console.log(`  New drops (not in SOW): ${stats.dropsNew}`);
    console.log(`  Records to import: ${batch.length}`);
    console.log(`  Skipped (invalid): ${stats.skipped}\n`);

    // 4. Insert into OneMap import table
    if (batch.length > 0) {
      console.log('💾 Importing to database...');

      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS onemap_imports (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          project_id uuid NOT NULL,
          onemap_id varchar(100),
          property_id varchar(100),
          pole_number varchar(50),
          drop_number varchar(50),
          status varchar(200),
          latitude numeric,
          longitude numeric,
          location_address text,
          contact_name varchar(100),
          contact_surname varchar(100),
          contact_number varchar(50),
          field_agent varchar(100),
          survey_date timestamp,
          last_modified_by varchar(100),
          last_modified_date timestamp,
          raw_data jsonb,
          sow_pole_id uuid,
          sow_drop_id uuid,
          linked boolean DEFAULT false,
          created_at timestamp DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, onemap_id)
        )
      `;

      // Insert in batches
      const BATCH_SIZE = 100;
      let imported = 0;

      for (let i = 0; i < batch.length; i += BATCH_SIZE) {
        const currentBatch = batch.slice(i, i + BATCH_SIZE);

        for (const record of currentBatch) {
          try {
            await sql`
              INSERT INTO onemap_imports (
                project_id, onemap_id, property_id, pole_number, drop_number,
                status, latitude, longitude, location_address,
                contact_name, contact_surname, contact_number, field_agent,
                survey_date, last_modified_by, last_modified_date,
                raw_data, sow_pole_id, sow_drop_id, linked
              ) VALUES (
                ${record.project_id}, ${record.onemap_id}, ${record.property_id},
                ${record.pole_number}, ${record.drop_number}, ${record.status},
                ${record.latitude}, ${record.longitude}, ${record.location_address},
                ${record.contact_name}, ${record.contact_surname}, ${record.contact_number},
                ${record.field_agent}, ${record.survey_date}, ${record.last_modified_by},
                ${record.last_modified_date}, ${record.raw_data}::jsonb,
                ${record.sow_pole_id}, ${record.sow_drop_id}, ${record.linked}
              )
              ON CONFLICT (project_id, onemap_id)
              DO UPDATE SET
                status = EXCLUDED.status,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                last_modified_date = EXCLUDED.last_modified_date,
                updated_at = CURRENT_TIMESTAMP
            `;
            imported++;
          } catch (err) {
            // Skip duplicates silently
            if (!err.message.includes('duplicate')) {
              console.error(`Error importing record:`, err.message);
            }
          }
        }

        console.log(`  Imported ${imported}/${batch.length} records...`);
      }

      console.log(`✅ Import complete: ${imported} records\n`);

      // 5. Update SOW tables with field verification status
      if (statusUpdates.length > 0) {
        console.log('🔄 Updating SOW tables with field status...');
        let updated = 0;

        for (const update of statusUpdates) {
          if (update.lat && update.lng) {
            await sql`
              UPDATE sow_poles
              SET status = 'field_verified',
                  latitude = ${update.lat},
                  longitude = ${update.lng},
                  updated_at = CURRENT_TIMESTAMP
              WHERE project_id = ${PROJECT_ID}
              AND pole_number = ${update.pole_number}
              AND status != 'field_verified'
            `;
            updated++;
          }
        }

        console.log(`✅ Updated ${updated} poles with field verification status\n`);
      }
    }

    // 6. Generate summary
    console.log('📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total OneMap records: ${data.length}`);
    console.log(`Linked to SOW data: ${stats.polesLinked + stats.dropsLinked}`);
    console.log(`New field data: ${stats.polesNew + stats.dropsNew}`);
    console.log(`\nData is now available in the grid at http://localhost:3012/sow/grid`);

    // 7. Save import log
    const logEntry = {
      timestamp: new Date().toISOString(),
      file: path.basename(FILE_PATH),
      project: PROJECT_ID,
      stats: stats,
      totalRecords: batch.length
    };

    const logPath = '/home/louisdup/VF/Apps/FF_React/imports/onemap/logs/import-log.json';
    let logs = [];
    try {
      const existing = await fs.readFile(logPath, 'utf8');
      logs = JSON.parse(existing);
    } catch (e) {
      // File doesn't exist yet
    }
    logs.push(logEntry);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    console.log(`\n📝 Import logged to ${logPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();