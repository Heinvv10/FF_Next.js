#!/usr/bin/env node
/**
 * Sync Drops from 1Map GIS API to sow_drops table
 *
 * Fetches installation data from 1Map for Lawley, Mohadin, and Mamelodi
 * and inserts into the sow_drops table with proper project_id linkage.
 *
 * Usage:
 *   node scripts/sync-onemap-drops.js [--site LAW] [--dry-run] [--max-pages 10]
 *
 * Environment Variables:
 *   ONEMAP_EMAIL    - 1Map login email
 *   ONEMAP_PASSWORD - 1Map login password
 *   DATABASE_URL    - Neon PostgreSQL connection string
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Configuration
const CONFIG = {
  baseUrl: 'https://www.1map.co.za',
  layerId: '5121', // Fibertime Installations
  batchSize: 500,  // DB insert batch size
  pageSize: 50,    // 1Map API page size
};

// Site to Project ID mapping
const SITE_PROJECT_MAP = {
  'LAW': {
    projectId: '4eb13426-b2a1-472d-9b3c-277082ae9b55',
    projectName: 'Lawley',
  },
  'MOH': {
    projectId: 'bf9a90db-e758-4c05-b999-694cd63c451f',
    projectName: 'Mohadin',
  },
  'MAM': {
    projectId: '7003dc06-9af7-4a7c-bc6c-a177d77784f2',
    projectName: 'Mamelodi',
  },
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    site: null,      // Specific site to sync (null = all)
    dryRun: false,   // Don't write to DB
    maxPages: null,  // Limit pages per site
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--site':
        options.site = args[++i]?.toUpperCase();
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--max-pages':
        options.maxPages = parseInt(args[++i], 10);
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
    }
  }

  return options;
}

class OneMapSync {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.sessionCookie = null;
    this.sql = neon(process.env.DATABASE_URL);
  }

  async authenticate() {
    console.log(`🔐 Authenticating with 1Map as ${this.email}...`);

    const response = await fetch(`${CONFIG.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: this.email,
        password: this.password,
      }).toString(),
      redirect: 'manual',
    });

    // Extract session cookie
    const setCookie = response.headers.get('set-cookie') || '';
    const match = setCookie.match(/connect\.sid=([^;]+)/);

    if (match) {
      this.sessionCookie = match[1];
      console.log('✅ Authentication successful');
      return true;
    }

    console.error('❌ Authentication failed');
    return false;
  }

  async searchInstallations(query, page = 1) {
    const start = (page - 1) * CONFIG.pageSize;

    const formData = new URLSearchParams({
      ungeocoded: 'false',
      left: '0',
      bottom: '0',
      right: '0',
      top: '0',
      selfilter: '',
      action: 'get',
      email: this.email,
      layerid: CONFIG.layerId,
      sort: 'prop_id',
      templateExpression: '',
      q: query,
      page: String(page),
      start: String(start),
      limit: String(CONFIG.pageSize),
    });

    const response = await fetch(`${CONFIG.baseUrl}/api/apps/app/getattributes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': `connect.sid=${this.sessionCookie}`,
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async fetchAllForSite(siteCode, maxPages = null) {
    const records = [];
    let page = 1;

    console.log(`\n📥 Fetching ${siteCode} installations from 1Map...`);

    while (true) {
      const result = await this.searchInstallations(siteCode.toLowerCase(), page);

      if (!result.success || !result.result) {
        console.error(`   ❌ Page ${page} failed`);
        break;
      }

      records.push(...result.result);

      const totalPages = Math.ceil(result.total_pages);
      const progress = Math.round((page / totalPages) * 100);
      process.stdout.write(`\r   📄 Page ${page}/${totalPages} (${progress}%) - ${records.length} records`);

      if (page >= totalPages) break;
      if (maxPages && page >= maxPages) {
        console.log(`\n   ⚠️  Stopped at max pages limit (${maxPages})`);
        break;
      }

      page++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n   ✅ Fetched ${records.length} records for ${siteCode}`);
    return records;
  }

  transformRecord(record, projectId) {
    // Extract and clean data
    const lat = record.latitude || record.lat;
    const lng = record.longitude || record.lng || record.lon;

    return {
      project_id: projectId,
      drop_number: record.drp || null,
      pole_number: record.pole || null,
      latitude: lat ? parseFloat(lat) : null,
      longitude: lng ? parseFloat(lng) : null,
      status: record.status || 'unknown',
      address: record.address || null,
      municipality: record.mun || record.municipality || null,
      pon_no: record.pon ? parseInt(record.pon, 10) : null,
      zone_no: record.zone ? parseInt(record.zone, 10) : null,
      contractor: record.contractor || null,
      raw_data: JSON.stringify(record),
    };
  }

  async insertDrops(drops, projectId, dryRun = false) {
    if (drops.length === 0) return 0;

    // Transform records
    const transformed = drops
      .filter(r => r.drp) // Must have DR number
      .map(r => this.transformRecord(r, projectId));

    if (transformed.length === 0) {
      console.log('   ⚠️  No valid records to insert');
      return 0;
    }

    if (dryRun) {
      console.log(`   🔍 DRY RUN: Would insert ${transformed.length} records`);
      console.log('   Sample:', JSON.stringify(transformed[0], null, 2));
      return transformed.length;
    }

    console.log(`\n   💾 Inserting ${transformed.length} records into sow_drops...`);

    let totalInserted = 0;

    // Insert in batches
    for (let i = 0; i < transformed.length; i += CONFIG.batchSize) {
      const batch = transformed.slice(i, i + CONFIG.batchSize);

      try {
        // Use parameterized query with ON CONFLICT
        for (const record of batch) {
          await this.sql`
            INSERT INTO sow_drops (
              project_id, drop_number, pole_number, latitude, longitude,
              status, address, municipality, pon_no, zone_no,
              contractor, raw_data, created_at, updated_at
            ) VALUES (
              ${record.project_id}::uuid,
              ${record.drop_number},
              ${record.pole_number},
              ${record.latitude},
              ${record.longitude},
              ${record.status},
              ${record.address},
              ${record.municipality},
              ${record.pon_no},
              ${record.zone_no},
              ${record.contractor},
              ${record.raw_data}::jsonb,
              NOW(),
              NOW()
            )
            ON CONFLICT (project_id, drop_number)
            DO UPDATE SET
              pole_number = EXCLUDED.pole_number,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              status = EXCLUDED.status,
              address = EXCLUDED.address,
              municipality = EXCLUDED.municipality,
              pon_no = EXCLUDED.pon_no,
              zone_no = EXCLUDED.zone_no,
              contractor = EXCLUDED.contractor,
              raw_data = EXCLUDED.raw_data,
              updated_at = NOW()
          `;
          totalInserted++;
        }

        const progress = Math.round(((i + batch.length) / transformed.length) * 100);
        process.stdout.write(`\r   💾 Inserted ${i + batch.length}/${transformed.length} (${progress}%)`);
      } catch (error) {
        console.error(`\n   ❌ Batch insert failed:`, error.message);
      }
    }

    console.log(`\n   ✅ Inserted/updated ${totalInserted} records`);
    return totalInserted;
  }

  async clearProjectDrops(projectId, dryRun = false) {
    if (dryRun) {
      const count = await this.sql`
        SELECT COUNT(*) as count FROM sow_drops WHERE project_id = ${projectId}::uuid
      `;
      console.log(`   🔍 DRY RUN: Would delete ${count[0].count} existing records`);
      return;
    }

    console.log(`   🗑️  Clearing existing drops for project...`);
    await this.sql`DELETE FROM sow_drops WHERE project_id = ${projectId}::uuid`;
  }

  async syncSite(siteCode, options = {}) {
    const { dryRun = false, maxPages = null, clearExisting = true } = options;
    const siteConfig = SITE_PROJECT_MAP[siteCode];

    if (!siteConfig) {
      console.error(`❌ Unknown site code: ${siteCode}`);
      console.log('   Known sites:', Object.keys(SITE_PROJECT_MAP).join(', '));
      return { site: siteCode, success: false, error: 'Unknown site' };
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 Syncing ${siteConfig.projectName} (${siteCode})`);
    console.log(`   Project ID: ${siteConfig.projectId}`);
    console.log('='.repeat(60));

    try {
      // Fetch from 1Map
      const records = await this.fetchAllForSite(siteCode, maxPages);

      if (records.length === 0) {
        console.log('   ⚠️  No records found in 1Map');
        return { site: siteCode, success: true, fetched: 0, inserted: 0 };
      }

      // Clear existing (optional)
      if (clearExisting) {
        await this.clearProjectDrops(siteConfig.projectId, dryRun);
      }

      // Insert new records
      const inserted = await this.insertDrops(records, siteConfig.projectId, dryRun);

      return {
        site: siteCode,
        projectName: siteConfig.projectName,
        success: true,
        fetched: records.length,
        inserted,
      };
    } catch (error) {
      console.error(`\n❌ Error syncing ${siteCode}:`, error.message);
      return { site: siteCode, success: false, error: error.message };
    }
  }

  async syncAll(options = {}) {
    const sites = Object.keys(SITE_PROJECT_MAP);
    const results = [];

    for (const site of sites) {
      const result = await this.syncSite(site, options);
      results.push(result);
    }

    return results;
  }
}

async function main() {
  const options = parseArgs();

  console.log('═'.repeat(60));
  console.log('  1MAP → SOW_DROPS SYNC');
  console.log('═'.repeat(60));

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made');
  }

  // Check environment
  const email = process.env.ONEMAP_EMAIL;
  const password = process.env.ONEMAP_PASSWORD;

  if (!email || !password) {
    console.error('\n❌ Missing environment variables:');
    console.error('   ONEMAP_EMAIL and ONEMAP_PASSWORD are required');
    console.error('\n   Example:');
    console.error('   export ONEMAP_EMAIL="your@email.com"');
    console.error('   export ONEMAP_PASSWORD="your_password"');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL environment variable required');
    process.exit(1);
  }

  const sync = new OneMapSync(email, password);

  // Authenticate
  const authenticated = await sync.authenticate();
  if (!authenticated) {
    process.exit(1);
  }

  // Sync
  let results;
  const syncOptions = {
    dryRun: options.dryRun,
    maxPages: options.maxPages,
  };

  if (options.site) {
    results = [await sync.syncSite(options.site, syncOptions)];
  } else {
    results = await sync.syncAll(syncOptions);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SYNC SUMMARY');
  console.log('═'.repeat(60));

  let totalFetched = 0;
  let totalInserted = 0;

  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.projectName || result.site}: ${result.fetched} fetched, ${result.inserted} inserted`);
      totalFetched += result.fetched || 0;
      totalInserted += result.inserted || 0;
    } else {
      console.log(`❌ ${result.site}: ${result.error}`);
    }
  }

  console.log('─'.repeat(60));
  console.log(`   Total: ${totalFetched} fetched, ${totalInserted} inserted`);
  console.log('═'.repeat(60));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
