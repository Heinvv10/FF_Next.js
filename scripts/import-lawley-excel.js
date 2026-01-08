#!/usr/bin/env node
/**
 * Import Lawley HLD_Home data from Excel to onemap schema
 *
 * Usage: DATABASE_URL="..." node scripts/import-lawley-excel.js
 */

const XLSX = require('xlsx');
const { neon } = require('@neondatabase/serverless');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../docs/project docs/VF_Project_Tracker_Lawley.xlsx');
const SHEET_NAME = 'HLD_Home';
const SITE_CODE = 'lawley';
const BATCH_SIZE = 500;

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);

  if (!workbook.SheetNames.includes(SHEET_NAME)) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available:`, workbook.SheetNames);
    process.exit(1);
  }

  const sheet = workbook.Sheets[SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Found ${rows.length} rows in ${SHEET_NAME}`);

  // Show sample row structure
  if (rows.length > 0) {
    console.log('\nSample row columns:', Object.keys(rows[0]).join(', '));
    console.log('Sample row:', JSON.stringify(rows[0], null, 2));
  }

  // Get or create site
  console.log('\nLooking up site...');
  let site = await sql`
    SELECT id FROM onemap.sites WHERE site_code = ${SITE_CODE}
  `;

  if (site.length === 0) {
    console.log('Creating site...');
    site = await sql`
      INSERT INTO onemap.sites (site_code, site_name)
      VALUES (${SITE_CODE}, 'Lawley')
      RETURNING id
    `;
  }
  const siteId = site[0].id;
  console.log('Site ID:', siteId);

  // Clear existing data for this site
  console.log('\nClearing existing drops for site...');
  await sql`DELETE FROM onemap.drops WHERE site_id = ${siteId}::uuid`;
  await sql`DELETE FROM onemap.poles WHERE site_id = ${siteId}::uuid`;

  // Process rows
  console.log(`\nProcessing ${rows.length} drops...`);

  const poleCache = new Map(); // pole_number -> pole_id
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));

    for (const row of batch) {
      try {
        // Extract DR number from label
        const drNumber = row.label || null;

        // Extract pole from strtfeat (e.g., LAW.P.C882 -> LAW.P.C882)
        const poleNumber = row.strtfeat || null;

        // Parse coordinates
        const lat = parseFloat(row.lat) || null;
        const lng = parseFloat(row.lon) || null;

        // Get or create pole
        let poleId = null;
        if (poleNumber) {
          if (poleCache.has(poleNumber)) {
            poleId = poleCache.get(poleNumber);
          } else {
            // Try to get existing pole
            const existing = await sql`
              SELECT id FROM onemap.poles
              WHERE site_id = ${siteId}::uuid AND pole_number = ${poleNumber}
            `;

            if (existing.length > 0) {
              poleId = existing[0].id;
            } else {
              // Create new pole
              const newPole = await sql`
                INSERT INTO onemap.poles (site_id, pole_number, latitude, longitude, last_synced_at)
                VALUES (${siteId}::uuid, ${poleNumber}, ${lat}, ${lng}, NOW())
                RETURNING id
              `;
              poleId = newPole[0].id;
            }
            poleCache.set(poleNumber, poleId);
          }
        }

        // Insert installation
        await sql`
          INSERT INTO onemap.drops (
            site_id, dr_number, pole_id, pole_number, section_code, pon_code,
            latitude, longitude, address, current_status, last_synced_at
          ) VALUES (
            ${siteId}::uuid,
            ${drNumber},
            ${poleId}::uuid,
            ${poleNumber},
            ${row.zone_no ? String(row.zone_no) : null},
            ${row.pon_no ? String(row.pon_no) : null},
            ${lat},
            ${lng},
            ${row.address || null},
            ${row.subtyp || null},
            NOW()
          )
        `;

        processed++;
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`Error on row ${i + batch.indexOf(row)}:`, err.message);
          console.error('Row data:', JSON.stringify(row).substring(0, 200));
        }
      }
    }

    const pct = ((i + batch.length) / rows.length * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${i + batch.length}/${rows.length} (${pct}%) - ${poleCache.size} poles`);
  }

  console.log('\n');

  // Update pole installation counts
  console.log('Updating pole installation counts...');
  await sql`
    UPDATE onemap.poles p SET
      drop_count = (
        SELECT COUNT(*) FROM onemap.drops i WHERE i.pole_id = p.id
      )
    WHERE p.site_id = ${siteId}::uuid
  `;

  // Update site totals
  await sql`
    UPDATE onemap.sites SET
      total_drops = ${processed},
      last_full_sync = NOW()
    WHERE id = ${siteId}::uuid
  `;

  // Log sync
  await sql`
    INSERT INTO onemap.sync_log (site_id, sync_type, records_synced, status, details)
    VALUES (${siteId}::uuid, 'excel_import', ${processed}, 'success',
      ${JSON.stringify({ source: EXCEL_FILE, sheet: SHEET_NAME, errors })}::jsonb)
  `;

  // Summary
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Installations: ${processed}`);
  console.log(`Poles created: ${poleCache.size}`);
  console.log(`Errors: ${errors}`);

  // Verify
  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM onemap.drops WHERE site_id = ${siteId}::uuid) as drops,
      (SELECT COUNT(*) FROM onemap.poles WHERE site_id = ${siteId}::uuid) as poles
  `;
  console.log('\nDatabase counts:');
  console.log(`  Installations: ${counts[0].drops}`);
  console.log(`  Poles: ${counts[0].poles}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
