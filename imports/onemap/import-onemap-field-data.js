#!/usr/bin/env node

/**
 * OneMap Field Data Import
 * Imports OneMap field app data and links it with existing SOW planning data
 */

require('dotenv').config({ path: '/home/louisdup/VF/Apps/FF_React/.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

// Configuration
const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15
const FILE_PATH = '/home/louisdup/Downloads/Lawley_12092025.xlsx';

async function main() {
  console.log('🔍 OneMap Field Data Import');
  console.log(`📁 File: ${path.basename(FILE_PATH)}`);
  console.log(`🏗️ Project: louissep15`);
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Parse the OneMap file
    console.log('📊 Reading OneMap field data export...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`✅ Found ${data.length} field records\n`);

    // 2. Create import job
    const importResult = await sql`
      INSERT INTO onemap_imports (filename, file_size, status, imported_by, created_at)
      VALUES (${path.basename(FILE_PATH)}, ${data.length}, 'processing', 'import-script', CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const importId = importResult[0].id;
    console.log(`📝 Created import job #${importId}\n`);

    // 3. Get existing SOW data for linking
    console.log('🔍 Loading SOW data for linking...');
    const sowPoles = await sql`
      SELECT pole_number, id FROM sow_poles WHERE project_id = ${PROJECT_ID}
    `;
    const sowPoleMap = new Map(sowPoles.map(p => [p.pole_number, p.id]));
    console.log(`  Found ${sowPoleMap.size} SOW poles`);

    const sowDrops = await sql`
      SELECT drop_number, id, pole_number FROM sow_drops WHERE project_id = ${PROJECT_ID}
    `;
    const sowDropMap = new Map(sowDrops.map(d => [d.drop_number, d]));
    console.log(`  Found ${sowDropMap.size} SOW drops\n`);

    // 4. Process and import data
    console.log('🔄 Processing field data...');

    const stats = {
      properties: 0,
      poles: 0,
      drops: 0,
      installations: 0,
      polesLinked: 0,
      dropsLinked: 0,
      errors: 0
    };

    // Group records by Property ID
    const propertiesMap = new Map();

    for (const row of data) {
      const propertyId = row['Property ID'];
      const onemapId = row['1map NAD ID'];

      if (!propertyId) {
        stats.errors++;
        continue;
      }

      if (!propertiesMap.has(propertyId)) {
        propertiesMap.set(propertyId, {
          propertyId,
          onemapId,
          records: []
        });
      }

      propertiesMap.get(propertyId).records.push(row);
    }

    console.log(`  Grouped into ${propertiesMap.size} properties\n`);

    // 5. Import to OneMap tables
    console.log('💾 Importing to OneMap tables...');

    for (const [propertyId, property] of propertiesMap) {
      const firstRecord = property.records[0];

      try {
        // Insert into onemap_properties
        const propResult = await sql`
          INSERT INTO onemap_properties (
            id, import_id, onemap_nad_id, property_id, location_address,
            latitude, longitude,
            pole_lat, pole_lon,
            contact_name, contact_surname, contact_number,
            drop_number, pole_number,
            status, site, sections, pons,
            pole_permission_date, home_signup_date, installation_date, sales_date,
            drop_cable_length,
            raw_data
          ) VALUES (
            ${propertyId},
            ${importId},
            ${firstRecord['1map NAD ID']},
            ${propertyId},
            ${firstRecord['Location Address']},
            ${parseFloat(firstRecord['Latitude']) || null},
            ${parseFloat(firstRecord['Longitude']) || null},
            ${parseFloat(firstRecord['Pole Permissions - Actual Device Location (Latitude)']) || null},
            ${parseFloat(firstRecord['Pole Permissions - Actual Device Location (Longitude)']) || null},
            ${firstRecord['Contact Person: Name']},
            ${firstRecord['Contact Person: Surname']},
            ${firstRecord['Contact Number (e.g.0123456789)']},
            ${firstRecord['Drop Number']},
            ${firstRecord['Pole Number']},
            ${firstRecord['Status']},
            ${firstRecord['Site']},
            ${firstRecord['Sections']},
            ${firstRecord['PONs']},
            ${firstRecord['Date of Signature'] || null},
            ${firstRecord['Survey Date'] || null},
            ${null}, -- installation date would be from different status
            ${null}, -- sales date
            ${firstRecord['Length of Drop Cable'] || null},
            ${JSON.stringify(firstRecord)}::jsonb
          )
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            raw_data = EXCLUDED.raw_data
        `;
        stats.properties++;

        // Insert pole permission if exists
        const poleNumber = firstRecord['Pole Number'];
        if (poleNumber) {
          await sql`
            INSERT INTO onemap_poles (
              property_id, import_id, pole_number, status,
              latitude, longitude,
              permission_date, agent_name
            ) VALUES (
              ${propertyId},
              ${importId},
              ${poleNumber},
              ${firstRecord['Status']},
              ${parseFloat(firstRecord['Latitude']) || null},
              ${parseFloat(firstRecord['Longitude']) || null},
              ${firstRecord['Date of Signature'] || null},
              ${firstRecord['Field Agent Name (pole permission)']}
            )
            ON CONFLICT (property_id) DO UPDATE SET
              status = EXCLUDED.status,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude
          `;
          stats.poles++;

          // Check if linked to SOW
          if (sowPoleMap.has(poleNumber)) {
            stats.polesLinked++;
          }
        }

        // Insert drop if exists
        const dropNumber = firstRecord['Drop Number'];
        if (dropNumber) {
          await sql`
            INSERT INTO onemap_drops (
              property_id, import_id, drop_number,
              pole_number, status,
              cable_length
            ) VALUES (
              ${propertyId},
              ${importId},
              ${dropNumber},
              ${poleNumber},
              ${firstRecord['Status']},
              ${firstRecord['Length of Drop Cable'] || null}
            )
            ON CONFLICT (property_id) DO UPDATE SET
              status = EXCLUDED.status,
              cable_length = EXCLUDED.cable_length
          `;
          stats.drops++;

          // Check if linked to SOW
          if (sowDropMap.has(dropNumber)) {
            stats.dropsLinked++;
          }
        }

        // Insert installation if completed
        if (firstRecord['Status']?.includes('Installed') || firstRecord['ONT Barcode']) {
          await sql`
            INSERT INTO onemap_installations (
              property_id, import_id,
              ont_serial, mini_ups_serial,
              installer_name, installation_date,
              power_reading_dome, power_reading_ont
            ) VALUES (
              ${propertyId},
              ${importId},
              ${firstRecord['ONT Barcode']},
              ${firstRecord['Mini-UPS Serial Number']},
              ${firstRecord['Installer Name']},
              ${firstRecord['Home Installations - Last Modified Home Installations Date'] || null},
              ${firstRecord['Powermeter reading (at dome)']},
              ${firstRecord['Powermeter reading (at ONT before activation)']}
            )
            ON CONFLICT (property_id) DO UPDATE SET
              ont_serial = EXCLUDED.ont_serial,
              installation_date = EXCLUDED.installation_date
          `;
          stats.installations++;
        }

      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.error(`Error importing property ${propertyId}:`, err.message);
          stats.errors++;
        }
      }
    }

    // 6. Update import job
    await sql`
      UPDATE onemap_imports
      SET status = 'completed',
          records_imported = ${stats.properties},
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ${importId}
    `;

    // 7. Summary
    console.log('\n📊 IMPORT SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total records processed: ${data.length}`);
    console.log(`Properties imported: ${stats.properties}`);
    console.log(`Pole permissions: ${stats.poles} (${stats.polesLinked} linked to SOW)`);
    console.log(`Drops recorded: ${stats.drops} (${stats.dropsLinked} linked to SOW)`);
    console.log(`Installations: ${stats.installations}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`\n✅ Import job #${importId} completed`);
    console.log(`\nData is now available in the grid at http://localhost:3012/sow/grid`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

main();