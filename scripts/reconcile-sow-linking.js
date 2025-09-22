const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function reconcileSowLinking() {
  try {
    console.log('=== SOW LINKING RECONCILIATION ===\n');
    console.log('This script will create a mapping table to link SOW poles with OneMap field data\n');

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

    // Step 1: Create a mapping table if it doesn't exist
    console.log('Step 1: Creating mapping table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sow_onemap_mapping (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL,
        sow_pole_number VARCHAR(255),
        onemap_pole_number VARCHAR(255),
        match_type VARCHAR(50),
        confidence_score NUMERIC(3,2),
        distance_meters NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, sow_pole_number, onemap_pole_number)
      )
    `;
    console.log('✅ Mapping table ready\n');

    // Step 2: Find matches using multiple strategies
    console.log('Step 2: Finding pole matches...\n');

    // Strategy 1: Extract numeric suffixes and match
    console.log('Strategy 1: Matching by numeric suffix...');
    const numericMatches = await sql`
      WITH sow_parsed AS (
        SELECT
          pole_number,
          CASE
            WHEN pole_number ~ '\\d+$'
            THEN substring(pole_number from '\\d+$')::integer
            ELSE NULL
          END as pole_num,
          latitude,
          longitude
        FROM sow_poles
        WHERE project_id = ${projectId}
          AND pole_number IS NOT NULL
      ),
      onemap_parsed AS (
        SELECT
          pole_number,
          CASE
            WHEN pole_number ~ '\\d+$'
            THEN substring(pole_number from '\\d+$')::integer
            ELSE NULL
          END as pole_num,
          latitude,
          longitude
        FROM onemap_properties
        WHERE pole_number IS NOT NULL
      )
      SELECT
        sp.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        sp.pole_num,
        ABS(sp.latitude - op.latitude::numeric) as lat_diff,
        ABS(sp.longitude - op.longitude::numeric) as lng_diff
      FROM sow_parsed sp
      INNER JOIN onemap_parsed op ON sp.pole_num = op.pole_num
      WHERE sp.pole_num IS NOT NULL
        AND op.pole_num IS NOT NULL
      ORDER BY sp.pole_num, ABS(sp.latitude - op.latitude::numeric) + ABS(sp.longitude - op.longitude::numeric)
    `;

    console.log(`Found ${numericMatches.length} potential numeric matches`);

    // Insert numeric matches into mapping table
    let inserted = 0;
    for (const match of numericMatches) {
      try {
        await sql`
          INSERT INTO sow_onemap_mapping (
            project_id,
            sow_pole_number,
            onemap_pole_number,
            match_type,
            confidence_score
          ) VALUES (
            ${projectId},
            ${match.sow_pole},
            ${match.onemap_pole},
            'numeric_suffix',
            ${match.lat_diff < 0.001 && match.lng_diff < 0.001 ? 0.9 : 0.5}
          )
          ON CONFLICT (project_id, sow_pole_number, onemap_pole_number)
          DO UPDATE SET
            match_type = EXCLUDED.match_type,
            confidence_score = EXCLUDED.confidence_score,
            updated_at = CURRENT_TIMESTAMP
        `;
        inserted++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`✅ Inserted ${inserted} numeric matches\n`);

    // Strategy 2: Proximity matching (within 50 meters)
    console.log('Strategy 2: Matching by proximity...');
    const proximityMatches = await sql`
      SELECT DISTINCT ON (sp.pole_number)
        sp.pole_number as sow_pole,
        op.pole_number as onemap_pole,
        SQRT(
          POWER((sp.latitude - op.latitude::numeric) * 111000, 2) +
          POWER((sp.longitude - op.longitude::numeric) * 111000, 2)
        ) as distance_meters
      FROM sow_poles sp
      CROSS JOIN onemap_properties op
      WHERE sp.project_id = ${projectId}
        AND sp.latitude IS NOT NULL
        AND op.latitude IS NOT NULL
        AND ABS(sp.latitude - op.latitude::numeric) < 0.0005  -- ~50m
        AND ABS(sp.longitude - op.longitude::numeric) < 0.0005
        AND NOT EXISTS (
          SELECT 1 FROM sow_onemap_mapping m
          WHERE m.project_id = ${projectId}
            AND m.sow_pole_number = sp.pole_number
        )
      ORDER BY sp.pole_number, distance_meters
    `;

    console.log(`Found ${proximityMatches.length} proximity matches`);

    // Insert proximity matches
    inserted = 0;
    for (const match of proximityMatches) {
      if (match.distance_meters <= 50) {
        try {
          await sql`
            INSERT INTO sow_onemap_mapping (
              project_id,
              sow_pole_number,
              onemap_pole_number,
              match_type,
              confidence_score,
              distance_meters
            ) VALUES (
              ${projectId},
              ${match.sow_pole},
              ${match.onemap_pole},
              'proximity',
              ${match.distance_meters < 10 ? 0.8 : 0.6},
              ${match.distance_meters}
            )
            ON CONFLICT (project_id, sow_pole_number, onemap_pole_number)
            DO NOTHING
          `;
          inserted++;
        } catch (e) {
          // Skip errors
        }
      }
    }
    console.log(`✅ Inserted ${inserted} proximity matches\n`);

    // Step 3: Show summary
    console.log('Step 3: Reconciliation Summary');
    console.log('===============================\n');

    const summary = await sql`
      SELECT
        match_type,
        COUNT(*) as count,
        AVG(confidence_score) as avg_confidence,
        MIN(distance_meters) as min_distance,
        MAX(distance_meters) as max_distance
      FROM sow_onemap_mapping
      WHERE project_id = ${projectId}
      GROUP BY match_type
    `;

    console.log('Match Type Summary:');
    summary.forEach(row => {
      console.log(`  ${row.match_type}: ${row.count} matches`);
      console.log(`    Avg Confidence: ${(row.avg_confidence * 100).toFixed(1)}%`);
      if (row.min_distance) {
        console.log(`    Distance Range: ${row.min_distance.toFixed(1)}m - ${row.max_distance.toFixed(1)}m`);
      }
    });

    // Overall stats
    const [totalStats] = await sql`
      SELECT
        (SELECT COUNT(DISTINCT pole_number) FROM sow_poles WHERE project_id = ${projectId}) as total_sow,
        (SELECT COUNT(DISTINCT pole_number) FROM onemap_properties WHERE pole_number IS NOT NULL) as total_onemap,
        (SELECT COUNT(DISTINCT sow_pole_number) FROM sow_onemap_mapping WHERE project_id = ${projectId}) as mapped_sow,
        (SELECT COUNT(DISTINCT onemap_pole_number) FROM sow_onemap_mapping WHERE project_id = ${projectId}) as mapped_onemap
    `;

    console.log('\nOverall Statistics:');
    console.log(`  Total SOW Poles: ${totalStats.total_sow}`);
    console.log(`  Total OneMap Poles: ${totalStats.total_onemap}`);
    console.log(`  Mapped SOW Poles: ${totalStats.mapped_sow} (${((totalStats.mapped_sow / totalStats.total_sow) * 100).toFixed(1)}%)`);
    console.log(`  Mapped OneMap Records: ${totalStats.mapped_onemap}`);

    // Show sample mappings
    console.log('\nSample Mappings (High Confidence):');
    const samples = await sql`
      SELECT
        sow_pole_number,
        onemap_pole_number,
        match_type,
        confidence_score,
        distance_meters
      FROM sow_onemap_mapping
      WHERE project_id = ${projectId}
        AND confidence_score >= 0.8
      ORDER BY confidence_score DESC
      LIMIT 5
    `;

    samples.forEach(sample => {
      console.log(`  ${sample.sow_pole_number} <-> ${sample.onemap_pole_number}`);
      console.log(`    Type: ${sample.match_type}, Confidence: ${(sample.confidence_score * 100).toFixed(0)}%`);
      if (sample.distance_meters) {
        console.log(`    Distance: ${sample.distance_meters.toFixed(1)}m`);
      }
    });

    console.log('\n✅ Reconciliation Complete!');
    console.log('The mapping table can now be used to link SOW and OneMap data.\n');

  } catch (error) {
    console.error('Error during reconciliation:', error);
  }
}

// Run the reconciliation
reconcileSowLinking();