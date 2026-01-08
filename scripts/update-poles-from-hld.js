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

    // Get project ID
    const p = await sql`SELECT id FROM onemap.projects WHERE project_code = ${proj.code}`;
    const projectId = p[0].id;

    // Read HLD_Pole
    const wb = XLSX.readFile(proj.file);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets['HLD_Pole']);
    console.log('HLD_Pole rows:', rows.length);

    // Get existing poles
    const existing = await sql`SELECT pole_number FROM onemap.poles WHERE project_id = ${projectId}::uuid`;
    const existingSet = new Set(existing.map(r => r.pole_number));
    console.log('Existing poles in DB:', existingSet.size);

    let updated = 0, inserted = 0;

    for (const row of rows) {
      const poleNum = row[proj.labelCol];
      if (!poleNum) continue;

      const lat = parseFloat(row.lat) || null;
      const lon = parseFloat(row.lon) || null;
      const poleType = row['Pole Type'] || null;

      if (existingSet.has(poleNum)) {
        // Update existing
        await sql`
          UPDATE onemap.poles SET
            latitude = COALESCE(${lat}, latitude),
            longitude = COALESCE(${lon}, longitude),
            pole_type = COALESCE(${poleType}, pole_type)
          WHERE project_id = ${projectId}::uuid AND pole_number = ${poleNum}
        `;
        updated++;
      } else {
        // Insert new (feeder pole)
        await sql`
          INSERT INTO onemap.poles (project_id, pole_number, latitude, longitude, pole_type, last_synced_at)
          VALUES (${projectId}::uuid, ${poleNum}, ${lat}, ${lon}, ${poleType || 'Feeder'}, NOW())
        `;
        inserted++;
        existingSet.add(poleNum);
      }

      if ((updated + inserted) % 500 === 0) {
        process.stdout.write('\r' + (updated + inserted) + '/' + rows.length);
      }
    }

    // Mark distribution poles (those with drops) for projects without Pole Type
    if (proj.code !== 'MOH') {
      await sql`
        UPDATE onemap.poles SET pole_type = 'Distribution'
        WHERE project_id = ${projectId}::uuid
        AND pole_type IS NULL
        AND drop_count > 0
      `;

      // Mark remaining as Feeder
      await sql`
        UPDATE onemap.poles SET pole_type = 'Feeder'
        WHERE project_id = ${projectId}::uuid
        AND pole_type IS NULL
      `;
    }

    console.log('\nUpdated:', updated, 'Inserted:', inserted);
  }

  // Final counts
  const counts = await sql`
    SELECT p.project_code,
           (SELECT COUNT(*) FROM onemap.poles pl WHERE pl.project_id = p.id) as total,
           (SELECT COUNT(*) FROM onemap.poles pl WHERE pl.project_id = p.id AND pl.pole_type = 'Distribution') as dist,
           (SELECT COUNT(*) FROM onemap.poles pl WHERE pl.project_id = p.id AND pl.pole_type LIKE '%Feeder%') as feeder
    FROM onemap.projects p ORDER BY p.project_code
  `;
  console.log('\n=== Final Counts ===');
  counts.forEach(c => console.log(c.project_code + ': ' + c.total + ' poles (' + c.dist + ' dist, ' + c.feeder + ' feeder)'));
}

main().catch(e => console.error(e));
