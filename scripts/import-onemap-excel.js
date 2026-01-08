#!/usr/bin/env node
/**
 * Import project HLD data from Excel to onemap schema
 *
 * Usage: DATABASE_URL="..." node scripts/import-onemap-excel.js <project_code> <excel_file> [sheet_name]
 *
 * Examples:
 *   node scripts/import-onemap-excel.js LAW "docs/project docs/VF_Project_Tracker_Lawley.xlsx" HLD_Home
 *   node scripts/import-onemap-excel.js MOH "docs/project docs/VF_Project_Tracker_Mohadin.xlsx" HLD_Home
 */

const XLSX = require('xlsx');
const { neon } = require('@neondatabase/serverless');
const path = require('path');

const BATCH_SIZE = 500;

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node import-onemap-excel.js <project_code> <excel_file> [sheet_name]');
    console.error('Example: node import-onemap-excel.js LAW "docs/project docs/VF_Project_Tracker_Lawley.xlsx" HLD_Home');
    process.exit(1);
  }

  const projectCode = args[0].toUpperCase();
  const excelFile = path.resolve(args[1]);
  const sheetName = args[2] || 'HLD_Home';

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  // Validate project exists
  console.log(`Looking up project ${projectCode}...`);
  const project = await sql`
    SELECT id, project_name, project_id FROM onemap.projects WHERE project_code = ${projectCode}
  `;

  if (project.length === 0) {
    console.error(`Project ${projectCode} not found in onemap.projects`);
    console.error('Available projects:');
    const all = await sql`SELECT project_code, project_name FROM onemap.projects`;
    all.forEach(p => console.error(`  ${p.project_code}: ${p.project_name}`));
    process.exit(1);
  }

  const projectId = project[0].id;
  console.log(`Found: ${project[0].project_name} (${projectId})`);

  // Read Excel
  console.log(`\nReading ${excelFile}...`);
  const workbook = XLSX.readFile(excelFile);

  if (!workbook.SheetNames.includes(sheetName)) {
    console.error(`Sheet "${sheetName}" not found. Available:`, workbook.SheetNames.join(', '));
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Found ${rows.length} rows in ${sheetName}`);

  if (rows.length === 0) {
    console.error('No data found');
    process.exit(1);
  }

  // Show columns
  console.log('Columns:', Object.keys(rows[0]).join(', '));

  // Clear existing data
  console.log('\nClearing existing data for project...');

  // Get zone IDs for this project to delete PONs
  const zones = await sql`SELECT id FROM onemap.zones WHERE project_id = ${projectId}::uuid`;
  if (zones.length > 0) {
    const zoneIds = zones.map(z => z.id);
    await sql`DELETE FROM onemap.pons WHERE zone_id = ANY(${zoneIds}::uuid[])`;
  }

  await sql`DELETE FROM onemap.drops WHERE project_id = ${projectId}::uuid`;
  await sql`DELETE FROM onemap.poles WHERE project_id = ${projectId}::uuid`;
  await sql`DELETE FROM onemap.zones WHERE project_id = ${projectId}::uuid`;
  console.log('Cleared.');

  // Phase 1: Create zones
  console.log('\nPhase 1: Creating zones...');
  const uniqueZones = [...new Set(rows.filter(r => r.zone_no != null).map(r => String(r.zone_no)))];
  const zoneMap = new Map(); // zone_code -> zone_id

  for (const zoneCode of uniqueZones) {
    const result = await sql`
      INSERT INTO onemap.zones (project_id, zone_code, zone_name)
      VALUES (${projectId}::uuid, ${zoneCode}, ${'Zone ' + zoneCode})
      RETURNING id
    `;
    zoneMap.set(zoneCode, result[0].id);
  }
  console.log(`Created ${zoneMap.size} zones`);

  // Phase 2: Create PONs
  console.log('\nPhase 2: Creating PONs...');
  const uniquePons = new Map(); // "zone_code:pon_code" -> {zone_code, pon_code}
  rows.forEach(r => {
    if (r.zone_no != null && r.pon_no != null) {
      const key = `${r.zone_no}:${r.pon_no}`;
      if (!uniquePons.has(key)) {
        uniquePons.set(key, { zone_code: String(r.zone_no), pon_code: String(r.pon_no) });
      }
    }
  });

  const ponMap = new Map(); // "zone_code:pon_code" -> pon_id
  for (const [key, pon] of uniquePons) {
    const zoneId = zoneMap.get(pon.zone_code);
    if (zoneId) {
      const result = await sql`
        INSERT INTO onemap.pons (zone_id, pon_code, pon_name)
        VALUES (${zoneId}::uuid, ${pon.pon_code}, ${'PON ' + pon.pon_code})
        RETURNING id
      `;
      ponMap.set(key, result[0].id);
    }
  }
  console.log(`Created ${ponMap.size} PONs`);

  // Phase 3: Create poles and drops
  console.log('\nPhase 3: Creating poles and drops...');
  const poleCache = new Map(); // pole_number -> pole_id
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, Math.min(i + BATCH_SIZE, rows.length));

    for (const row of batch) {
      try {
        const drNumber = row.label || null;
        const poleNumber = row.strtfeat || null;
        const lat = parseFloat(row.lat) || null;
        const lng = parseFloat(row.lon) || null;
        const zoneCode = row.zone_no != null ? String(row.zone_no) : null;
        const ponCode = row.pon_no != null ? String(row.pon_no) : null;

        // Get or create pole
        let poleId = null;
        if (poleNumber) {
          if (poleCache.has(poleNumber)) {
            poleId = poleCache.get(poleNumber);
          } else {
            const result = await sql`
              INSERT INTO onemap.poles (project_id, pole_number, latitude, longitude, last_synced_at)
              VALUES (${projectId}::uuid, ${poleNumber}, ${lat}, ${lng}, NOW())
              RETURNING id
            `;
            poleId = result[0].id;
            poleCache.set(poleNumber, poleId);
          }
        }

        // Insert installation
        await sql`
          INSERT INTO onemap.drops (
            project_id, dr_number, pole_id, pole_number, zone_code, pon_code,
            latitude, longitude, address, current_status, last_synced_at
          ) VALUES (
            ${projectId}::uuid,
            ${drNumber},
            ${poleId}::uuid,
            ${poleNumber},
            ${zoneCode},
            ${ponCode},
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
        if (errors <= 3) {
          console.error(`Error on row ${i + batch.indexOf(row)}:`, err.message);
        }
      }
    }

    const pct = ((i + batch.length) / rows.length * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${i + batch.length}/${rows.length} (${pct}%) - ${poleCache.size} poles`);
  }

  console.log('\n');

  // Update pole installation counts
  console.log('Updating pole counts...');
  await sql`
    UPDATE onemap.poles p SET
      drop_count = (SELECT COUNT(*) FROM onemap.drops i WHERE i.pole_id = p.id)
    WHERE p.project_id = ${projectId}::uuid
  `;

  // Update project totals
  await sql`
    UPDATE onemap.projects SET
      total_drops = ${processed},
      last_full_sync = NOW()
    WHERE id = ${projectId}::uuid
  `;

  // Summary
  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`Project: ${project[0].project_name} (${projectCode})`);
  console.log(`Installations: ${processed}`);
  console.log(`Poles: ${poleCache.size}`);
  console.log(`Zones: ${zoneMap.size}`);
  console.log(`PONs: ${ponMap.size}`);
  if (errors > 0) console.log(`Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
