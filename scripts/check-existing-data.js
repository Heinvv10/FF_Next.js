#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    // Check if onemap tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name LIKE '%onemap%'
      AND table_schema = 'public'
    `;

    console.log('OneMap tables found:', tables.length ? tables.map(t => t.table_name) : 'None');

    // Check existing SOW data to compare
    console.log('\n=== Existing SOW Data for louissep15 ===');

    const poles = await sql`
      SELECT COUNT(*) as count,
             COUNT(DISTINCT pole_number) as unique_poles
      FROM sow_poles
      WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
    `;
    console.log('SOW Poles:', poles[0]);

    // Sample some pole numbers to check format
    const samplePoles = await sql`
      SELECT DISTINCT pole_number
      FROM sow_poles
      WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      ORDER BY pole_number
      LIMIT 10
    `;
    console.log('Sample pole numbers from SOW:', samplePoles.map(p => p.pole_number).join(', '));

    const drops = await sql`
      SELECT COUNT(*) as count
      FROM sow_drops
      WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
    `;
    console.log('\nSOW Drops:', drops[0]);

    // Sample some drop numbers - check the actual format
    const sampleDrops = await sql`
      SELECT DISTINCT drop_number
      FROM sow_drops
      WHERE project_id = 'e2a61399-275a-4c44-8008-e9e42b7a3501'
      AND drop_number IS NOT NULL
      ORDER BY drop_number
      LIMIT 10
    `;
    console.log('Sample drop numbers from SOW:', sampleDrops.map(d => d.drop_number).join(', '));

    // Check if we have any OneMap imports table
    const oneMapTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('onemap_imports', 'onemap_import_batches', 'onemap_change_history')
      AND table_schema = 'public'
    `;

    if (oneMapTables.length > 0) {
      console.log('\n=== OneMap Tables Exist ===');
      for (const table of oneMapTables) {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.table_name)}`;
        console.log(`${table.table_name}: ${count[0].count} records`);
      }
    } else {
      console.log('\n=== No OneMap tables exist yet ===');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
})();