const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function analyzeNokiaLinking() {
  try {
    console.log('='.repeat(80));
    console.log('          NOKIA DATA LINKING ANALYSIS REPORT');
    console.log('='.repeat(80));
    console.log(`Generated: ${new Date().toISOString()}\n`);

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

    // Check if Nokia data was imported
    console.log('📊 NOKIA DATA IMPORT STATUS:');
    console.log('-'.repeat(60));

    const [nokiaStats] = await sql`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT property_id) as unique_properties,
        COUNT(DISTINCT pole_number) as unique_poles,
        COUNT(DISTINCT drop_number) as unique_drops,
        COUNT(ont_barcode) as with_ont,
        MIN(week_ending) as earliest_week,
        MAX(week_ending) as latest_week
      FROM nokia_velocity
      WHERE project_id = ${projectId}
    `;

    if (nokiaStats.total_records === 0) {
      console.log('⚠️ No Nokia data found. Import may still be running...');
      console.log('Run: node scripts/import-nokia-velocity.js\n');
      return;
    }

    console.log(`Total Nokia Records: ${nokiaStats.total_records}`);
    console.log(`Unique Properties: ${nokiaStats.unique_properties}`);
    console.log(`Unique Poles: ${nokiaStats.unique_poles}`);
    console.log(`Unique Drops: ${nokiaStats.unique_drops}`);
    console.log(`With ONT Barcode: ${nokiaStats.with_ont}`);
    console.log(`Week Range: ${nokiaStats.earliest_week} to ${nokiaStats.latest_week}\n`);

    // POLE LINKING ANALYSIS
    console.log('🔗 POLE LINKING ANALYSIS:');
    console.log('-'.repeat(60));

    const poleLinking = await sql`
      WITH pole_links AS (
        SELECT
          nv.pole_number as nokia_pole,
          sp.pole_number as sow_pole,
          op.pole_number as onemap_pole,
          CASE
            WHEN sp.pole_number IS NOT NULL AND op.pole_number IS NOT NULL THEN 'Triple Match'
            WHEN sp.pole_number IS NOT NULL THEN 'Nokia-SOW Match'
            WHEN op.pole_number IS NOT NULL THEN 'Nokia-OneMap Match'
            ELSE 'No Match'
          END as link_status
        FROM nokia_velocity nv
        LEFT JOIN sow_poles sp
          ON nv.pole_number = sp.pole_number
          AND sp.project_id = ${projectId}
        LEFT JOIN onemap_properties op
          ON nv.pole_number = op.pole_number
        WHERE nv.project_id = ${projectId}
          AND nv.pole_number IS NOT NULL
      )
      SELECT
        link_status,
        COUNT(*) as count
      FROM pole_links
      GROUP BY link_status
      ORDER BY count DESC
    `;

    console.log('Pole Linking Results:');
    let totalPoleLinks = 0;
    poleLinking.forEach(row => {
      console.log(`  ${row.link_status}: ${row.count}`);
      if (row.link_status !== 'No Match') {
        totalPoleLinks += parseInt(row.count);
      }
    });

    const poleLinkRate = nokiaStats.unique_poles > 0
      ? ((totalPoleLinks / nokiaStats.unique_poles) * 100).toFixed(1)
      : 0;
    console.log(`\nPole Linking Rate: ${poleLinkRate}%\n`);

    // DROP LINKING ANALYSIS
    console.log('💧 DROP LINKING ANALYSIS:');
    console.log('-'.repeat(60));

    const dropLinking = await sql`
      WITH drop_links AS (
        SELECT
          nv.drop_number as nokia_drop,
          sd.drop_number as sow_drop,
          op.drop_number as onemap_drop,
          CASE
            WHEN sd.drop_number IS NOT NULL AND op.drop_number IS NOT NULL THEN 'Triple Match'
            WHEN sd.drop_number IS NOT NULL THEN 'Nokia-SOW Match'
            WHEN op.drop_number IS NOT NULL THEN 'Nokia-OneMap Match'
            ELSE 'No Match'
          END as link_status
        FROM nokia_velocity nv
        LEFT JOIN sow_drops sd
          ON nv.drop_number = sd.drop_number
          AND sd.project_id = ${projectId}
        LEFT JOIN onemap_properties op
          ON nv.drop_number = op.drop_number
        WHERE nv.project_id = ${projectId}
          AND nv.drop_number IS NOT NULL
      )
      SELECT
        link_status,
        COUNT(*) as count
      FROM drop_links
      GROUP BY link_status
      ORDER BY count DESC
    `;

    console.log('Drop Linking Results:');
    let totalDropLinks = 0;
    dropLinking.forEach(row => {
      console.log(`  ${row.link_status}: ${row.count}`);
      if (row.link_status !== 'No Match') {
        totalDropLinks += parseInt(row.count);
      }
    });

    const dropLinkRate = nokiaStats.unique_drops > 0
      ? ((totalDropLinks / nokiaStats.unique_drops) * 100).toFixed(1)
      : 0;
    console.log(`\nDrop Linking Rate: ${dropLinkRate}%\n`);

    // PROPERTY LINKING ANALYSIS
    console.log('🏠 PROPERTY LINKING ANALYSIS:');
    console.log('-'.repeat(60));

    const propertyLinking = await sql`
      WITH property_links AS (
        SELECT
          nv.property_id as nokia_property,
          op.property_id as onemap_property,
          CASE
            WHEN op.property_id IS NOT NULL THEN 'Matched'
            ELSE 'No Match'
          END as link_status
        FROM nokia_velocity nv
        LEFT JOIN onemap_properties op
          ON nv.property_id = op.property_id
        WHERE nv.project_id = ${projectId}
          AND nv.property_id IS NOT NULL
      )
      SELECT
        link_status,
        COUNT(DISTINCT nokia_property) as count
      FROM property_links
      GROUP BY link_status
    `;

    console.log('Property Linking Results:');
    propertyLinking.forEach(row => {
      console.log(`  ${row.link_status}: ${row.count}`);
    });

    // SAMPLE LINKED DATA
    console.log('\n📝 SAMPLE LINKED RECORDS:');
    console.log('-'.repeat(60));

    const samples = await sql`
      SELECT
        nv.property_id,
        nv.pole_number,
        nv.drop_number,
        nv.status as nokia_status,
        nv.ont_barcode,
        sp.pole_number as sow_pole,
        sd.drop_number as sow_drop,
        op.property_id as onemap_property
      FROM nokia_velocity nv
      LEFT JOIN sow_poles sp
        ON nv.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      LEFT JOIN sow_drops sd
        ON nv.drop_number = sd.drop_number
        AND sd.project_id = ${projectId}
      LEFT JOIN onemap_properties op
        ON nv.property_id = op.property_id
      WHERE nv.project_id = ${projectId}
        AND (sp.pole_number IS NOT NULL
          OR sd.drop_number IS NOT NULL
          OR op.property_id IS NOT NULL)
      LIMIT 5
    `;

    console.log('\nSuccessfully Linked Examples:');
    samples.forEach((s, idx) => {
      console.log(`\n${idx + 1}. Property ${s.property_id}:`);
      console.log(`   Nokia Status: ${s.nokia_status || 'N/A'}`);
      if (s.pole_number) {
        console.log(`   Pole: ${s.pole_number} ${s.sow_pole ? '✓ (SOW matched)' : '✗'}`);
      }
      if (s.drop_number) {
        console.log(`   Drop: ${s.drop_number} ${s.sow_drop ? '✓ (SOW matched)' : '✗'}`);
      }
      if (s.onemap_property) {
        console.log(`   OneMap: ✓ Property matched`);
      }
      if (s.ont_barcode) {
        console.log(`   ONT: ${s.ont_barcode}`);
      }
    });

    // INSTALLATION PROGRESS SUMMARY
    console.log('\n\n📈 INSTALLATION PROGRESS SUMMARY:');
    console.log('-'.repeat(60));

    const progress = await sql`
      SELECT
        CASE
          WHEN installation_date IS NOT NULL THEN 'Completed'
          WHEN ont_barcode IS NOT NULL THEN 'ONT Assigned'
          WHEN pole_permission_date IS NOT NULL THEN 'Permission Granted'
          WHEN status LIKE '%Survey%' THEN 'Surveyed'
          ELSE 'Pending'
        END as progress_status,
        COUNT(*) as count
      FROM nokia_velocity
      WHERE project_id = ${projectId}
      GROUP BY progress_status
      ORDER BY
        CASE progress_status
          WHEN 'Completed' THEN 1
          WHEN 'ONT Assigned' THEN 2
          WHEN 'Permission Granted' THEN 3
          WHEN 'Surveyed' THEN 4
          ELSE 5
        END
    `;

    console.log('Installation Progress:');
    let total = 0;
    progress.forEach(row => {
      console.log(`  ${row.progress_status}: ${row.count}`);
      total += parseInt(row.count);
    });

    // Calculate velocity metrics
    const completed = progress.find(p => p.progress_status === 'Completed')?.count || 0;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    console.log(`\nOverall Completion Rate: ${completionRate}%`);

    // FINAL SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('                      LINKING SUMMARY');
    console.log('='.repeat(80));

    console.log('\n✅ SUCCESSFUL LINKS:');
    console.log(`  • Poles: ${totalPoleLinks} of ${nokiaStats.unique_poles} (${poleLinkRate}%)`);
    console.log(`  • Drops: ${totalDropLinks} of ${nokiaStats.unique_drops} (${dropLinkRate}%)`);

    const matchedProperties = propertyLinking.find(p => p.link_status === 'Matched')?.count || 0;
    const propertyLinkRate = nokiaStats.unique_properties > 0
      ? ((matchedProperties / nokiaStats.unique_properties) * 100).toFixed(1)
      : 0;
    console.log(`  • Properties: ${matchedProperties} of ${nokiaStats.unique_properties} (${propertyLinkRate}%)`);

    console.log('\n📊 KEY METRICS:');
    console.log(`  • Installation Completion: ${completionRate}%`);
    console.log(`  • ONT Assignments: ${nokiaStats.with_ont}`);
    console.log(`  • Week Ending: ${nokiaStats.latest_week}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('  1. Review unmatched poles and drops for format issues');
    console.log('  2. Update grid view to show Nokia status');
    console.log('  3. Track weekly velocity trends');
    console.log('  4. Focus on properties with "Permission Granted" status');

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('Error analyzing Nokia linking:', error);
  }
}

// Run analysis
analyzeNokiaLinking();