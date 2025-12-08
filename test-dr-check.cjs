#!/usr/bin/env node
const http = require('http');

http.get('http://localhost:3005/api/foto/photos', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log('✅ Total drops:', json.data.length);
        console.log('🔍 Looking for DR1734072...\n');

        const dr = json.data.find(d => d.dr_number === 'DR1734072');
        if (dr) {
          console.log('✅ FOUND DR1734072!');
          console.log('   Project:', dr.project);
          console.log('   Photos:', dr.photo_count + '/12');
          console.log('   Date:', dr.date);
        } else {
          console.log('❌ DR1734072 NOT FOUND in foto-review API');
          console.log('\n📋 Latest 5 drops:');
          json.data.slice(0, 5).forEach(d => {
            console.log('  -', d.dr_number, '|', d.project, '| Photos:', d.photo_count + '/12');
          });
        }
      }
    } catch (err) {
      console.error('❌ Parse error:', err.message);
    }
  });
}).on('error', err => console.error('❌ Request error:', err.message));
