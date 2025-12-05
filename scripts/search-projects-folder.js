#!/usr/bin/env node
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET;
const TENANT_ID = process.env.SHAREPOINT_TENANT_ID;
const CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID;
const DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID;
const FOLDER_ID = '01XUF54KEPCLGTTTLKPNB36ECBZD5HIDBE'; // Velocity_Tracker_Projects

if (!CLIENT_SECRET || !TENANT_ID || !CLIENT_ID || !DRIVE_ID) {
  console.error('❌ Missing SharePoint credentials in .env.local');
  console.error('Required: SHAREPOINT_CLIENT_SECRET, SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID, SHAREPOINT_DRIVE_ID');
  process.exit(1);
}

async function getAccessToken() {
  return new Promise((resolve) => {
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

    req.write(postData);
    req.end();
  });
}

async function searchFolder(accessToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: `/v1.0/drives/${DRIVE_ID}/items/${FOLDER_ID}/children?$select=id,name,size`,
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

    req.end();
  });
}

async function main() {
  console.log('🔍 Searching Velocity_Tracker_Projects folder...\n');

  const accessToken = await getAccessToken();
  const result = await searchFolder(accessToken);

  if (result.value) {
    result.value.forEach(file => {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      if (file.name.toLowerCase().includes('mohadin') || file.name.toLowerCase().includes('vf_project')) {
        console.log(`\n✅✅✅ FOUND IT: ${file.name}`);
        console.log(`FILE_ID: ${file.id}`);
        console.log(`Size: ${sizeMB} MB\n`);
      } else {
        console.log(`   - ${file.name} (${sizeMB} MB)`);
      }
    });
  }
}

main();
