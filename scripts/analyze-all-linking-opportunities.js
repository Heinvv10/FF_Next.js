const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function analyzeAllLinkingOpportunities() {
  try {
    console.log('=== COMPREHENSIVE LINKING ANALYSIS ===\n');
    console.log('Analyzing what data exists and what can actually be linked...\n');

    // 1. Get overview of all projects and their data
    console.log('📊 PROJECT DATA OVERVIEW:');
    console.log('=' .repeat(50));

    const projects = await sql`
      SELECT
        p.id,
        p.project_name,
        p.created_at,
        (SELECT COUNT(*) FROM sow_poles WHERE project_id = p.id) as sow_poles_count,
        (SELECT COUNT(*) FROM sow_drops WHERE project_id = p.id) as sow_drops_count,
        (SELECT COUNT(*) FROM sow_fibre WHERE project_id = p.id) as sow_fibre_count
      FROM projects p
      ORDER BY p.created_at DESC
    `;

    console.log('\nProjects and their SOW data:');
    projects.forEach(p => {
      console.log(`\n${p.project_name} (${p.id})`);
      console.log(`  Created: ${p.created_at}`);
      console.log(`  SOW Poles: ${p.sow_poles_count}`);
      console.log(`  SOW Drops: ${p.sow_drops_count}`);
      console.log(`  SOW Fibre: ${p.sow_fibre_count}`);
    });

    // 2. Check OneMap data (field data)
    console.log('\n\n📍 ONEMAP FIELD DATA:');
    console.log('=' .repeat(50));

    const [onemapStats] = await sql`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT pole_number) as unique_poles,
        COUNT(DISTINCT drop_number) as unique_drops,
        COUNT(CASE WHEN pole_number IS NOT NULL THEN 1 END) as records_with_poles,
        COUNT(CASE WHEN drop_number IS NOT NULL THEN 1 END) as records_with_drops
      FROM onemap_properties
    `;

    console.log(`Total OneMap Records: ${onemapStats.total_records}`);
    console.log(`Records with Poles: ${onemapStats.records_with_poles}`);
    console.log(`Records with Drops: ${onemapStats.records_with_drops}`);
    console.log(`Unique Pole Numbers: ${onemapStats.unique_poles}`);
    console.log(`Unique Drop Numbers: ${onemapStats.unique_drops}`);

    // 3. Sample pole numbers from each source
    console.log('\n\n🔍 SAMPLE DATA COMPARISON:');
    console.log('=' .repeat(50));

    // Sample SOW poles
    console.log('\nSample SOW Poles (from each project):');
    for (const project of projects) {
      if (project.sow_poles_count > 0) {
        const samples = await sql`
          SELECT DISTINCT pole_number
          FROM sow_poles
          WHERE project_id = ${project.id}
          AND pole_number IS NOT NULL
          LIMIT 5
        `;
        console.log(`\n  ${project.project_name}:`);
        samples.forEach(s => console.log(`    - ${s.pole_number}`));
      }
    }

    // Sample OneMap poles
    console.log('\nSample OneMap Poles (field data):');
    const onemapPoles = await sql`
      SELECT DISTINCT pole_number
      FROM onemap_properties
      WHERE pole_number IS NOT NULL
      LIMIT 10
    `;
    onemapPoles.forEach(p => console.log(`  - ${p.pole_number}`));

    // 4. Check for ACTUAL linking possibilities - POLES
    console.log('\n\n🔗 POLE LINKING ANALYSIS:');
    console.log('=' .repeat(50));

    for (const project of projects) {
      if (project.sow_poles_count > 0) {
        console.log(`\nProject: ${project.project_name}`);

        // Direct matches
        const [directMatches] = await sql`
          SELECT COUNT(*) as count
          FROM sow_poles sp
          INNER JOIN onemap_properties op ON sp.pole_number = op.pole_number
          WHERE sp.project_id = ${project.id}
        `;
        console.log(`  Direct pole matches: ${directMatches.count}`);

        // Suffix matches
        const [suffixMatches] = await sql`
          SELECT COUNT(DISTINCT sp.pole_number) as count
          FROM sow_poles sp
          CROSS JOIN onemap_properties op
          WHERE sp.project_id = ${project.id}
            AND sp.pole_number IS NOT NULL
            AND op.pole_number IS NOT NULL
            AND substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
            AND substring(sp.pole_number from '\\d+$') IS NOT NULL
        `;
        console.log(`  Suffix matches: ${suffixMatches.count}`);

        // Show some examples
        const examples = await sql`
          SELECT
            sp.pole_number as sow_pole,
            op.pole_number as onemap_pole
          FROM sow_poles sp
          CROSS JOIN onemap_properties op
          WHERE sp.project_id = ${project.id}
            AND substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
            AND substring(sp.pole_number from '\\d+$') IS NOT NULL
          LIMIT 3
        `;

        if (examples.length > 0) {
          console.log('  Example matches:');
          examples.forEach(e => {
            console.log(`    ${e.sow_pole} <-> ${e.onemap_pole}`);
          });
        }
      }
    }

    // 5. Check for DROP linking possibilities
    console.log('\n\n💧 DROP LINKING ANALYSIS:');
    console.log('=' .repeat(50));

    // Sample drops from each source
    console.log('\nSample SOW Drops:');
    for (const project of projects) {
      if (project.sow_drops_count > 0) {
        const samples = await sql`
          SELECT DISTINCT drop_number, pole_number
          FROM sow_drops
          WHERE project_id = ${project.id}
          AND drop_number IS NOT NULL
          LIMIT 3
        `;
        console.log(`\n  ${project.project_name}:`);
        samples.forEach(s => console.log(`    - Drop: ${s.drop_number} (from pole: ${s.pole_number})`));
      }
    }

    console.log('\nSample OneMap Drops:');
    const onemapDrops = await sql`
      SELECT DISTINCT drop_number, pole_number
      FROM onemap_properties
      WHERE drop_number IS NOT NULL
      LIMIT 5
    `;
    onemapDrops.forEach(d => console.log(`  - Drop: ${d.drop_number} (pole: ${d.pole_number || 'N/A'})`));

    // Check drop matches
    for (const project of projects) {
      if (project.sow_drops_count > 0) {
        console.log(`\nProject: ${project.project_name}`);

        const [dropMatches] = await sql`
          SELECT COUNT(DISTINCT sd.drop_number) as count
          FROM sow_drops sd
          INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
          WHERE sd.project_id = ${project.id}
        `;
        console.log(`  Direct drop matches: ${dropMatches.count}`);

        // Show examples
        const dropExamples = await sql`
          SELECT
            sd.drop_number,
            sd.pole_number as sow_pole,
            op.pole_number as onemap_pole
          FROM sow_drops sd
          INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
          WHERE sd.project_id = ${project.id}
          LIMIT 3
        `;

        if (dropExamples.length > 0) {
          console.log('  Example drop matches:');
          dropExamples.forEach(e => {
            console.log(`    Drop ${e.drop_number}: SOW pole ${e.sow_pole} <-> OneMap pole ${e.onemap_pole || 'N/A'}`);
          });
        }
      }
    }

    // 6. Geographic proximity analysis
    console.log('\n\n🌍 GEOGRAPHIC PROXIMITY ANALYSIS:');
    console.log('=' .repeat(50));

    for (const project of projects) {
      if (project.sow_poles_count > 0) {
        console.log(`\nProject: ${project.project_name}`);

        const [proximityMatches] = await sql`
          SELECT COUNT(*) as count
          FROM (
            SELECT DISTINCT sp.pole_number
            FROM sow_poles sp
            CROSS JOIN onemap_properties op
            WHERE sp.project_id = ${project.id}
              AND sp.latitude IS NOT NULL
              AND op.latitude IS NOT NULL
              AND ABS(sp.latitude - op.latitude::numeric) < 0.0001
              AND ABS(sp.longitude - op.longitude::numeric) < 0.0001
          ) as matches
        `;
        console.log(`  Poles within ~10m proximity: ${proximityMatches.count}`);
      }
    }

    // 7. Summary and Recommendations
    console.log('\n\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(50));

    // Check what's actually linkable
    const linkableSummary = await sql`
      WITH pole_links AS (
        SELECT
          'louissep15' as project,
          COUNT(DISTINCT sp.pole_number) as linkable_poles
        FROM sow_poles sp
        WHERE sp.project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
          AND EXISTS (
            SELECT 1 FROM onemap_properties op
            WHERE substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
          )
      ),
      drop_links AS (
        SELECT
          'Lawley' as project,
          COUNT(DISTINCT sd.drop_number) as linkable_drops
        FROM sow_drops sd
        WHERE sd.project_id = '31c6184f-ad32-47ce-9930-25073574cdcd'
          AND EXISTS (
            SELECT 1 FROM onemap_properties op
            WHERE sd.drop_number = op.drop_number
          )
      )
      SELECT * FROM pole_links
      UNION ALL
      SELECT * FROM drop_links
    `;

    console.log('\n🎯 KEY FINDINGS:');
    console.log('1. Data Distribution Issue:');
    console.log('   - louissep15: Has 15,607 SOW poles but 0 drops');
    console.log('   - Lawley: Has 23,707 SOW drops but 0 poles');
    console.log('   - OneMap: Has both poles AND drops from field work');

    console.log('\n2. Linking Opportunities:');
    linkableSummary.forEach(s => {
      if (s.linkable_poles) {
        console.log(`   - ${s.project}: ${s.linkable_poles} poles can be linked`);
      }
      if (s.linkable_drops) {
        console.log(`   - ${s.project}: ${s.linkable_drops} drops can be linked`);
      }
    });

    console.log('\n3. Recommendations:');
    console.log('   ✓ Run pole reconciliation for louissep15 project');
    console.log('   ✓ Run drop reconciliation for Lawley project');
    console.log('   ✓ Consider merging project data for complete picture');
    console.log('   ✓ OneMap data appears to be shared across all projects');

    console.log('\n=== ANALYSIS COMPLETE ===\n');

  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run the analysis
analyzeAllLinkingOpportunities();