#!/usr/bin/env node

/**
 * Simple OneMap Import - Direct to onemap_properties table
 */

require('dotenv').config({ path: '/home/louisdup/VF/Apps/FF_React/.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

const PROJECT_ID = 'e2a61399-275a-4c44-8008-e9e42b7a3501';
const FILE_PATH = '/home/louisdup/Downloads/Lawley_12092025.xlsx';

async function main() {
  console.log('📊 Simple OneMap Import');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Read Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Found ${data.length} records\n`);

    // Import in batches
    console.log('Importing to onemap_properties...');
    let imported = 0;
    let errors = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        try {
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
              pole_lat,
              pole_lng,
              drop_cable_length,
              pole_permission_date,
              home_signup_date,
              installation_date,
              created_at
            ) VALUES (
              ${row['Property ID']},
              ${row['1map NAD ID'] || null},
              ${row['Status']},
              ${row['Location Address']},
              ${parseFloat(row['Latitude']) || null},
              ${parseFloat(row['Longitude']) || null},
              ${row['Pole Number']},
              ${row['Drop Number']},
              ${row['Contact Person: Name']},
              ${row['Contact Person: Surname']},
              ${row['Contact Number (e.g.0123456789)']},
              ${parseFloat(row['Pole Permissions - Actual Device Location (Latitude)']) || null},
              ${parseFloat(row['Pole Permissions - Actual Device Location (Longitude)']) || null},
              ${parseFloat(row['Length of Drop Cable']) || null},
              ${row['Date of Signature'] ? new Date(row['Date of Signature']) : null},
              ${row['Survey Date'] ? new Date(row['Survey Date']) : null},
              ${row['Home Installations - Last Modified Home Installations Date'] ?
                new Date(row['Home Installations - Last Modified Home Installations Date']) : null},
              CURRENT_TIMESTAMP
            )
          `;
          imported++;
        } catch (err) {
          if (!err.message.includes('duplicate')) {
            console.error(`Error: ${err.message.slice(0, 100)}`);
            errors++;
          }
        }
      }

      console.log(`Progress: ${imported}/${data.length} imported (${errors} errors)`);
    }

    // Check results
    const count = await sql`SELECT COUNT(*) as count FROM onemap_properties`;
    console.log(`\n✅ Import complete: ${count[0].count} total records in database`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();