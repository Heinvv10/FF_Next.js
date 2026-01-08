#!/usr/bin/env node
/**
 * OneMap Sync CLI
 *
 * Syncs installation data from 1Map GIS API to onemap schema.
 *
 * Usage:
 *   node scripts/onemap-sync.js                    # Sync all enabled sites
 *   node scripts/onemap-sync.js --site LAW         # Sync specific site
 *   node scripts/onemap-sync.js --dry-run          # Preview without DB changes
 *   node scripts/onemap-sync.js --full             # Force full sync
 *   node scripts/onemap-sync.js --max-pages 2      # Limit pages (testing)
 *   node scripts/onemap-sync.js status             # Show sync status
 *
 * Environment Variables:
 *   ONEMAP_EMAIL    - 1Map login email
 *   ONEMAP_PASSWORD - 1Map login password
 *   DATABASE_URL    - Neon PostgreSQL connection string
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  baseUrl: 'https://www.1map.co.za',
  layerId: '5121',
  pageSize: 50,
};

// Site code to search term mapping
// The API does text search, so we search by the site name
const SITE_SEARCH_TERMS = {
  'LAW': 'lawley',
  'MOH': 'mohadin',
  'MAM': 'mamelodi',
};

// Parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: 'sync',  // sync | status
    site: null,
    dryRun: false,
    fullSync: false,
    maxPages: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case 'status':
        options.command = 'status';
        break;
      case '--site':
        options.site = args[++i]?.toUpperCase();
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--full':
        options.fullSync = true;
        break;
      case '--max-pages':
        options.maxPages = parseInt(args[++i], 10);
        break;
    }
  }

  return options;
}

// OneMap client (simplified for script)
class OneMapClient {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.sessionCookie = null;
  }

  async authenticate() {
    console.log(`🔐 Authenticating with 1Map as ${this.email}...`);

    // Step 1: Get login page for CSRF token and initial session
    const pageResponse = await fetch(`${CONFIG.baseUrl}/login`, {
      method: 'GET',
    });

    const pageCookies = pageResponse.headers.get('set-cookie') || '';
    const pageHtml = await pageResponse.text();

    // Extract CSRF token from form
    const csrfMatch = pageHtml.match(/name="_csrf"[^>]*value="([^"]+)"/);
    const csrf = csrfMatch ? csrfMatch[1] : null;

    if (!csrf) {
      throw new Error('Could not find CSRF token on login page');
    }

    // Parse cookies for the login request
    const cookieString = pageCookies.split(',').map(c => c.split(';')[0].trim()).join('; ');

    // Step 2: POST login with CSRF token
    const response = await fetch(`${CONFIG.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieString,
      },
      body: new URLSearchParams({
        email: this.email,
        password: this.password,
        _csrf: csrf,
      }).toString(),
      redirect: 'manual',
    });

    // Use session from login response (302 redirect), fallback to page cookies
    const loginCookies = response.headers.get('set-cookie') || '';
    const newSidMatch = loginCookies.match(/connect\.sid=([^;]+)/);
    const pageSidMatch = pageCookies.match(/connect\.sid=([^;]+)/);

    // Prefer the new session from login response
    if (newSidMatch) {
      this.sessionCookie = newSidMatch[1];
    } else if (pageSidMatch) {
      this.sessionCookie = pageSidMatch[1];
    }

    if (this.sessionCookie && response.status === 302) {
      console.log('✅ Authentication successful\n');
      return true;
    }

    throw new Error(`Authentication failed - status: ${response.status}`);
  }

  async searchInstallations(searchTerm, page = 1) {
    const start = (page - 1) * CONFIG.pageSize;

    // Search by site name (e.g., "lawley" for LAW site)
    const formData = new URLSearchParams({
      ungeocoded: 'false',
      left: '0', bottom: '0', right: '0', top: '0',
      selfilter: '',
      action: 'get',
      email: this.email,
      layerid: CONFIG.layerId,
      sort: 'prop_id',
      templateExpression: '',
      q: searchTerm,  // Search by site name
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

  async getAllInstallations(siteCode, maxPages = null) {
    const records = [];
    let page = 1;
    const targetSite = siteCode.toUpperCase();
    const searchTerm = SITE_SEARCH_TERMS[targetSite];

    if (!searchTerm) {
      throw new Error(`No search term configured for site: ${targetSite}`);
    }

    while (true) {
      const result = await this.searchInstallations(searchTerm, page);

      if (!result.success || !result.result) break;

      // Filter to only include records where:
      // 1. Site field matches exactly
      // 2. Has a valid DR number (starts with "DR" followed by digits)
      const filtered = result.result.filter(r =>
        r.site === targetSite &&
        r.drp &&
        /^DR\d+$/.test(r.drp)
      );

      // Deduplicate by DR number (keep first occurrence)
      for (const rec of filtered) {
        if (!records.some(existing => existing.drp === rec.drp)) {
          records.push(rec);
        }
      }

      const totalPages = Math.ceil(result.total_pages);
      const pct = Math.round((page / totalPages) * 100);
      process.stdout.write(`\r   📄 Page ${page}/${totalPages} (${pct}%) - ${records.length} records`);

      if (page >= totalPages) break;
      if (maxPages && page >= maxPages) {
        console.log(`\n   ⚠️  Stopped at max pages limit (${maxPages})`);
        break;
      }

      page++;
      await new Promise(r => setTimeout(r, 100)); // Rate limiting
    }

    console.log('');
    return records;
  }
}

// Generate checksum for change detection
function generateChecksum(record) {
  const data = {
    drp: record.drp,
    pole: record.pole,
    status: record.status,
    address: record.address,
    latitude: record.latitude,
    longitude: record.longitude,
    modified: record.modified,
  };
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

// Sync a single site
async function syncSite(sql, client, site, options) {
  const startedAt = new Date();
  const result = {
    siteCode: site.site_code,
    siteName: site.site_name,
    success: false,
    recordsFetched: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsUnchanged: 0,
    recordsFailed: 0,
    durationSeconds: 0,
    error: null,
  };

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📍 Syncing ${site.site_name} (${site.site_code})`);
  console.log(`   Site ID: ${site.id}`);
  console.log('═'.repeat(60));

  try {
    // Fetch from 1Map
    const records = await client.getAllInstallations(site.site_code, options.maxPages);
    result.recordsFetched = records.length;

    if (options.dryRun) {
      console.log(`   🔍 DRY RUN: Would process ${records.length} records`);
      result.success = true;
      result.durationSeconds = (Date.now() - startedAt.getTime()) / 1000;
      return result;
    }

    console.log(`   💾 Processing ${records.length} records...`);

    // Cache for poles to avoid repeated lookups
    const poleCache = new Map(); // pole_number -> pole_id

    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (!record.drp) {
        result.recordsFailed++;
        continue;
      }

      try {
        const checksum = generateChecksum(record);
        const lat = record.latitude ? parseFloat(record.latitude) : null;
        const lng = record.longitude ? parseFloat(record.longitude) : null;

        // Upsert pole if exists
        let poleId = null;
        if (record.pole) {
          // Check cache first
          if (poleCache.has(record.pole)) {
            poleId = poleCache.get(record.pole);
          } else {
            // Check if pole exists
            const existingPole = await sql`
              SELECT id FROM onemap.poles
              WHERE site_id = ${site.id}::uuid AND pole_number = ${record.pole}
            `;

            if (existingPole.length > 0) {
              poleId = existingPole[0].id;
            } else {
              // Create new pole
              const newPole = await sql`
                INSERT INTO onemap.poles (site_id, pole_number, latitude, longitude, last_synced_at)
                VALUES (${site.id}::uuid, ${record.pole}, ${lat}, ${lng}, NOW())
                RETURNING id
              `;
              poleId = newPole[0].id;
            }
            poleCache.set(record.pole, poleId);
          }
        }

        // Check if installation exists
        const existing = await sql`
          SELECT id, checksum FROM onemap.drops
          WHERE site_id = ${site.id}::uuid AND dr_number = ${record.drp}
        `;

        if (existing.length === 0) {
          // Insert new installation
          await sql`
            INSERT INTO onemap.drops (
              site_id, pole_id, dr_number, latitude, longitude, address,
              current_status, current_stage, pole_number, section_code, pon_code,
              checksum, last_synced_at
            ) VALUES (
              ${site.id}::uuid, ${poleId}::uuid, ${record.drp}, ${lat}, ${lng},
              ${record.address || null}, ${record.status || null}, ${record.stage || null},
              ${record.pole || null}, ${record.sect || null}, ${record.pons || null},
              ${checksum}, NOW()
            )
          `;
          result.recordsCreated++;
        } else if (existing[0].checksum !== checksum) {
          // Update changed installation
          await sql`
            UPDATE onemap.drops SET
              pole_id = ${poleId}::uuid,
              latitude = ${lat}, longitude = ${lng},
              address = ${record.address || null},
              current_status = ${record.status || null},
              current_stage = ${record.stage || null},
              pole_number = ${record.pole || null},
              section_code = ${record.sect || null},
              pon_code = ${record.pons || null},
              checksum = ${checksum},
              last_synced_at = NOW(), updated_at = NOW()
            WHERE site_id = ${site.id}::uuid AND dr_number = ${record.drp}
          `;
          result.recordsUpdated++;
        } else {
          result.recordsUnchanged++;
        }

        // Progress
        if ((i + 1) % 500 === 0 || i === records.length - 1) {
          process.stdout.write(`\r   💾 Processed ${i + 1}/${records.length}`);
        }
      } catch (err) {
        result.recordsFailed++;
      }
    }

    // Update pole installation counts
    await sql`
      UPDATE onemap.poles p SET
        drop_count = (
          SELECT COUNT(*) FROM onemap.drops i WHERE i.pole_id = p.id
        )
      WHERE p.site_id = ${site.id}::uuid
    `;

    console.log('');

    // Update site metadata
    const count = await sql`
      SELECT COUNT(*) as count FROM onemap.drops WHERE site_id = ${site.id}::uuid
    `;
    const installCount = parseInt(count[0].count);

    if (options.fullSync) {
      await sql`
        UPDATE onemap.sites SET
          last_full_sync = NOW(),
          total_drops = ${installCount},
          updated_at = NOW()
        WHERE id = ${site.id}::uuid
      `;
    } else {
      await sql`
        UPDATE onemap.sites SET
          last_incremental_sync = NOW(),
          total_drops = ${installCount},
          updated_at = NOW()
        WHERE id = ${site.id}::uuid
      `;
    }

    result.success = true;
    result.durationSeconds = (Date.now() - startedAt.getTime()) / 1000;

    // Log sync
    await sql`
      INSERT INTO onemap.sync_log (
        sync_type, site_code, records_fetched, records_created,
        records_updated, records_unchanged, records_failed,
        duration_seconds, status, started_at, completed_at
      ) VALUES (
        ${options.fullSync ? 'full' : 'incremental'},
        ${site.site_code}, ${result.recordsFetched}, ${result.recordsCreated},
        ${result.recordsUpdated}, ${result.recordsUnchanged}, ${result.recordsFailed},
        ${result.durationSeconds}, 'success', ${startedAt.toISOString()}, NOW()
      )
    `;

    console.log(`   ✅ Created: ${result.recordsCreated}, Updated: ${result.recordsUpdated}, Unchanged: ${result.recordsUnchanged}, Failed: ${result.recordsFailed}`);
    console.log(`   ⏱️  Duration: ${result.durationSeconds.toFixed(1)}s`);

  } catch (error) {
    result.error = error.message;
    result.durationSeconds = (Date.now() - startedAt.getTime()) / 1000;
    console.error(`   ❌ Error: ${error.message}`);

    await sql`
      INSERT INTO onemap.sync_log (
        sync_type, site_code, records_fetched, status, error_message,
        duration_seconds, started_at, completed_at
      ) VALUES (
        ${options.fullSync ? 'full' : 'incremental'},
        ${site.site_code}, ${result.recordsFetched}, 'failed', ${error.message},
        ${result.durationSeconds}, ${startedAt.toISOString()}, NOW()
      )
    `;
  }

  return result;
}

// Show sync status
async function showStatus(sql) {
  console.log('\n' + '═'.repeat(60));
  console.log('  ONEMAP SYNC STATUS');
  console.log('═'.repeat(60));

  const sites = await sql`
    SELECT
      s.site_code, s.site_name, s.enabled, s.total_drops,
      s.last_full_sync, s.last_incremental_sync,
      (SELECT COUNT(*) FROM onemap.drops i WHERE i.site_id = s.id) as current_count
    FROM onemap.sites s ORDER BY s.site_code
  `;

  console.log('\n📍 Sites:\n');
  for (const site of sites) {
    const status = site.enabled ? '✓' : '○';
    const lastSync = site.last_full_sync || site.last_incremental_sync;
    const lastSyncStr = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
    console.log(`  ${status} ${site.site_code}: ${site.site_name}`);
    console.log(`     Installations: ${site.current_count} | Last sync: ${lastSyncStr}`);
  }

  const recentLogs = await sql`
    SELECT site_code, sync_type, status, records_fetched, records_created,
           records_updated, duration_seconds, started_at
    FROM onemap.sync_log
    ORDER BY started_at DESC LIMIT 5
  `;

  if (recentLogs.length > 0) {
    console.log('\n📋 Recent Syncs:\n');
    for (const log of recentLogs) {
      const date = new Date(log.started_at).toLocaleString();
      const icon = log.status === 'success' ? '✅' : '❌';
      console.log(`  ${icon} ${log.site_code} (${log.sync_type}) - ${date}`);
      console.log(`     Fetched: ${log.records_fetched}, Created: ${log.records_created || 0}, Updated: ${log.records_updated || 0}, Duration: ${log.duration_seconds?.toFixed(1) || '?'}s`);
    }
  }

  console.log('\n' + '═'.repeat(60));
}

// Main
async function main() {
  const options = parseArgs();

  console.log('═'.repeat(60));
  console.log('  ONEMAP SYNC CLI');
  console.log('═'.repeat(60));

  // Check env
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL environment variable required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Status command
  if (options.command === 'status') {
    await showStatus(sql);
    return;
  }

  // Sync command
  if (!process.env.ONEMAP_EMAIL || !process.env.ONEMAP_PASSWORD) {
    console.error('\n❌ ONEMAP_EMAIL and ONEMAP_PASSWORD required');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes\n');
  }

  // Get sites
  let sites;
  if (options.site) {
    sites = await sql`
      SELECT id, site_code, site_name, project_id
      FROM onemap.sites WHERE site_code = ${options.site} AND enabled = true
    `;
    if (sites.length === 0) {
      console.error(`\n❌ Site ${options.site} not found or not enabled`);
      process.exit(1);
    }
  } else {
    sites = await sql`
      SELECT id, site_code, site_name, project_id
      FROM onemap.sites WHERE enabled = true ORDER BY site_code
    `;
  }

  console.log(`\n📍 Sites to sync: ${sites.map(s => s.site_code).join(', ')}`);

  // Auth
  const client = new OneMapClient(process.env.ONEMAP_EMAIL, process.env.ONEMAP_PASSWORD);
  await client.authenticate();

  // Sync
  const results = [];
  for (const site of sites) {
    const result = await syncSite(sql, client, site, options);
    results.push(result);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  SYNC SUMMARY');
  console.log('═'.repeat(60));

  let totalFetched = 0, totalCreated = 0, totalUpdated = 0, totalFailed = 0;

  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.siteName}: ${r.recordsFetched} fetched, ${r.recordsCreated} created, ${r.recordsUpdated} updated`);
    totalFetched += r.recordsFetched;
    totalCreated += r.recordsCreated;
    totalUpdated += r.recordsUpdated;
    totalFailed += r.recordsFailed;
  }

  console.log('─'.repeat(60));
  console.log(`   Total: ${totalFetched} fetched, ${totalCreated} created, ${totalUpdated} updated, ${totalFailed} failed`);
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
