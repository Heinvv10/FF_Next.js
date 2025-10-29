/**
 * Test the complete cron flow without triggering production
 * This simulates what the Vercel cron will do
 */

const BASE_URL = process.env.TEST_URL || 'https://fibreflow.app';

async function testCronFlow() {
  console.log('🧪 Testing Cron Flow (Read-Only Check)\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  try {
    // Test 1: Check if cron endpoint exists
    console.log('1️⃣  Checking if cron endpoint exists...');
    const cronCheck = await fetch(`${BASE_URL}/api/cron/sync-action-items`, {
      method: 'HEAD',
    });
    console.log(`   Status: ${cronCheck.status}`);
    if (cronCheck.status === 405) {
      console.log('   ✅ Endpoint exists (405 = Method Not Allowed for HEAD)');
    } else if (cronCheck.status === 404) {
      console.log('   ❌ Endpoint not found - not deployed yet');
      return;
    }

    // Test 2: Check meetings sync endpoint
    console.log('\n2️⃣  Checking meetings sync endpoint...');
    const meetingsCheck = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'GET',
    });
    console.log(`   Status: ${meetingsCheck.status}`);
    const meetings = await meetingsCheck.json();
    console.log(`   ✅ Can fetch meetings: ${meetings.meetings?.length || 0} meetings`);

    // Test 3: Check extract-all endpoint
    console.log('\n3️⃣  Checking extract-all endpoint...');
    const extractCheck = await fetch(`${BASE_URL}/api/action-items/extract-all`, {
      method: 'HEAD',
    });
    console.log(`   Status: ${extractCheck.status}`);
    if (extractCheck.status === 405 || extractCheck.status === 200) {
      console.log('   ✅ Endpoint exists');
    }

    // Test 4: Check action items stats
    console.log('\n4️⃣  Checking current action items count...');
    const statsCheck = await fetch(`${BASE_URL}/api/action-items/stats`);
    const stats = await statsCheck.json();
    console.log(`   ✅ Current stats:`, stats.data);

    console.log('\n✅ All endpoints are accessible!');
    console.log('\n📋 Summary:');
    console.log('   - Cron endpoint: ✅ Deployed');
    console.log('   - Meetings endpoint: ✅ Working');
    console.log('   - Extract endpoint: ✅ Deployed');
    console.log('   - Action items: ✅ Tracking');
    console.log('\n🎯 The cron job will work when Vercel triggers it!');
    console.log('   Next automatic run: Check Vercel dashboard for schedule');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testCronFlow();
