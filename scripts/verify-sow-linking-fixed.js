const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verifySowLinking() {
  try {
    console.log('=== SOW LINKING VERIFICATION REPORT ===\n');

    // First, get a valid project ID
    const projects = await sql`
      SELECT id, project_name FROM projects LIMIT 5
    `;

    console.log('Available Projects:');
    projects.forEach(p => console.log(`  - ${p.id}: ${p.project_name}`));

    // Use the first project or a specific one
    const projectId = projects[0]?.id;

    if (!projectId) {
      console.log('No projects found in database');
      return;
    }

    console.log(`\nUsing Project: ${projects[0].project_name} (${projectId})\n`);

    // 1. Count total records in each table
    console.log('📊 DATA SUMMARY:');
    console.log('================');

    const [sowPolesCount] = await sql`
      SELECT COUNT(*) as count FROM sow_poles WHERE project_id = ${projectId}
    `;
    console.log(`SOW Poles: ${sowPolesCount.count}`);

    const [sowDropsCount] = await sql`
      SELECT COUNT(*) as count FROM sow_drops WHERE project_id = ${projectId}
    `;
    console.log(`SOW Drops: ${sowDropsCount.count}`);

    const [oneMapCount] = await sql`
      SELECT COUNT(*) as count FROM onemap_properties
    `;
    console.log(`OneMap Properties: ${oneMapCount.count}\n`);

    // 2. Check linking status - Get examples of each scenario
    console.log('🔗 LINKING SCENARIOS:');
    console.log('=====================\n');

    // Scenario 1: Matched poles (linked)
    console.log('✅ SCENARIO 1: MATCHED/LINKED POLES');
    const matchedPoles = await sql`
      SELECT
        op.property_id,
        op.pole_number,
        op.drop_number,
        sp.pole_number as sow_pole_number,
        sd.drop_number as sow_drop_number
      FROM onemap_properties op
      LEFT JOIN sow_poles sp ON op.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      LEFT JOIN sow_drops sd ON op.drop_number = sd.drop_number
        AND sd.project_id = ${projectId}
      WHERE sp.pole_number IS NOT NULL
      LIMIT 3
    `;

    if (matchedPoles.length > 0) {
      console.log('Examples of linked poles (Field work matches SOW):');
      matchedPoles.forEach(p => {
        console.log(`  Property: ${p.property_id}`);
        console.log(`  ├─ OneMap Pole: ${p.pole_number}`);
        console.log(`  ├─ SOW Pole: ${p.sow_pole_number} ✓`);
        console.log(`  ├─ Drop: ${p.drop_number || 'N/A'}`);
        console.log(`  └─ Status: ✅ LINKED - Work completed as planned\n`);
      });
    } else {
      console.log('  No matched poles found\n');
    }

    // Scenario 2: Unmatched field work (not in SOW)
    console.log('⚠️ SCENARIO 2: UNMATCHED FIELD WORK');
    const unmatchedField = await sql`
      SELECT
        op.property_id,
        op.pole_number,
        op.drop_number
      FROM onemap_properties op
      LEFT JOIN sow_poles sp ON op.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      WHERE op.pole_number IS NOT NULL
        AND sp.pole_number IS NULL
      LIMIT 3
    `;

    if (unmatchedField.length > 0) {
      console.log('Examples of unlinked field work (Not in SOW plan):');
      unmatchedField.forEach(p => {
        console.log(`  Property: ${p.property_id}`);
        console.log(`  ├─ OneMap Pole: ${p.pole_number}`);
        console.log(`  ├─ SOW Match: None`);
        console.log(`  └─ Status: ⚠️ NOT LINKED - Extra/unauthorized work\n`);
      });
    } else {
      console.log('  No unmatched field work found\n');
    }

    // Scenario 3: Missing field work (in SOW but not in field)
    console.log('❌ SCENARIO 3: MISSING FIELD WORK');
    const missingField = await sql`
      SELECT
        sp.pole_number,
        sp.pole_id,
        sp.latitude,
        sp.longitude
      FROM sow_poles sp
      LEFT JOIN onemap_properties op ON sp.pole_number = op.pole_number
      WHERE sp.project_id = ${projectId}
        AND op.pole_number IS NULL
      LIMIT 3
    `;

    if (missingField.length > 0) {
      console.log('Examples of planned work not done:');
      missingField.forEach(p => {
        console.log(`  SOW Pole: ${p.pole_number}`);
        console.log(`  ├─ Pole ID: ${p.pole_id}`);
        console.log(`  ├─ Location: ${p.latitude}, ${p.longitude}`);
        console.log(`  ├─ Field Status: No OneMap record`);
        console.log(`  └─ Status: ❌ NOT COMPLETED - Planned work not done\n`);
      });
    } else {
      console.log('  All SOW poles have been completed\n');
    }

    // 4. Statistical Summary
    console.log('📈 LINKING STATISTICS:');
    console.log('======================');

    const [linkedCount] = await sql`
      SELECT COUNT(*) as count
      FROM onemap_properties op
      INNER JOIN sow_poles sp ON op.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      WHERE op.pole_number IS NOT NULL
    `;

    const [unlinkedFieldCount] = await sql`
      SELECT COUNT(*) as count
      FROM onemap_properties op
      LEFT JOIN sow_poles sp ON op.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      WHERE op.pole_number IS NOT NULL
        AND sp.pole_number IS NULL
    `;

    const [missingFieldCount] = await sql`
      SELECT COUNT(*) as count
      FROM sow_poles sp
      LEFT JOIN onemap_properties op ON sp.pole_number = op.pole_number
      WHERE sp.project_id = ${projectId}
        AND op.pole_number IS NULL
    `;

    console.log(`Linked (Matched): ${linkedCount.count} poles`);
    console.log(`Unlinked Field Work: ${unlinkedFieldCount.count} poles`);
    console.log(`Missing Field Work: ${missingFieldCount.count} poles`);

    const totalSowPoles = parseInt(sowPolesCount.count);
    const completionRate = totalSowPoles > 0
      ? ((parseInt(linkedCount.count) / totalSowPoles) * 100).toFixed(1)
      : 0;

    console.log(`\n📊 SOW Completion Rate: ${completionRate}% of planned poles completed`);

    // 5. Specific pole examples for verification
    console.log('\n🔍 SPECIFIC POLE EXAMPLES FOR VERIFICATION:');
    console.log('==========================================');

    // Get some actual pole numbers from the database
    const samplePoles = await sql`
      SELECT DISTINCT pole_number FROM sow_poles
      WHERE project_id = ${projectId}
      AND pole_number IS NOT NULL
      LIMIT 5
    `;

    if (samplePoles.length > 0) {
      for (const pole of samplePoles) {
        const poleNum = pole.pole_number;
        console.log(`\nChecking Pole: ${poleNum}`);

        // Check in SOW
        const [sowPole] = await sql`
          SELECT * FROM sow_poles
          WHERE pole_number = ${poleNum}
          AND project_id = ${projectId}
          LIMIT 1
        `;

        // Check in OneMap
        const [oneMapPole] = await sql`
          SELECT * FROM onemap_properties
          WHERE pole_number = ${poleNum}
          LIMIT 1
        `;

        if (sowPole && oneMapPole) {
          console.log(`  ✅ LINKED - Found in both SOW and OneMap`);
          console.log(`  ├─ SOW: Pole ID ${sowPole.pole_id}`);
          console.log(`  ├─ OneMap: Property ${oneMapPole.property_id}`);
          console.log(`  ├─ Location: (${sowPole.latitude}, ${sowPole.longitude})`);
          console.log(`  └─ Drop: ${oneMapPole.drop_number || 'N/A'}`);
        } else if (sowPole && !oneMapPole) {
          console.log(`  ❌ NOT COMPLETED - In SOW but not in field`);
          console.log(`  ├─ SOW: Pole ID ${sowPole.pole_id}`);
          console.log(`  └─ Location: (${sowPole.latitude}, ${sowPole.longitude})`);
        } else if (!sowPole && oneMapPole) {
          console.log(`  ⚠️ EXTRA WORK - In field but not in SOW`);
          console.log(`  └─ OneMap: Property ${oneMapPole.property_id}`);
        } else {
          console.log(`  ❓ NOT FOUND - Not in either system`);
        }
      }
    }

    // 6. Drop Linking Examples
    console.log('\n\n📍 DROP LINKING EXAMPLES:');
    console.log('==========================');

    const dropExamples = await sql`
      SELECT
        op.property_id,
        op.drop_number,
        sd.drop_number as sow_drop_number,
        sd.drop_id
      FROM onemap_properties op
      LEFT JOIN sow_drops sd ON op.drop_number = sd.drop_number
        AND sd.project_id = ${projectId}
      WHERE op.drop_number IS NOT NULL
      LIMIT 5
    `;

    if (dropExamples.length > 0) {
      dropExamples.forEach(d => {
        console.log(`\nDrop: ${d.drop_number}`);
        if (d.sow_drop_number) {
          console.log(`  ✅ LINKED - Matches SOW Drop ID ${d.drop_id}`);
        } else {
          console.log(`  ⚠️ NOT LINKED - No matching SOW drop`);
        }
        console.log(`  └─ Property: ${d.property_id}`);
      });
    } else {
      console.log('No drops found in OneMap data');
    }

    console.log('\n=== END OF VERIFICATION REPORT ===\n');

  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run verification
verifySowLinking();