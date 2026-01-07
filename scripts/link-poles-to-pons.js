#!/usr/bin/env node
const XLSX = require('xlsx');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const projects = [
  { code: 'LAW', file: 'docs/project docs/VF_Project_Tracker_Lawley.xlsx', labelCol: 'label_1' },
  { code: 'MAM', file: 'docs/project docs/VF_Project_Tracker_Mamelodi POP1.xlsx', labelCol: 'Label' },
  { code: 'MOH', file: 'docs/project docs/VF_Project_Tracker_Mohadin.xlsx', labelCol: 'Label' }
];

async function main() {
  for (const proj of projects) {
    console.log('\n=== ' + proj.code + ' ===');

    // Get project
    const p = await sql`SELECT id FROM onemap.projects WHERE project_code = ${proj.code}`;
    const projectId = p[0].id;

    // Get zones for this project
    const zones = await sql`SELECT id, zone_code FROM onemap.zones WHERE project_id = ${projectId}::uuid`;
    const zoneMap = new Map(zones.map(z => [z.zone_code, z.id]));
    console.log('Zones:', zoneMap.size);

    // Get PONs for this project
    const pons = await sql`
      SELECT pn.id, pn.pon_code, z.zone_code
      FROM onemap.pons pn
      JOIN onemap.zones z ON pn.zone_id = z.id
      WHERE z.project_id = ${projectId}::uuid
    `;
    const ponMap = new Map(pons.map(p => [p.zone_code + ':' + p.pon_code, p.id]));
    console.log('PONs:', ponMap.size);

    // Read HLD_Pole
    const wb = XLSX.readFile(proj.file);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['HLD_Pole']);
    console.log('HLD_Pole rows:', rows.length);

    let updated = 0;
    for (const row of rows) {
      const poleNum = row[proj.labelCol];
      if (!poleNum) continue;

      const zoneCode = row.zone_no != null ? String(row.zone_no) : null;
      const ponCode = row.pon_no != null ? String(row.pon_no) : null;

      const zoneId = zoneCode ? zoneMap.get(zoneCode) : null;
      const ponId = (zoneCode && ponCode) ? ponMap.get(zoneCode + ':' + ponCode) : null;

      if (zoneId || ponId) {
        await sql`
          UPDATE onemap.poles SET
            zone_id = COALESCE(${zoneId}::uuid, zone_id),
            pon_id = COALESCE(${ponId}::uuid, pon_id)
          WHERE project_id = ${projectId}::uuid AND pole_number = ${poleNum}
        `;
        updated++;
      }

      if (updated % 500 === 0 && updated > 0) {
        process.stdout.write('\r' + updated + '/' + rows.length);
      }
    }
    console.log('\nUpdated:', updated);
  }

  // Verify
  const linked = await sql`
    SELECT
      (SELECT COUNT(*) FROM onemap.poles WHERE zone_id IS NOT NULL) as with_zone,
      (SELECT COUNT(*) FROM onemap.poles WHERE pon_id IS NOT NULL) as with_pon,
      (SELECT COUNT(*) FROM onemap.poles) as total
  `;
  console.log('\n=== Final ===');
  console.log('Poles with zone_id:', linked[0].with_zone, '/', linked[0].total);
  console.log('Poles with pon_id:', linked[0].with_pon, '/', linked[0].total);
}

main().catch(e => console.error(e));
