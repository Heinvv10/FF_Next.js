#!/usr/bin/env node
const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

// PostgreSQL connection using pg library
const pgConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

/**
 * Normalize pole numbers for better matching
 * Extracts base pattern and numeric suffix for flexible matching
 * @param {string} poleNumber - Original pole number
 * @returns {object} - Original and normalized pole numbers
 */
function normalizePoleNumber(poleNumber) {
  if (!poleNumber) return { original: null, normalized: null, numericSuffix: null };

  const original = poleNumber.trim();
  let normalized = original;
  let numericSuffix = null;

  // Extract numeric suffix (e.g., "001" from "LAW.P.A001")
  const numericMatch = original.match(/(\d+)$/);
  if (numericMatch) {
    numericSuffix = parseInt(numericMatch[1]);
  }

  // Normalize format: remove letter prefix from patterns like "LAW.P.A001" -> "LAW.P.001"
  const prefixMatch = original.match(/^(.*\.P\.)([A-Z])(\d+)$/);
  if (prefixMatch) {
    normalized = `${prefixMatch[1]}${prefixMatch[3]}`;
  }

  return {
    original,
    normalized,
    numericSuffix
  };
}

async function fastBatchImportNormalized(projectId, polesFile) {
  console.log('\n🚀 ENHANCED SOW IMPORT WITH POLE NORMALIZATION');
  console.log('=' .repeat(60));
  console.log(`Project: ${projectId}`);
  console.log(`Poles: ${path.basename(polesFile)}`);
  console.log('=' .repeat(60) + '\n');

  const client = new Client(pgConfig);

  try {
    await client.connect();
    console.log('✓ Connected to Neon Database\n');

    // Create normalized poles table if doesn't exist
    console.log('Creating normalized poles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sow_poles_normalized (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL,
        pole_number VARCHAR(255),
        pole_number_normalized VARCHAR(255),
        pole_number_suffix INTEGER,
        latitude NUMERIC(10,8),
        longitude NUMERIC(11,8),
        status VARCHAR(50),
        pole_type VARCHAR(100),
        pole_spec VARCHAR(100),
        height VARCHAR(50),
        diameter VARCHAR(50),
        owner VARCHAR(255),
        pon_no INTEGER,
        zone_no INTEGER,
        address TEXT,
        municipality VARCHAR(255),
        created_date TIMESTAMP,
        created_by VARCHAR(255),
        comments TEXT,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, pole_number)
      )
    `);

    // Create indexes for better matching performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sow_poles_normalized_suffix
      ON sow_poles_normalized(project_id, pole_number_suffix)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sow_poles_normalized_norm
      ON sow_poles_normalized(project_id, pole_number_normalized)
    `);

    console.log('✓ Normalized table ready\n');

    // Clear existing data for fresh import
    console.log('Clearing existing data for project...');
    await client.query(`DELETE FROM sow_poles WHERE project_id = $1`, [projectId]);
    await client.query(`DELETE FROM sow_poles_normalized WHERE project_id = $1`, [projectId]);
    console.log('✓ Cleared existing data\n');

    // IMPORT POLES WITH BATCH INSERT AND NORMALIZATION
    console.log('📍 IMPORTING POLES WITH NORMALIZATION...');
    const polesWB = XLSX.readFile(polesFile);
    const polesData = XLSX.utils.sheet_to_json(polesWB.Sheets[polesWB.SheetNames[0]]);

    console.log(`Total records in Excel: ${polesData.length}`);

    const BATCH_SIZE = 500;
    let polesImported = 0;
    let skipped = 0;
    const startTime = Date.now();

    // Track normalization statistics
    const normalizationStats = {
      exact: 0,
      normalized: 0,
      withSuffix: 0
    };

    // Process poles in batches
    for (let i = 0; i < polesData.length; i += BATCH_SIZE) {
      const batch = polesData.slice(i, i + BATCH_SIZE);

      // Prepare values for regular sow_poles table
      const regularValues = [];
      const regularPlaceholders = [];

      // Prepare values for normalized table
      const normalizedValues = [];
      const normalizedPlaceholders = [];

      let regularValueIndex = 1;
      let normalizedValueIndex = 1;

      batch.forEach((row) => {
        // Try different column names for pole number
        const rawPoleNumber = row.label_1 || row.Label_1 || row.pole_number || row['Pole Number'] || '';
        if (!rawPoleNumber) {
          skipped++;
          return;
        }

        // Normalize the pole number
        const { original, normalized, numericSuffix } = normalizePoleNumber(rawPoleNumber);

        // Track statistics
        if (original === normalized) {
          normalizationStats.exact++;
        } else {
          normalizationStats.normalized++;
        }
        if (numericSuffix !== null) {
          normalizationStats.withSuffix++;
        }

        // Common field values
        const lat = parseFloat(row.lat || row.Lat || row.latitude) || null;
        const lon = parseFloat(row.lon || row.Lon || row.longitude) || null;
        const status = row.status || row.Status || 'pending';
        const poleType = row.pole_type || null;
        const poleSpec = row.pole_spec || null;
        const height = row.height || null;
        const diameter = row.diameter || null;
        const owner = row.owner || row.cmpownr || null;
        const ponNo = row.pon_no || row['PON No'] || null;
        const zoneNo = row.zone_no || row['Zone No'] || null;
        const address = row.address || null;
        const municipality = row.municipality || null;
        const createdDate = row.created_date || row.datecrtd ? new Date(row.created_date || row.datecrtd) : null;
        const createdBy = row.created_by || row.cmpownr || null;
        const comments = row.comments || null;
        const rawData = JSON.stringify(row);

        // Insert into regular sow_poles table
        const regularRowPlaceholders = [];
        for (let j = 0; j < 18; j++) {
          regularRowPlaceholders.push(`$${regularValueIndex++}`);
        }
        regularPlaceholders.push(`(${regularRowPlaceholders.join(', ')})`);

        regularValues.push(
          projectId, original, lat, lon, status,
          poleType, poleSpec, height, diameter, owner,
          ponNo, zoneNo, address, municipality,
          createdDate, createdBy, comments, rawData
        );

        // Insert into normalized table
        const normalizedRowPlaceholders = [];
        for (let j = 0; j < 20; j++) {
          normalizedRowPlaceholders.push(`$${normalizedValueIndex++}`);
        }
        normalizedPlaceholders.push(`(${normalizedRowPlaceholders.join(', ')})`);

        normalizedValues.push(
          projectId, original, normalized, numericSuffix, lat, lon, status,
          poleType, poleSpec, height, diameter, owner,
          ponNo, zoneNo, address, municipality,
          createdDate, createdBy, comments, rawData
        );
      });

      // Insert into regular table
      if (regularPlaceholders.length > 0) {
        const regularQuery = `
          INSERT INTO sow_poles (
            project_id, pole_number, latitude, longitude, status,
            pole_type, pole_spec, height, diameter, owner,
            pon_no, zone_no, address, municipality,
            created_date, created_by, comments, raw_data
          ) VALUES ${regularPlaceholders.join(', ')}
          ON CONFLICT (project_id, pole_number) DO UPDATE SET
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            status = EXCLUDED.status,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(regularQuery, regularValues);

        // Insert into normalized table
        const normalizedQuery = `
          INSERT INTO sow_poles_normalized (
            project_id, pole_number, pole_number_normalized, pole_number_suffix,
            latitude, longitude, status, pole_type, pole_spec,
            height, diameter, owner, pon_no, zone_no,
            address, municipality, created_date, created_by, comments, raw_data
          ) VALUES ${normalizedPlaceholders.join(', ')}
          ON CONFLICT (project_id, pole_number) DO UPDATE SET
            pole_number_normalized = EXCLUDED.pole_number_normalized,
            pole_number_suffix = EXCLUDED.pole_number_suffix,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            status = EXCLUDED.status,
            raw_data = EXCLUDED.raw_data,
            updated_at = CURRENT_TIMESTAMP
        `;

        await client.query(normalizedQuery, normalizedValues);

        polesImported += regularPlaceholders.length;
        const progress = ((i + batch.length) / polesData.length * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${progress}% | Imported: ${polesImported} | Skipped: ${skipped}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✓ Poles import completed in ${duration}s`);
    console.log(`  - Imported: ${polesImported} poles`);
    console.log(`  - Skipped: ${skipped} (no pole number)`);
    console.log(`  - Rate: ${(polesImported / duration).toFixed(0)} poles/second\n`);

    // Show normalization statistics
    console.log('📊 NORMALIZATION STATISTICS:');
    console.log(`  - Exact matches: ${normalizationStats.exact}`);
    console.log(`  - Normalized: ${normalizationStats.normalized}`);
    console.log(`  - With numeric suffix: ${normalizationStats.withSuffix}\n`);

    // AUTO-GENERATE MAPPINGS
    console.log('🔗 AUTO-GENERATING POLE MAPPINGS...');

    // Create mapping entries based on normalized data
    const mappingResult = await client.query(`
      INSERT INTO sow_onemap_mapping (
        project_id, sow_pole_number, onemap_pole_number,
        match_type, confidence_score
      )
      SELECT DISTINCT
        spn.project_id,
        spn.pole_number as sow_pole_number,
        op.pole_number as onemap_pole_number,
        'auto_suffix' as match_type,
        CASE
          WHEN ABS(spn.latitude - op.latitude::numeric) < 0.0001
           AND ABS(spn.longitude - op.longitude::numeric) < 0.0001
          THEN 0.95
          ELSE 0.7
        END as confidence_score
      FROM sow_poles_normalized spn
      INNER JOIN onemap_properties op
        ON spn.pole_number_suffix = substring(op.pole_number from '\\d+$')::integer
      WHERE spn.project_id = $1
        AND spn.pole_number_suffix IS NOT NULL
      ON CONFLICT (project_id, sow_pole_number, onemap_pole_number) DO NOTHING
      RETURNING id
    `, [projectId]);

    console.log(`✓ Generated ${mappingResult.rowCount} automatic mappings\n`);

    // Final summary
    const [sowCount] = await client.query(
      'SELECT COUNT(*) as count FROM sow_poles WHERE project_id = $1',
      [projectId]
    );

    const [mappedCount] = await client.query(
      'SELECT COUNT(DISTINCT sow_pole_number) as count FROM sow_onemap_mapping WHERE project_id = $1',
      [projectId]
    );

    console.log('=' .repeat(60));
    console.log('IMPORT COMPLETE');
    console.log('=' .repeat(60));
    console.log(`Total SOW Poles: ${sowCount.rows[0].count}`);
    console.log(`Mapped to OneMap: ${mappedCount.rows[0].count}`);
    console.log(`Mapping Rate: ${((mappedCount.rows[0].count / sowCount.rows[0].count) * 100).toFixed(1)}%`);
    console.log('');

  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node run-import-normalized.cjs <project_id> <poles_file.xlsx>');
  console.log('Example: node run-import-normalized.cjs e2a61399-275a-4c44-8008-e9e42b7a3501 LAW_Poles.xlsx');
  process.exit(1);
}

const projectId = process.argv[2];
const polesFile = process.argv[3];

// Validate inputs
if (!projectId || !polesFile) {
  console.error('Error: Both project ID and poles file are required');
  process.exit(1);
}

// Run the import
fastBatchImportNormalized(projectId, polesFile)
  .then(() => {
    console.log('✅ Import process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  });