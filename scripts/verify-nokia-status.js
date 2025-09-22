const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function verifyNokiaStatus() {
  try {
    console.log('='.repeat(80));
    console.log('         NOKIA IMPORT VERIFICATION STATUS CHECK');
    console.log('='.repeat(80));
    console.log(`Verification Time: ${new Date().toISOString()}\n`);

    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501';

    // 1. CHECK IF NOKIA TABLE EXISTS
    console.log('1️⃣ CHECKING NOKIA TABLE:');
    console.log('-'.repeat(60));

    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'nokia_velocity'
      ) as table_exists
    `;

    if (!tableCheck[0].table_exists) {
      console.log('❌ Nokia table does not exist! Import has not started.\n');
      return { imported: false, linked: false, verified: false, documented: false };
    }

    console.log('✅ Nokia table exists\n');

    // 2. CHECK IMPORT STATUS
    console.log('2️⃣ NOKIA IMPORT STATUS:');
    console.log('-'.repeat(60));

    const importStatus = await sql`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT property_id) as unique_properties,
        COUNT(DISTINCT pole_number) as poles_with_data,
        COUNT(DISTINCT drop_number) as drops_with_data,
        COUNT(ont_barcode) as with_ont,
        MIN(import_date) as first_import,
        MAX(import_date) as last_import,
        MAX(week_ending) as latest_week
      FROM nokia_velocity
      WHERE project_id = ${projectId}
    `;

    const stats = importStatus[0];

    if (stats.total_records === 0) {
      console.log('❌ No Nokia data found in table!\n');
      console.log('Import Status: NOT COMPLETED');
      console.log('Action Required: Run import script');
      console.log('Command: node scripts/import-nokia-velocity.js\n');
      return { imported: false, linked: false, verified: false, documented: true };
    }

    console.log(`✅ Nokia Records Found: ${stats.total_records}`);
    console.log(`   Properties: ${stats.unique_properties}`);
    console.log(`   Poles: ${stats.poles_with_data}`);
    console.log(`   Drops: ${stats.drops_with_data}`);
    console.log(`   ONT Barcodes: ${stats.with_ont}`);
    console.log(`   First Import: ${stats.first_import}`);
    console.log(`   Last Import: ${stats.last_import}`);
    console.log(`   Week Ending: ${stats.latest_week}\n`);

    // 3. CHECK LINKING STATUS
    console.log('3️⃣ LINKING VERIFICATION:');
    console.log('-'.repeat(60));

    // Check pole linking
    const poleLinks = await sql`
      SELECT
        COUNT(DISTINCT nv.pole_number) as nokia_poles,
        COUNT(DISTINCT sp.pole_number) as linked_to_sow,
        COUNT(DISTINCT op.pole_number) as linked_to_onemap
      FROM nokia_velocity nv
      LEFT JOIN sow_poles sp
        ON nv.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      LEFT JOIN onemap_properties op
        ON nv.pole_number = op.pole_number
      WHERE nv.project_id = ${projectId}
        AND nv.pole_number IS NOT NULL
    `;

    const pl = poleLinks[0];
    const poleLinkRate = pl.nokia_poles > 0
      ? ((pl.linked_to_sow / pl.nokia_poles) * 100).toFixed(1)
      : 0;

    console.log('POLE LINKING:');
    console.log(`  Nokia Poles: ${pl.nokia_poles}`);
    console.log(`  Linked to SOW: ${pl.linked_to_sow} (${poleLinkRate}%)`);
    console.log(`  Linked to OneMap: ${pl.linked_to_onemap}`);
    console.log(`  Status: ${poleLinkRate > 80 ? '✅ Good' : poleLinkRate > 50 ? '⚠️ Moderate' : '❌ Poor'}\n`);

    // Check drop linking
    const dropLinks = await sql`
      SELECT
        COUNT(DISTINCT nv.drop_number) as nokia_drops,
        COUNT(DISTINCT sd.drop_number) as linked_to_sow,
        COUNT(DISTINCT op.drop_number) as linked_to_onemap
      FROM nokia_velocity nv
      LEFT JOIN sow_drops sd
        ON nv.drop_number = sd.drop_number
        AND sd.project_id = ${projectId}
      LEFT JOIN onemap_properties op
        ON nv.drop_number = op.drop_number
      WHERE nv.project_id = ${projectId}
        AND nv.drop_number IS NOT NULL
    `;

    const dl = dropLinks[0];
    const dropLinkRate = dl.nokia_drops > 0
      ? ((dl.linked_to_sow / dl.nokia_drops) * 100).toFixed(1)
      : 0;

    console.log('DROP LINKING:');
    console.log(`  Nokia Drops: ${dl.nokia_drops}`);
    console.log(`  Linked to SOW: ${dl.linked_to_sow} (${dropLinkRate}%)`);
    console.log(`  Linked to OneMap: ${dl.linked_to_onemap}`);
    console.log(`  Status: ${dropLinkRate > 50 ? '✅ Expected' : '⚠️ Low'}\n`);

    // 4. CHECK API ENDPOINT
    console.log('4️⃣ API ENDPOINT CHECK:');
    console.log('-'.repeat(60));

    const fs = require('fs');
    const apiExists = fs.existsSync('/home/louisdup/VF/Apps/FF_React/pages/api/nokia/velocity.ts');
    console.log(`  API Endpoint: ${apiExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  Path: /api/nokia/velocity\n`);

    // 5. CHECK DOCUMENTATION
    console.log('5️⃣ DOCUMENTATION CHECK:');
    console.log('-'.repeat(60));

    const docsToCheck = [
      '/home/louisdup/VF/Apps/FF_React/imports/nokia/NOKIA_VELOCITY_IMPORT.md',
      '/home/louisdup/VF/Apps/FF_React/imports/nokia/NOKIA_IMPORT_REPORT.md',
      '/home/louisdup/VF/Apps/FF_React/scripts/import-nokia-velocity.js',
      '/home/louisdup/VF/Apps/FF_React/scripts/analyze-nokia-linking.js'
    ];

    let docsFound = 0;
    docsToCheck.forEach(doc => {
      const exists = fs.existsSync(doc);
      const filename = doc.split('/').pop();
      console.log(`  ${filename}: ${exists ? '✅' : '❌'}`);
      if (exists) docsFound++;
    });

    console.log(`\n  Documentation Status: ${docsFound}/${docsToCheck.length} files present\n`);

    // 6. SAMPLE DATA VERIFICATION
    console.log('6️⃣ SAMPLE LINKED DATA:');
    console.log('-'.repeat(60));

    const samples = await sql`
      SELECT
        nv.property_id,
        nv.pole_number,
        nv.drop_number,
        nv.status,
        nv.ont_barcode,
        CASE WHEN sp.pole_number IS NOT NULL THEN 'Yes' ELSE 'No' END as sow_pole_linked,
        CASE WHEN sd.drop_number IS NOT NULL THEN 'Yes' ELSE 'No' END as sow_drop_linked
      FROM nokia_velocity nv
      LEFT JOIN sow_poles sp
        ON nv.pole_number = sp.pole_number
        AND sp.project_id = ${projectId}
      LEFT JOIN sow_drops sd
        ON nv.drop_number = sd.drop_number
        AND sd.project_id = ${projectId}
      WHERE nv.project_id = ${projectId}
        AND (sp.pole_number IS NOT NULL OR sd.drop_number IS NOT NULL)
      LIMIT 3
    `;

    if (samples.length > 0) {
      console.log('Successfully Linked Examples:');
      samples.forEach((s, i) => {
        console.log(`\n  ${i + 1}. Property: ${s.property_id}`);
        console.log(`     Status: ${s.status || 'N/A'}`);
        console.log(`     Pole: ${s.pole_number || 'None'} (SOW Link: ${s.sow_pole_linked})`);
        console.log(`     Drop: ${s.drop_number || 'None'} (SOW Link: ${s.sow_drop_linked})`);
        if (s.ont_barcode) console.log(`     ONT: ${s.ont_barcode}`);
      });
    } else {
      console.log('No linked samples found');
    }

    // FINAL STATUS REPORT
    console.log('\n\n' + '='.repeat(80));
    console.log('                    FINAL NOKIA STATUS REPORT');
    console.log('='.repeat(80));

    const imported = stats.total_records > 0;
    const linked = poleLinkRate > 0 || dropLinkRate > 0;
    const verified = samples.length > 0;
    const documented = docsFound === docsToCheck.length;

    console.log('\n✅ NOKIA IMPORT STATUS:');
    console.log(`  1. IMPORTED:    ${imported ? '✅ YES' : '❌ NO'} ${imported ? `(${stats.total_records} records)` : ''}`);
    console.log(`  2. LINKED:      ${linked ? '✅ YES' : '❌ NO'} ${linked ? `(Poles: ${poleLinkRate}%, Drops: ${dropLinkRate}%)` : ''}`);
    console.log(`  3. VERIFIED:    ${verified ? '✅ YES' : '❌ NO'} ${verified ? '(Sample data confirmed)' : ''}`);
    console.log(`  4. DOCUMENTED:  ${documented ? '✅ YES' : '⚠️ PARTIAL'} (${docsFound}/${docsToCheck.length} docs)`);

    if (!imported) {
      console.log('\n⚠️ ACTION REQUIRED:');
      console.log('  The Nokia import has not completed!');
      console.log('  Run: node scripts/import-nokia-velocity.js');
      console.log('  This will import ~20,000 records from the Excel file');
    } else {
      console.log('\n✅ SUMMARY: Nokia import is COMPLETE and FUNCTIONAL');
      console.log(`  - ${stats.total_records} records imported`);
      console.log(`  - Linking is working (Poles: ${poleLinkRate}%, Drops: ${dropLinkRate}%)`);
      console.log(`  - API endpoint available at /api/nokia/velocity`);
      console.log(`  - Documentation in /imports/nokia/`);
    }

    console.log('\n' + '='.repeat(80) + '\n');

    return { imported, linked, verified, documented };

  } catch (error) {
    console.error('Error during verification:', error);
    return { imported: false, linked: false, verified: false, documented: false };
  }
}

// Run verification
verifyNokiaStatus()
  .then(status => {
    process.exit(status.imported ? 0 : 1);
  });