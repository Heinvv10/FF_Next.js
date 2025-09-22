const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function generateLouissep15Report() {
  try {
    console.log('='.repeat(70));
    console.log('        LOUISSEP15 PROJECT - FINAL LINKING REPORT');
    console.log('='.repeat(70));
    console.log(`Generated: ${new Date().toISOString()}\n`);

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501';

    // 1. PROJECT DATA SUMMARY
    console.log('📊 PROJECT DATA SUMMARY');
    console.log('-'.repeat(50));

    const [sowStats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM sow_poles WHERE project_id = ${projectId}) as total_poles,
        (SELECT COUNT(*) FROM sow_drops WHERE project_id = ${projectId}) as total_drops,
        (SELECT COUNT(*) FROM sow_fibre WHERE project_id = ${projectId}) as total_fibre
    `;

    console.log(`SOW Poles: ${sowStats.total_poles}`);
    console.log(`SOW Drops: ${sowStats.total_drops}`);
    console.log(`SOW Fibre: ${sowStats.total_fibre}\n`);

    // 2. POLE LINKING STATUS
    console.log('🔗 POLE LINKING STATUS');
    console.log('-'.repeat(50));

    // Check direct matches
    const [directPoleMatches] = await sql`
      SELECT COUNT(DISTINCT sp.pole_number) as count
      FROM sow_poles sp
      INNER JOIN onemap_properties op ON sp.pole_number = op.pole_number
      WHERE sp.project_id = ${projectId}
    `;

    // Check mapping table matches
    const [mappedPoles] = await sql`
      SELECT
        COUNT(DISTINCT sow_pole_number) as mapped_count,
        AVG(confidence_score) as avg_confidence
      FROM sow_onemap_mapping
      WHERE project_id = ${projectId}
    `;

    // Check unmatched poles
    const [unmatchedPoles] = await sql`
      SELECT COUNT(*) as count
      FROM sow_poles sp
      WHERE sp.project_id = ${projectId}
        AND NOT EXISTS (
          SELECT 1 FROM onemap_properties op
          WHERE sp.pole_number = op.pole_number
        )
        AND NOT EXISTS (
          SELECT 1 FROM sow_onemap_mapping m
          WHERE m.sow_pole_number = sp.pole_number
          AND m.project_id = ${projectId}
        )
    `;

    console.log(`Total SOW Poles: ${sowStats.total_poles}`);
    console.log(`✅ Direct Matches: ${directPoleMatches.count}`);
    console.log(`✅ Mapped via Table: ${mappedPoles.mapped_count}`);
    console.log(`❌ Unmatched: ${unmatchedPoles.count}`);
    console.log(`Average Confidence: ${mappedPoles.avg_confidence ? (mappedPoles.avg_confidence * 100).toFixed(1) + '%' : 'N/A'}`);

    const poleLinkingRate = ((directPoleMatches.count + mappedPoles.mapped_count) / sowStats.total_poles * 100).toFixed(1);
    console.log(`\n📈 POLE LINKING RATE: ${poleLinkingRate}%\n`);

    // 3. DROP LINKING STATUS
    console.log('💧 DROP LINKING STATUS');
    console.log('-'.repeat(50));

    const [dropMatches] = await sql`
      SELECT
        COUNT(DISTINCT sd.drop_number) as matched_drops,
        COUNT(DISTINCT op.property_id) as linked_properties
      FROM sow_drops sd
      INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
      WHERE sd.project_id = ${projectId}
    `;

    const [unmatchedDrops] = await sql`
      SELECT COUNT(DISTINCT drop_number) as count
      FROM sow_drops sd
      WHERE sd.project_id = ${projectId}
        AND NOT EXISTS (
          SELECT 1 FROM onemap_properties op
          WHERE sd.drop_number = op.drop_number
        )
    `;

    console.log(`Total SOW Drops: ${sowStats.total_drops}`);
    console.log(`✅ Matched Drops: ${dropMatches.matched_drops}`);
    console.log(`✅ Linked to Properties: ${dropMatches.linked_properties}`);
    console.log(`❌ Unmatched: ${unmatchedDrops.count}`);

    const dropLinkingRate = (dropMatches.matched_drops / sowStats.total_drops * 100).toFixed(1);
    console.log(`\n📈 DROP LINKING RATE: ${dropLinkingRate}%\n`);

    // 4. SAMPLE LINKED DATA
    console.log('📝 SAMPLE LINKED DATA');
    console.log('-'.repeat(50));

    console.log('\nPole Matches (Top 5):');
    const poleSamples = await sql`
      SELECT
        sp.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        op.property_id,
        op.location_address
      FROM sow_poles sp
      INNER JOIN onemap_properties op ON sp.pole_number = op.pole_number
      WHERE sp.project_id = ${projectId}
      LIMIT 5
    `;

    poleSamples.forEach(s => {
      console.log(`  ${s.sow_pole} ↔ ${s.onemap_pole}`);
      console.log(`    Property: ${s.property_id}, Address: ${s.location_address || 'N/A'}`);
    });

    console.log('\nDrop Matches (Top 5):');
    const dropSamples = await sql`
      SELECT
        sd.drop_number,
        sd.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        op.property_id,
        op.contact_name
      FROM sow_drops sd
      INNER JOIN onemap_properties op ON sd.drop_number = op.drop_number
      WHERE sd.project_id = ${projectId}
      LIMIT 5
    `;

    dropSamples.forEach(s => {
      console.log(`  Drop ${s.drop_number}`);
      console.log(`    SOW Pole: ${s.sow_pole}, OneMap Pole: ${s.onemap_pole || 'N/A'}`);
      console.log(`    Property: ${s.property_id}, Contact: ${s.contact_name || 'N/A'}`);
    });

    // 5. WHAT COULDN'T BE LINKED
    console.log('\n\n⚠️ UNLINKED DATA ANALYSIS');
    console.log('-'.repeat(50));

    // Sample unmatched poles
    const unmatchedPoleSamples = await sql`
      SELECT pole_number, status, latitude, longitude
      FROM sow_poles sp
      WHERE sp.project_id = ${projectId}
        AND NOT EXISTS (
          SELECT 1 FROM onemap_properties op
          WHERE sp.pole_number = op.pole_number
        )
        AND NOT EXISTS (
          SELECT 1 FROM sow_onemap_mapping m
          WHERE m.sow_pole_number = sp.pole_number
          AND m.project_id = ${projectId}
        )
      LIMIT 5
    `;

    if (unmatchedPoleSamples.length > 0) {
      console.log('\nUnmatched Poles (Sample):');
      unmatchedPoleSamples.forEach(p => {
        console.log(`  ${p.pole_number} - Status: ${p.status || 'N/A'}`);
        if (p.latitude && p.longitude) {
          console.log(`    GPS: ${p.latitude}, ${p.longitude}`);
        }
      });
    } else {
      console.log('✅ All poles have been linked!');
    }

    // Sample unmatched drops
    const unmatchedDropSamples = await sql`
      SELECT drop_number, pole_number, cable_type
      FROM sow_drops sd
      WHERE sd.project_id = ${projectId}
        AND NOT EXISTS (
          SELECT 1 FROM onemap_properties op
          WHERE sd.drop_number = op.drop_number
        )
      LIMIT 5
    `;

    if (unmatchedDropSamples.length > 0) {
      console.log('\nUnmatched Drops (Sample):');
      unmatchedDropSamples.forEach(d => {
        console.log(`  ${d.drop_number} from pole ${d.pole_number}`);
      });
    }

    // 6. FINAL SUMMARY
    console.log('\n\n');
    console.log('='.repeat(70));
    console.log('                        FINAL SUMMARY');
    console.log('='.repeat(70));

    console.log('\n✅ LINKING ACHIEVED:');
    console.log(`  • Poles: ${directPoleMatches.count + mappedPoles.mapped_count}/${sowStats.total_poles} (${poleLinkingRate}%)`);
    console.log(`  • Drops: ${dropMatches.matched_drops}/${sowStats.total_drops} (${dropLinkingRate}%)`);

    console.log('\n📊 OVERALL STATUS:');
    if (parseFloat(poleLinkingRate) === 100 && parseFloat(dropLinkingRate) > 50) {
      console.log('  ✅ EXCELLENT - All poles linked, majority of drops linked');
    } else if (parseFloat(poleLinkingRate) > 90) {
      console.log('  ✅ VERY GOOD - Most data successfully linked');
    } else if (parseFloat(poleLinkingRate) > 70) {
      console.log('  ⚠️ GOOD - Significant linking achieved, some gaps remain');
    } else {
      console.log('  ❌ NEEDS ATTENTION - Low linking rate');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('Error generating report:', error);
  }
}

generateLouissep15Report();