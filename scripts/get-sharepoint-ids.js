#!/usr/bin/env node
/**
 * SharePoint ID Extractor
 *
 * Retrieves Site ID, Drive ID, and File ID from SharePoint using Microsoft Graph API
 *
 * Usage:
 *   node scripts/get-sharepoint-ids.js [CLIENT_SECRET]
 *
 * If CLIENT_SECRET is not provided, script will prompt for it
 */

const https = require('https');
const readline = require('readline');

// Known credentials from docs
const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';

// SharePoint details
const SHAREPOINT_DOMAIN = 'blitzfibre.sharepoint.com';
const SITE_PATH = '/sites/Velocity_Manco';
const FILE_NAME = 'VF_Project_Tracker_Mohadin.xlsx';

/**
 * Get access token from Azure AD
 */
async function getAccessToken(clientSecret) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }).toString();

    const options = {
      hostname: 'login.microsoftonline.com',
      port: 443,
      path: `/${TENANT_ID}/oauth2/v2.0/token`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error(`Authentication failed: ${response.error_description || response.error || 'Unknown error'}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse auth response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Auth request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Make Microsoft Graph API request
 */
async function graphRequest(path, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`Graph API error (${res.statusCode}): ${response.error?.message || JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Graph API response: ${error.message}\nResponse: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Graph API request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Get Site ID
 */
async function getSiteId(accessToken) {
  console.log('\n📍 Step 1: Getting Site ID...');
  console.log(`   Site: ${SHAREPOINT_DOMAIN}:${SITE_PATH}`);

  const path = `/v1.0/sites/${SHAREPOINT_DOMAIN}:${SITE_PATH}`;
  const response = await graphRequest(path, accessToken);

  console.log(`   ✅ Site ID: ${response.id}`);
  return response.id;
}

/**
 * Get Drive ID (default document library)
 */
async function getDriveId(siteId, accessToken) {
  console.log('\n📂 Step 2: Getting Drive ID...');

  const path = `/v1.0/sites/${siteId}/drives`;
  const response = await graphRequest(path, accessToken);

  if (!response.value || response.value.length === 0) {
    throw new Error('No drives found for this site');
  }

  // Get the default document library (usually the first one)
  const drive = response.value[0];

  console.log(`   ✅ Drive ID: ${drive.id}`);
  console.log(`   Drive Name: ${drive.name}`);
  return drive.id;
}

/**
 * Get File ID
 */
async function getFileId(driveId, accessToken) {
  console.log('\n📄 Step 3: Getting File ID...');
  console.log(`   File: ${FILE_NAME}`);

  const path = `/v1.0/drives/${driveId}/root:/${FILE_NAME}`;
  const response = await graphRequest(path, accessToken);

  console.log(`   ✅ File ID: ${response.id}`);
  console.log(`   File Name: ${response.name}`);
  return response.id;
}

/**
 * Prompt user for input
 */
function promptForInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         SharePoint ID Extractor - Microsoft Graph API          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\nThis script will retrieve Site ID, Drive ID, and File ID');
  console.log('needed for SharePoint sync configuration.\n');
  console.log('Configuration:');
  console.log(`  Tenant ID:    ${TENANT_ID}`);
  console.log(`  Client ID:    ${CLIENT_ID}`);
  console.log(`  SharePoint:   ${SHAREPOINT_DOMAIN}`);
  console.log(`  Site:         ${SITE_PATH}`);
  console.log(`  File:         ${FILE_NAME}`);
  console.log('\n────────────────────────────────────────────────────────────────\n');

  try {
    // Get client secret from args or prompt
    let clientSecret = process.argv[2];

    if (!clientSecret) {
      console.log('⚠️  Client Secret not provided as argument\n');
      console.log('You can get the Client Secret from:');
      console.log('  1. Azure Portal → App registrations');
      console.log(`  2. Search for Client ID: ${CLIENT_ID}`);
      console.log('  3. Go to: Certificates & secrets');
      console.log('  4. Generate new secret (if old one is lost)');
      console.log('  5. Copy the VALUE (shown only once)\n');

      clientSecret = await promptForInput('Enter Client Secret: ');

      if (!clientSecret) {
        console.error('\n❌ Error: Client Secret is required');
        process.exit(1);
      }
    }

    console.log('\n🔐 Authenticating with Microsoft Graph API...');
    const accessToken = await getAccessToken(clientSecret);
    console.log('   ✅ Authentication successful');

    // Get IDs step by step
    const siteId = await getSiteId(accessToken);
    const driveId = await getDriveId(siteId, accessToken);
    const fileId = await getFileId(driveId, accessToken);

    // Output results
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ SUCCESS - IDs Retrieved                   ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\nAdd these to /var/www/fibreflow/.env.production:\n');
    console.log('────────────────────────────────────────────────────────────────');
    console.log(`SHAREPOINT_TENANT_ID=${TENANT_ID}`);
    console.log(`SHAREPOINT_CLIENT_ID=${CLIENT_ID}`);
    console.log(`SHAREPOINT_CLIENT_SECRET=${clientSecret}`);
    console.log(`SHAREPOINT_SITE_ID=${siteId}`);
    console.log(`SHAREPOINT_DRIVE_ID=${driveId}`);
    console.log(`SHAREPOINT_FILE_ID=${fileId}`);
    console.log(`SHAREPOINT_WORKSHEET_NAME=NeonDbase`);
    console.log('────────────────────────────────────────────────────────────────');
    console.log('\n📋 Next Steps:\n');
    console.log('1. SSH into VPS:');
    console.log('   ssh root@72.60.17.245\n');
    console.log('2. Edit production environment:');
    console.log('   nano /var/www/fibreflow/.env.production\n');
    console.log('3. Add the variables above (copy/paste)\n');
    console.log('4. Restart production app:');
    console.log('   pm2 restart fibreflow-prod\n');
    console.log('5. Test sync:');
    console.log('   curl -X POST http://localhost:3005/api/wa-monitor-sync-sharepoint\n');
    console.log('6. Backfill missing data (7 days):');
    console.log('   cd /var/www/fibreflow');
    console.log('   for date in 2025-11-24 2025-11-25 2025-11-26 2025-11-27 2025-11-28 2025-11-29 2025-11-30; do');
    console.log('     curl -X POST http://localhost:3005/api/wa-monitor-sync-sharepoint \\');
    console.log('       -H "Content-Type: application/json" \\');
    console.log('       -d "{\\"date\\":\\"$date\\"}"');
    console.log('     sleep 2');
    console.log('   done\n');
    console.log('✅ Done! SharePoint sync will resume automatically.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  • Verify Client Secret is correct (not expired)');
    console.error('  • Check app has Sites.ReadWrite.All permission');
    console.error('  • Ensure admin consent was granted');
    console.error('  • Verify SharePoint site/file path is correct\n');
    process.exit(1);
  }
}

// Run main function
main();
