const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function testEnhancedLinking() {
  try {
    console.log('=== TESTING ENHANCED SOW LINKING ===\n');

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

    // Test the normalized matching
    console.log('🔧 Testing Normalization Logic:');
    console.log('================================\n');

    // Test regex patterns
    const testCases = [
      'LAW.P.A001',
      'LAW.P.D524',
      'LAW.P.B850',
      'VF079',
      'TEST.P.123'
    ];

    for (const testCase of testCases) {
      const result = await sql`
        SELECT
          ${testCase} as original,
          CASE
            WHEN ${testCase} ~ '^.*\\.P\\.[A-Z]\\d+$'
            THEN regexp_replace(${testCase}, '^(.*\\.P\\.)[A-Z](\\d+)$', '\\1\\2')
            ELSE ${testCase}
          END as normalized
      `;
      console.log(`${result[0].original} -> ${result[0].normalized}`);
    }

    console.log('\n📊 Testing Enhanced Matching:');
    console.log('==============================\n');

    // Run the enhanced matching query
    const enhancedResults = await sql`
      WITH normalized_sow AS (
        SELECT
          *,
          CASE
            WHEN pole_number ~ '^.*\.P\.[A-Z]\d+$'
            THEN regexp_replace(pole_number, '^(.*\.P\.)[A-Z](\d+)$', '\1\2')
            ELSE pole_number
          END as normalized_pole
        FROM sow_poles
        WHERE project_id = ${projectId}
      ),
      normalized_onemap AS (
        SELECT
          *,
          CASE
            WHEN pole_number ~ '^.*\.P\.[A-Z]\d+$'
            THEN regexp_replace(pole_number, '^(.*\.P\.)[A-Z](\d+)$', '\1\2')
            ELSE pole_number
          END as normalized_pole
        FROM onemap_properties
        WHERE pole_number IS NOT NULL
      )
      SELECT
        op.property_id,
        op.pole_number as onemap_pole,
        op.normalized_pole as onemap_normalized,
        COALESCE(sp1.pole_number, sp2.pole_number, sp3.pole_number) as matched_sow_pole,
        CASE
          WHEN sp1.pole_number IS NOT NULL THEN 'exact'
          WHEN sp2.pole_number IS NOT NULL THEN 'normalized'
          WHEN sp3.pole_number IS NOT NULL THEN 'proximity'
          ELSE NULL
        END as match_type
      FROM normalized_onemap op
      -- Exact match
      LEFT JOIN sow_poles sp1
        ON op.pole_number = sp1.pole_number
        AND sp1.project_id = ${projectId}
      -- Normalized match
      LEFT JOIN normalized_sow sp2
        ON op.normalized_pole = sp2.normalized_pole
        AND sp2.project_id = ${projectId}
        AND sp1.pole_number IS NULL
      -- Location proximity match
      LEFT JOIN sow_poles sp3
        ON op.latitude IS NOT NULL
        AND sp3.latitude IS NOT NULL
        AND ABS(op.latitude::numeric - sp3.latitude) < 0.0001
        AND ABS(op.longitude::numeric - sp3.longitude) < 0.0001
        AND sp3.project_id = ${projectId}
        AND sp1.pole_number IS NULL
        AND sp2.pole_number IS NULL
      WHERE matched_sow_pole IS NOT NULL
      LIMIT 10
    `;

    if (enhancedResults.length > 0) {
      console.log('✅ SUCCESSFUL MATCHES FOUND:\n');
      enhancedResults.forEach((match, idx) => {
        console.log(`Match ${idx + 1}:`);
        console.log(`  Property: ${match.property_id}`);
        console.log(`  OneMap Pole: ${match.onemap_pole}`);
        console.log(`  Normalized: ${match.onemap_normalized}`);
        console.log(`  SOW Match: ${match.matched_sow_pole}`);
        console.log(`  Match Type: ${match.match_type}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No matches found with enhanced logic\n');
    }

    // Check for potential proximity matches
    console.log('📍 Checking Proximity Matches:');
    console.log('==============================\n');

    const proximityMatches = await sql`
      SELECT
        op.property_id,
        op.pole_number as onemap_pole,
        sp.pole_number as sow_pole,
        op.latitude as op_lat,
        op.longitude as op_lng,
        sp.latitude as sp_lat,
        sp.longitude as sp_lng,
        SQRT(
          POWER(op.latitude::numeric - sp.latitude, 2) +
          POWER(op.longitude::numeric - sp.longitude, 2)
        ) * 111 as distance_km
      FROM onemap_properties op
      CROSS JOIN sow_poles sp
      WHERE sp.project_id = ${projectId}
        AND op.latitude IS NOT NULL
        AND sp.latitude IS NOT NULL
        AND ABS(op.latitude::numeric - sp.latitude) < 0.001
        AND ABS(op.longitude::numeric - sp.longitude) < 0.001
      ORDER BY distance_km
      LIMIT 5
    `;

    if (proximityMatches.length > 0) {
      console.log('Found poles within ~100m of each other:');
      proximityMatches.forEach(match => {
        console.log(`  OneMap: ${match.onemap_pole} <-> SOW: ${match.sow_pole}`);
        console.log(`  Distance: ${(match.distance_km * 1000).toFixed(2)}m`);
        console.log('');
      });
    } else {
      console.log('No proximity matches found within 100m\n');
    }

    // Summary statistics
    console.log('📈 LINKING SUMMARY:');
    console.log('===================\n');

    const stats = await sql`
      WITH normalized_sow AS (
        SELECT
          *,
          CASE
            WHEN pole_number ~ '^.*\.P\.[A-Z]\d+$'
            THEN regexp_replace(pole_number, '^(.*\.P\.)[A-Z](\d+)$', '\1\2')
            ELSE pole_number
          END as normalized_pole
        FROM sow_poles
        WHERE project_id = ${projectId}
      ),
      normalized_onemap AS (
        SELECT
          *,
          CASE
            WHEN pole_number ~ '^.*\.P\.[A-Z]\d+$'
            THEN regexp_replace(pole_number, '^(.*\.P\.)[A-Z](\d+)$', '\1\2')
            ELSE pole_number
          END as normalized_pole
        FROM onemap_properties
      )
      SELECT
        COUNT(DISTINCT op.property_id) as total_onemap,
        COUNT(DISTINCT CASE WHEN sp1.pole_number IS NOT NULL THEN op.property_id END) as exact_matches,
        COUNT(DISTINCT CASE WHEN sp2.pole_number IS NOT NULL AND sp1.pole_number IS NULL THEN op.property_id END) as normalized_matches,
        COUNT(DISTINCT CASE WHEN sp3.pole_number IS NOT NULL AND sp1.pole_number IS NULL AND sp2.pole_number IS NULL THEN op.property_id END) as proximity_matches
      FROM normalized_onemap op
      LEFT JOIN sow_poles sp1
        ON op.pole_number = sp1.pole_number
        AND sp1.project_id = ${projectId}
      LEFT JOIN normalized_sow sp2
        ON op.normalized_pole = sp2.normalized_pole
        AND sp2.project_id = ${projectId}
      LEFT JOIN sow_poles sp3
        ON op.latitude IS NOT NULL
        AND sp3.latitude IS NOT NULL
        AND ABS(op.latitude::numeric - sp3.latitude) < 0.0001
        AND ABS(op.longitude::numeric - sp3.longitude) < 0.0001
        AND sp3.project_id = ${projectId}
    `;

    const stat = stats[0];
    console.log(`Total OneMap Records: ${stat.total_onemap}`);
    console.log(`Exact Matches: ${stat.exact_matches}`);
    console.log(`Normalized Matches: ${stat.normalized_matches}`);
    console.log(`Proximity Matches: ${stat.proximity_matches}`);

    const totalMatched = parseInt(stat.exact_matches) + parseInt(stat.normalized_matches) + parseInt(stat.proximity_matches);
    const matchRate = stat.total_onemap > 0 ? ((totalMatched / stat.total_onemap) * 100).toFixed(2) : 0;

    console.log(`\nTotal Matched: ${totalMatched} (${matchRate}%)`);

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testEnhancedLinking();