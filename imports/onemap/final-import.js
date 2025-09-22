#!/usr/bin/env node

/**
 * Final OneMap Import - Direct import with correct column mapping
 */

require('dotenv').config({ path: '/home/louisdup/VF/Apps/FF_React/.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);
const FILE_PATH = '/home/louisdup/Downloads/Lawley_12092025.xlsx';

async function main() {
  console.log('🚀 Final OneMap Import');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // 1. Clear existing data first
    console.log('🧹 Clearing existing OneMap data...');
    await sql`DELETE FROM onemap_properties`;

    // 2. Read Excel file
    console.log('📊 Reading Excel file...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`✅ Found ${data.length} records\n`);

    // 3. Import data
    console.log('💾 Importing to database...');
    let imported = 0;
    let skipped = 0;

    for (const row of data) {
      try {
        // Skip if no property ID
        if (!row['Property ID']) {
          skipped++;
          continue;
        }

        await sql`
          INSERT INTO onemap_properties (
            property_id,
            onemap_nad_id,
            status,
            location_address,
            latitude,
            longitude,
            pole_number,
            drop_number,
            contact_name,
            contact_surname,
            contact_number,
            created_at
          ) VALUES (
            ${row['Property ID']},
            ${row['1map NAD ID'] || null},
            ${row['Status'] || null},
            ${row['Location Address'] || null},
            ${parseFloat(row['Latitude']) || null},
            ${parseFloat(row['Longitude']) || null},
            ${row['Pole Number'] || null},
            ${row['Drop Number'] || null},
            ${row['Contact Person: Name'] || null},
            ${row['Contact Person: Surname'] || null},
            ${row['Contact Number (e.g.0123456789)'] || null},
            CURRENT_TIMESTAMP
          )
        `;
        imported++;

        if (imported % 100 === 0) {
          console.log(`  Progress: ${imported} imported...`);
        }
      } catch (err) {
        // Skip duplicates silently, log other errors
        if (err.message.includes('duplicate')) {
          skipped++;
        } else {
          console.error(`Error on row ${imported + skipped}: ${err.message.substring(0, 50)}`);
          skipped++;
        }
      }
    }

    // 4. Verify import
    const count = await sql`SELECT COUNT(*) as count FROM onemap_properties`;
    console.log('\n✅ IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Records imported: ${imported}`);
    console.log(`Records skipped: ${skipped}`);
    console.log(`Total in database: ${count[0].count}`);

    // 5. Show sample data
    const sample = await sql`
      SELECT property_id, pole_number, drop_number, status
      FROM onemap_properties
      LIMIT 5
    `;
    console.log('\n📋 Sample imported records:');
    sample.forEach(r => {
      console.log(`  Property: ${r.property_id} | Pole: ${r.pole_number} | Drop: ${r.drop_number} | Status: ${r.status}`);
    });

    console.log('\n🎉 Data is now available at http://localhost:3005/imports');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();