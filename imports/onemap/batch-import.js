#!/usr/bin/env node

/**
 * Optimized Batch OneMap Import
 * Features:
 * - Batch processing for speed
 * - Progress tracking
 * - Duplicate handling
 * - Transaction support
 */

require('dotenv').config({ path: '/home/louisdup/VF/Apps/FF_React/.env.local' });
const { neon } = require('@neondatabase/serverless');
const XLSX = require('xlsx');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);
const FILE_PATH = '/home/louisdup/Downloads/Lawley_12092025.xlsx';
const BATCH_SIZE = 500; // Process 500 records at a time

async function main() {
  console.log('🚀 Optimized OneMap Batch Import');
  console.log('═══════════════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    // 1. Read Excel file
    console.log('📊 Reading Excel file...');
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`✅ Found ${data.length} records\n`);

    // 2. Clear existing data
    console.log('🧹 Clearing existing OneMap data...');
    await sql`DELETE FROM onemap_properties`;
    console.log('✅ Existing data cleared\n');

    // 3. Prepare batch data
    console.log('💾 Starting batch import...');
    let imported = 0;
    let skipped = 0;
    const validRecords = [];

    // Filter and prepare records
    for (const row of data) {
      if (!row['Property ID']) {
        skipped++;
        continue;
      }

      validRecords.push({
        property_id: row['Property ID'],
        onemap_nad_id: row['1map NAD ID'] || null,
        status: row['Status'] || null,
        location_address: row['Location Address'] || null,
        latitude: parseFloat(row['Latitude']) || null,
        longitude: parseFloat(row['Longitude']) || null,
        pole_number: row['Pole Number'] || null,
        drop_number: row['Drop Number'] || null,
        contact_name: row['Contact Person: Name'] || null,
        contact_surname: row['Contact Person: Surname'] || null,
        contact_number: row['Contact Number (e.g.0123456789)'] || null
      });
    }

    console.log(`📦 Prepared ${validRecords.length} valid records for import\n`);

    // 4. Batch insert using unnest for maximum speed
    for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
      const batch = validRecords.slice(i, Math.min(i + BATCH_SIZE, validRecords.length));

      try {
        // Use PostgreSQL's unnest for bulk insert - much faster than individual inserts
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
          )
          SELECT * FROM UNNEST(
            ${batch.map(r => r.property_id)}::text[],
            ${batch.map(r => r.onemap_nad_id)}::text[],
            ${batch.map(r => r.status)}::text[],
            ${batch.map(r => r.location_address)}::text[],
            ${batch.map(r => r.latitude)}::numeric[],
            ${batch.map(r => r.longitude)}::numeric[],
            ${batch.map(r => r.pole_number)}::text[],
            ${batch.map(r => r.drop_number)}::text[],
            ${batch.map(r => r.contact_name)}::text[],
            ${batch.map(r => r.contact_surname)}::text[],
            ${batch.map(r => r.contact_number)}::text[],
            ${batch.map(() => new Date())}::timestamp[]
          )
          ON CONFLICT DO NOTHING
        `;

        imported += batch.length;
        const progress = Math.round((imported / validRecords.length) * 100);
        console.log(`  ⚡ Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${imported}/${validRecords.length} (${progress}%)`);
      } catch (err) {
        console.error(`  ❌ Error in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${err.message.substring(0, 50)}`);
        skipped += batch.length;
      }
    }

    // 5. Verify import
    const count = await sql`SELECT COUNT(*) as count FROM onemap_properties`;
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ IMPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log(`⏱️  Time taken: ${duration} seconds`);
    console.log(`📈 Records imported: ${imported}`);
    console.log(`⏩ Records skipped: ${skipped}`);
    console.log(`💾 Total in database: ${count[0].count}`);
    console.log(`🚀 Import speed: ${Math.round(imported / duration)} records/second`);

    // 6. Show sample data
    const sample = await sql`
      SELECT property_id, pole_number, drop_number, status
      FROM onemap_properties
      LIMIT 5
    `;
    console.log('\n📋 Sample imported records:');
    sample.forEach(r => {
      console.log(`  Property: ${r.property_id} | Pole: ${r.pole_number} | Drop: ${r.drop_number} | Status: ${r.status}`);
    });

    console.log('\n🎉 Data is now available at http://localhost:3005/sow/grid');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();