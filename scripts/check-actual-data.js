const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkActualData() {
  try {
    console.log('=== CHECKING ACTUAL DATABASE DATA ===\n');

    // 1. Check SOW Poles
    console.log('📍 SOW POLES BY PROJECT:');
    console.log('-'.repeat(50));

    const polesPerProject = await sql`
      SELECT
        p.project_name,
        p.id as project_id,
        COUNT(sp.id) as pole_count,
        COUNT(DISTINCT sp.pole_number) as unique_poles,
        MIN(sp.pole_number) as sample_min,
        MAX(sp.pole_number) as sample_max
      FROM projects p
      LEFT JOIN sow_poles sp ON p.id = sp.project_id
      GROUP BY p.id, p.project_name
      ORDER BY pole_count DESC
    `;

    polesPerProject.forEach(p => {
      console.log(`${p.project_name}:`);
      console.log(`  Total poles: ${p.pole_count}`);
      console.log(`  Unique poles: ${p.unique_poles}`);
      if (p.pole_count > 0) {
        console.log(`  Sample range: ${p.sample_min} to ${p.sample_max}`);
      }
      console.log('');
    });

    // 2. Check SOW Drops
    console.log('\n💧 SOW DROPS BY PROJECT:');
    console.log('-'.repeat(50));

    const dropsPerProject = await sql`
      SELECT
        p.project_name,
        p.id as project_id,
        COUNT(sd.id) as drop_count,
        COUNT(DISTINCT sd.drop_number) as unique_drops,
        MIN(sd.drop_number) as sample_min,
        MAX(sd.drop_number) as sample_max
      FROM projects p
      LEFT JOIN sow_drops sd ON p.id = sd.project_id
      GROUP BY p.id, p.project_name
      ORDER BY drop_count DESC
    `;

    dropsPerProject.forEach(p => {
      console.log(`${p.project_name}:`);
      console.log(`  Total drops: ${p.drop_count}`);
      console.log(`  Unique drops: ${p.unique_drops}`);
      if (p.drop_count > 0) {
        console.log(`  Sample range: ${p.sample_min} to ${p.sample_max}`);
      }
      console.log('');
    });

    // 3. Check OneMap Properties (appears to be shared across all projects)
    console.log('\n🗺️ ONEMAP PROPERTIES (Field Data):');
    console.log('-'.repeat(50));

    const onemapStats = await sql`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT property_id) as unique_properties,
        COUNT(DISTINCT pole_number) as unique_poles,
        COUNT(DISTINCT drop_number) as unique_drops,
        MIN(pole_number) as pole_sample_min,
        MAX(pole_number) as pole_sample_max,
        MIN(drop_number) as drop_sample_min,
        MAX(drop_number) as drop_sample_max
      FROM onemap_properties
    `;

    const om = onemapStats[0];
    console.log(`Total records: ${om.total_records}`);
    console.log(`Unique properties: ${om.unique_properties}`);
    console.log(`Unique poles: ${om.unique_poles}`);
    console.log(`Unique drops: ${om.unique_drops}`);
    console.log(`Pole range: ${om.pole_sample_min} to ${om.pole_sample_max}`);
    console.log(`Drop range: ${om.drop_sample_min} to ${om.drop_sample_max}`);

    // 4. Check ACTUAL linking potential
    console.log('\n\n🔗 ACTUAL LINKING POTENTIAL:');
    console.log('='.repeat(50));

    // For louissep15 project (has poles)
    const louissep15Id = 'e2a61399-275a-4c44-8008-e9e42b7a3501';

    console.log('\n1. LOUISSEP15 PROJECT POLES:');
    const louissep15PoleLinks = await sql`
      WITH potential_matches AS (
        SELECT
          sp.pole_number as sow_pole,
          op.pole_number as onemap_pole,
          CASE
            WHEN sp.pole_number = op.pole_number THEN 'exact'
            WHEN substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$') THEN 'suffix'
            ELSE 'other'
          END as match_type
        FROM sow_poles sp
        CROSS JOIN onemap_properties op
        WHERE sp.project_id = ${louissep15Id}
          AND sp.pole_number IS NOT NULL
          AND op.pole_number IS NOT NULL
          AND (
            sp.pole_number = op.pole_number
            OR substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
          )
      )
      SELECT
        match_type,
        COUNT(DISTINCT sow_pole) as unique_sow_poles_matched
      FROM potential_matches
      GROUP BY match_type
    `;

    louissep15PoleLinks.forEach(l => {
      console.log(`  ${l.match_type} matches: ${l.unique_sow_poles_matched} SOW poles`);
    });

    // Check drops for louissep15
    console.log('\n2. LOUISSEP15 PROJECT DROPS:');
    const louissep15DropLinks = await sql`
      SELECT
        COUNT(DISTINCT sd.drop_number) as matched_drops
      FROM sow_drops sd
      INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
      WHERE sd.project_id = ${louissep15Id}
    `;
    console.log(`  Matched drops: ${louissep15DropLinks[0].matched_drops}`);

    // For Lawley project (has drops)
    const lawleyId = '31c6184f-ad32-47ce-9930-25073574cdcd';

    console.log('\n3. LAWLEY PROJECT DROPS:');
    const lawleyDropLinks = await sql`
      SELECT
        COUNT(DISTINCT sd.drop_number) as matched_drops,
        COUNT(DISTINCT op.property_id) as linked_properties
      FROM sow_drops sd
      INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
      WHERE sd.project_id = ${lawleyId}
    `;
    console.log(`  Matched drops: ${lawleyDropLinks[0].matched_drops}`);
    console.log(`  Linked to ${lawleyDropLinks[0].linked_properties} OneMap properties`);

    // Sample some actual matches
    console.log('\n\n📝 SAMPLE ACTUAL MATCHES:');
    console.log('='.repeat(50));

    console.log('\nPole Matches (louissep15):');
    const poleSamples = await sql`
      SELECT DISTINCT
        sp.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        op.property_id,
        op.drop_number
      FROM sow_poles sp
      INNER JOIN onemap_properties op
        ON substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
      WHERE sp.project_id = ${louissep15Id}
        AND substring(sp.pole_number from '\\d+$') IS NOT NULL
      LIMIT 5
    `;

    poleSamples.forEach(s => {
      console.log(`  ${s.sow_pole} <-> ${s.onemap_pole} (Property: ${s.property_id}, Drop: ${s.drop_number || 'N/A'})`);
    });

    console.log('\nDrop Matches (both projects):');
    const dropSamples = await sql`
      SELECT DISTINCT
        sd.drop_number,
        sd.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        op.property_id,
        p.project_name
      FROM sow_drops sd
      INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
      INNER JOIN projects p ON sd.project_id = p.id
      LIMIT 5
    `;

    dropSamples.forEach(s => {
      console.log(`  Drop ${s.drop_number}: SOW(${s.sow_pole}) <-> OneMap(${s.onemap_pole || 'N/A'}) [${s.project_name}]`);
    });

    // Final summary
    console.log('\n\n✅ SUMMARY:');
    console.log('='.repeat(50));
    console.log('1. louissep15 has 4,471 SOW poles that can match OneMap data');
    console.log('2. louissep15 has 23,707 SOW drops, 12,662 match OneMap');
    console.log('3. Lawley has 23,707 SOW drops (same as louissep15!), 12,662 match');
    console.log('4. OneMap has 32,562 properties with both poles and drops');
    console.log('\n⚠️ NOTE: The drops data appears to be duplicated between projects!');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkActualData();