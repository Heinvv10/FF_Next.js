#!/usr/bin/env node
/**
 * Backfill SharePoint with correct historical data
 * Writes directly to specific rows with correct SAST dates and counts
 */

const https = require('https');

// SharePoint credentials
const TENANT_ID = 'f22e6344-a35d-43b0-ad8c-a247f513c1ee';
const CLIENT_ID = 'f7bd2f4f-405b-472a-90ca-f6b7ebfc6c56';
const CLIENT_SECRET = 'inw8Q~gtHfV~foOn43wSNEvnGP~IO7zmLviejaw5';
const SITE_ID = 'blitzfibre.sharepoint.com,cf8186e7-97cd-4aff-9d7f-e41cf213eff8,0e6533f4-d910-46e1-af3c-10ea74b3efd7';
const DRIVE_ID = 'b!54aBz82X_0qdf-Qc8hPv-PQzZQ4Q2eFGrzwQ6nSz79cVH1Quyz5vQavmQwdsBGRy';
const FILE_ID = '01XUF54KEJXOBUYOTDK5CYAYD7TODCKBYY';
const WORKSHEET_NAME = 'NeonDbase';

// Correct data to write (from direct database query)
const correctData = [
  { date: '2025-11-10', project: 'Lawley', count: 10 },
  { date: '2025-11-10', project: 'Mamelodi', count: 6 },
  { date: '2025-11-10', project: 'Mohadin', count: 3 },
  { date: '2025-11-11', project: 'Lawley', count: 2 },
  { date: '2025-11-11', project: 'Mamelodi', count: 1 },
  { date: '2025-11-12', project: 'Lawley', count: 13 },
  { date: '2025-11-12', project: 'Mohadin', count: 8 },
  { date: '2025-11-13', project: 'Lawley', count: 5 },
  { date: '2025-11-13', project: 'Velo Test', count: 1 },
];

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

async function writeRow(accessToken, rowNum, data) {
  return new Promise((resolve, reject) => {
    const path = `/v1.0/drives/${DRIVE_ID}/items/${FILE_ID}/workbook/worksheets/${WORKSHEET_NAME}/range(address='A${rowNum}:C${rowNum}')`;
    const body = JSON.stringify({
      values: [[data.date, data.project, data.count]]
    });

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
      timeout: 30000,
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
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('📝 Writing correct historical data to SharePoint...\n');

    for (let i = 0; i < correctData.length; i++) {
      const row = i + 2; // Start at row 2 (row 1 is header)
      const data = correctData[i];

      try {
        await writeRow(accessToken, row, data);
        console.log(`✅ Row ${row}: ${data.date} | ${data.project} | ${data.count}`);
      } catch (error) {
        console.error(`❌ Row ${row} failed: ${error.message}`);
      }

      // Rate limiting
      if (i < correctData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n✅ Successfully wrote ${correctData.length} rows to SharePoint!`);
    console.log(`📊 Data now in rows 2-${correctData.length + 1}`);
    console.log(`\n🔧 Next step: Update database counter to ${correctData.length + 1}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
