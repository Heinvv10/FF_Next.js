#!/usr/bin/env node
/**
 * Find Excel files in SharePoint drive
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET;
const TENANT_ID = process.env.SHAREPOINT_TENANT_ID;
const CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID;
const DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID;

if (!CLIENT_SECRET || !TENANT_ID || !CLIENT_ID || !DRIVE_ID) {
  console.error('❌ Missing SharePoint credentials in .env.local');
  console.error('Required: SHAREPOINT_CLIENT_SECRET, SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_DRIVE_ID');
  process.exit(1);
}

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve(response.access_token);
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function searchFiles(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: `/v1.0/drives/${DRIVE_ID}/root/children?$select=id,name,size,webUrl`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve(response);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('🔍 Searching for VF_Project files in SharePoint...\n');

  const accessToken = await getAccessToken();
  const result = await searchFiles(accessToken);

  if (result.value && result.value.length > 0) {
    console.log('Found files:');
    console.log('─'.repeat(80));
    result.value.forEach(file => {
      console.log(`\nName: ${file.name}`);
      console.log(`ID:   ${file.id}`);
      console.log(`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`URL:  ${file.webUrl}`);
    });
    console.log('\n' + '─'.repeat(80));
  } else {
    console.log('❌ No files found matching "VF_Project" or "Mohadin"');
    console.log('\nListing ALL files in root:');

    // List all files
    const allOptions = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: `/v1.0/drives/${DRIVE_ID}/root/children?$select=id,name,size`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    https.get(allOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const allFiles = JSON.parse(data);
        if (allFiles.value) {
          allFiles.value.forEach(file => {
            console.log(`  - ${file.name} (${file.id})`);
          });
        }
      });
    });
  }
}

main().catch(console.error);
