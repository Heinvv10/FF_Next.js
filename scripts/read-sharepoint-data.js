#!/usr/bin/env node
/**
 * Read SharePoint NeonDbase sheet to verify what data is there
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

async function readRange(accessToken, range) {
  return new Promise((resolve, reject) => {
    const path = `/v1.0/drives/${DRIVE_ID}/items/${FILE_ID}/workbook/worksheets/${WORKSHEET_NAME}/range(address='${range}')`;

    const options = {
      hostname: 'graph.microsoft.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    console.log('📖 Reading rows 1-15 from NeonDbase sheet...\n');
    const data = await readRange(accessToken, 'A1:C15');

    console.log('Data in SharePoint:');
    console.log('='.repeat(60));

    data.values.forEach((row, index) => {
      const rowNum = index + 1;
      const [date, project, count] = row;
      console.log(`Row ${rowNum}: ${date || '(empty)'} | ${project || '(empty)'} | ${count || '(empty)'}`);
    });

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
