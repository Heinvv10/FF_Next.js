#!/usr/bin/env node
/**
 * Update today's counts in SharePoint (rows 9-10)
 */

const https = require('https');

const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';
const CLIENT_SECRET = 'inw8Q~gtHfV~foOn43wSNEvnGP~IO7zmLviejaw5';
const SITE_ID = 'blitzfibre.sharepoint.com,cf8186e7-97cd-4aff-9d7f-e41cf213eff8,0e6533f4-d910-46e1-af3c-10ea74b3efd7';
const DRIVE_ID = 'b!54aBz82X_0qdf-Qc8hPv-PQzZQ4Q2eFGrzwQ6nSz79cVH1Quyz5vQavmQwdsBGRy';
const FILE_ID = '01XUF54KEJXOBUYOTDK5CYAYD7TODCKBYY';
const WORKSHEET_NAME = 'NeonDbase';

async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const postData = params.toString();
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
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).access_token);
        } else {
          reject(new Error(`Failed to get token: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateCell(accessToken, row, col, value) {
  return new Promise((resolve, reject) => {
    const path = `/v1.0/drives/${DRIVE_ID}/items/${FILE_ID}/workbook/worksheets/${WORKSHEET_NAME}/range(address='${col}${row}')`;
    const body = JSON.stringify({ values: [[value]] });

    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: path,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('📝 Updating today\'s counts in SharePoint...\n');

    // Update Row 9: Lawley 5 → 11
    await updateCell(accessToken, 9, 'C', 11);
    console.log('✅ Row 9: Lawley count updated to 11');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update Row 10: Velo Test 1 → 3
    await updateCell(accessToken, 10, 'C', 3);
    console.log('✅ Row 10: Velo Test count updated to 3');

    console.log('\n✅ SharePoint now matches dashboard!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
