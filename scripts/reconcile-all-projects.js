const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function reconcileAllProjects() {
  try {
    console.log('=== SOW LINKING RECONCILIATION FOR ALL PROJECTS ===\n');
    console.log(`Started: ${new Date().toISOString()}\n`);

    // Get all projects
    const projects = await sql`
      SELECT id, project_name FROM projects
      ORDER BY created_at DESC
    `;

    console.log(`Found ${projects.length} projects to reconcile:\n`);
    projects.forEach(p => console.log(`  - ${p.project_name} (${p.id})`));
    console.log('');

    // Create mapping table if it doesn't exist
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

    // Create index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_mapping_project_poles
      ON sow_onemap_mapping(project_id, sow_pole_number, onemap_pole_number)
    `;

    const summaryResults = [];

    // Process each project
    for (const project of projects) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Processing: ${project.project_name}`);
      console.log(`${'='.repeat(50)}\n`);

      const projectStats = {
        projectId: project.id,
        projectName: project.project_name,
        totalSowPoles: 0,
        totalOneMapRecords: 0,
        numericMatches: 0,
        proximityMatches: 0,
        totalMapped: 0
      };

      try {
        // Count SOW poles for this project
        const [sowCount] = await sql`
          SELECT COUNT(*) as count FROM sow_poles
          WHERE project_id = ${project.id}
        `;
        projectStats.totalSowPoles = parseInt(sowCount.count);

        if (projectStats.totalSowPoles === 0) {
          console.log(`⚠️ No SOW poles found for ${project.project_name}`);
          summaryResults.push(projectStats);
          continue;
        }

        // Strategy 1: Match by numeric suffix with optimized query
        console.log('Matching by numeric suffix...');
        const numericInsertResult = await sql`
          WITH matches AS (
            SELECT DISTINCT ON (sp.pole_number)
              sp.pole_number as sow_pole,
              op.pole_number as onemap_pole,
              CASE
                WHEN ABS(sp.latitude - op.latitude::numeric) < 0.0001
                 AND ABS(sp.longitude - op.longitude::numeric) < 0.0001
                THEN 0.95
                WHEN ABS(sp.latitude - op.latitude::numeric) < 0.001
                 AND ABS(sp.longitude - op.longitude::numeric) < 0.001
                THEN 0.75
                ELSE 0.5
              END as confidence
            FROM sow_poles sp
            CROSS JOIN onemap_properties op
            WHERE sp.project_id = ${project.id}
              AND substring(sp.pole_number from '\\d+$') IS NOT NULL
              AND substring(sp.pole_number from '\\d+$') = substring(op.pole_number from '\\d+$')
            ORDER BY sp.pole_number,
                     ABS(sp.latitude - op.latitude::numeric) + ABS(sp.longitude - op.longitude::numeric)
          )
          INSERT INTO sow_onemap_mapping (
            project_id, sow_pole_number, onemap_pole_number,
            match_type, confidence_score
          )
          SELECT
            ${project.id}, sow_pole, onemap_pole,
            'numeric_suffix', confidence
          FROM matches
          ON CONFLICT (project_id, sow_pole_number, onemap_pole_number)
          DO UPDATE SET
            confidence_score = GREATEST(EXCLUDED.confidence_score, sow_onemap_mapping.confidence_score),
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        projectStats.numericMatches = numericInsertResult.length;
        console.log(`✅ Created ${projectStats.numericMatches} numeric suffix matches`);

        // Strategy 2: Proximity matching (within 30 meters) for unmapped poles
        console.log('Matching by proximity...');
        const proximityInsertResult = await sql`
          WITH unmatched_sow AS (
            SELECT sp.*
            FROM sow_poles sp
            WHERE sp.project_id = ${project.id}
              AND NOT EXISTS (
                SELECT 1 FROM sow_onemap_mapping m
                WHERE m.project_id = ${project.id}
                  AND m.sow_pole_number = sp.pole_number
              )
          ),
          proximity_matches AS (
            SELECT DISTINCT ON (us.pole_number)
              us.pole_number as sow_pole,
              op.pole_number as onemap_pole,
              SQRT(
                POWER((us.latitude - op.latitude::numeric) * 111320, 2) +
                POWER((us.longitude - op.longitude::numeric) * 111320 * COS(RADIANS(us.latitude)), 2)
              ) as distance_meters
            FROM unmatched_sow us
            CROSS JOIN onemap_properties op
            WHERE us.latitude IS NOT NULL
              AND op.latitude IS NOT NULL
              AND ABS(us.latitude - op.latitude::numeric) < 0.0003  -- ~30m latitude
              AND ABS(us.longitude - op.longitude::numeric) < 0.0003 -- ~30m longitude
            ORDER BY us.pole_number,
                     SQRT(
                       POWER((us.latitude - op.latitude::numeric) * 111320, 2) +
                       POWER((us.longitude - op.longitude::numeric) * 111320 * COS(RADIANS(us.latitude)), 2)
                     )
          )
          INSERT INTO sow_onemap_mapping (
            project_id, sow_pole_number, onemap_pole_number,
            match_type, confidence_score, distance_meters
          )
          SELECT
            ${project.id}, sow_pole, onemap_pole,
            'proximity',
            CASE
              WHEN distance_meters < 5 THEN 0.9
              WHEN distance_meters < 10 THEN 0.8
              WHEN distance_meters < 20 THEN 0.7
              ELSE 0.6
            END,
            distance_meters
          FROM proximity_matches
          WHERE distance_meters <= 30
          ON CONFLICT (project_id, sow_pole_number, onemap_pole_number) DO NOTHING
          RETURNING id
        `;
        projectStats.proximityMatches = proximityInsertResult.length;
        console.log(`✅ Created ${projectStats.proximityMatches} proximity matches`);

        // Get total mapped count
        const [mappedCount] = await sql`
          SELECT COUNT(DISTINCT sow_pole_number) as count
          FROM sow_onemap_mapping
          WHERE project_id = ${project.id}
        `;
        projectStats.totalMapped = parseInt(mappedCount.count);

        // Get OneMap count
        const [oneMapCount] = await sql`
          SELECT COUNT(DISTINCT pole_number) as count
          FROM onemap_properties
          WHERE pole_number IS NOT NULL
        `;
        projectStats.totalOneMapRecords = parseInt(oneMapCount.count);

        summaryResults.push(projectStats);

        console.log(`\n📊 Project Summary:`);
        console.log(`  Total SOW Poles: ${projectStats.totalSowPoles}`);
        console.log(`  Mapped Poles: ${projectStats.totalMapped} (${((projectStats.totalMapped / projectStats.totalSowPoles) * 100).toFixed(1)}%)`);
        console.log(`  - Numeric Matches: ${projectStats.numericMatches}`);
        console.log(`  - Proximity Matches: ${projectStats.proximityMatches}`);

      } catch (error) {
        console.error(`❌ Error processing ${project.project_name}:`, error.message);
        summaryResults.push(projectStats);
      }
    }

    // Print overall summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('OVERALL RECONCILIATION SUMMARY');
    console.log(`${'='.repeat(50)}\n`);

    let totalSow = 0, totalMapped = 0;
    summaryResults.forEach(stat => {
      totalSow += stat.totalSowPoles;
      totalMapped += stat.totalMapped;
      const percentage = stat.totalSowPoles > 0
        ? ((stat.totalMapped / stat.totalSowPoles) * 100).toFixed(1)
        : '0.0';
      console.log(`${stat.projectName}:`);
      console.log(`  ${stat.totalMapped}/${stat.totalSowPoles} poles mapped (${percentage}%)`);
    });

    console.log(`\n🎯 Grand Total: ${totalMapped}/${totalSow} poles mapped across all projects`);
    if (totalSow > 0) {
      console.log(`📈 Overall Linking Rate: ${((totalMapped / totalSow) * 100).toFixed(1)}%`);
    }

    // Show sample high-confidence matches
    console.log(`\n${'='.repeat(50)}`);
    console.log('HIGH CONFIDENCE MATCHES (Sample)');
    console.log(`${'='.repeat(50)}\n`);

    const highConfidenceMatches = await sql`
      SELECT
        p.project_name,
        m.sow_pole_number,
        m.onemap_pole_number,
        m.match_type,
        m.confidence_score,
        m.distance_meters
      FROM sow_onemap_mapping m
      JOIN projects p ON m.project_id = p.id
      WHERE m.confidence_score >= 0.9
      ORDER BY m.confidence_score DESC, m.distance_meters ASC NULLS LAST
      LIMIT 10
    `;

    highConfidenceMatches.forEach(match => {
      console.log(`✅ ${match.project_name}: ${match.sow_pole_number} ↔ ${match.onemap_pole_number}`);
      console.log(`   Type: ${match.match_type}, Confidence: ${(match.confidence_score * 100).toFixed(0)}%`);
      if (match.distance_meters) {
        console.log(`   Distance: ${match.distance_meters.toFixed(1)}m`);
      }
    });

    console.log(`\n✅ Reconciliation completed at ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('Fatal error during reconciliation:', error);
  }
}

// Run the reconciliation
reconcileAllProjects();