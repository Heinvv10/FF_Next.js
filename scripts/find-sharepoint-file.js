#!/usr/bin/env node
/**
 * Find Excel files in SharePoint drive
 */

const https = require('https');

const CLIENT_SECRET = process.argv[2] || 'Vm98Q~OmmJ0bZ8~_ZVKKo5OHjCSKPi3vD0MyfcRW';
const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';
const DRIVE_ID = 'b!54aBz82X_0qdf-Qc8hPv-PQzZQ4Q2eFGrzwQ6nSz79cVH1Quyz5vQavmQwdsBGRy';

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
