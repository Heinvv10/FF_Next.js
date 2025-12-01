#!/usr/bin/env node
const https = require('https');

const CLIENT_SECRET = 'Vm98Q~OmmJ0bZ8~_ZVKKo5OHjCSKPi3vD0MyfcRW';
const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';
const DRIVE_ID = 'b!54aBz82X_0qdf-Qc8hPv-PQzZQ4Q2eFGrzwQ6nSz79cVH1Quyz5vQavmQwdsBGRy';
const FOLDER_ID = '01XUF54KEB65VG4YEGGNEKPEFWCQSMJSGN'; // Velocity_Manco_Trackers

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

async function searchFolder(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: `/v1.0/drives/${DRIVE_ID}/items/${FOLDER_ID}/children?$select=id,name,size,webUrl`,
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
  console.log('🔍 Searching Velocity_Manco_Trackers folder...\n');

  const accessToken = await getAccessToken();
  const result = await searchFolder(accessToken);

  if (result.value && result.value.length > 0) {
    console.log('Files in Velocity_Manco_Trackers:');
    console.log('─'.repeat(100));
    result.value.forEach(file => {
      const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
      if (file.name.includes('VF_Project') || file.name.includes('Mohadin') || file.name.includes('Tracker')) {
        console.log(`\n✅ MATCH: ${file.name}`);
        console.log(`   ID:   ${file.id}`);
        console.log(`   Size: ${sizeInMB} MB`);
        console.log(`   URL:  ${file.webUrl}`);
      } else {
        console.log(`   - ${file.name} (${sizeInMB} MB)`);
      }
    });
    console.log('\n' + '─'.repeat(100));
  } else {
    console.log('❌ No files found in folder');
  }
}

main().catch(console.error);
