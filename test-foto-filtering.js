/**
 * Test script for /api/foto/photos filtering
 * Tests project and date range filtering
 */

const BASE_URL = 'http://localhost:3005/api/foto/photos';

async function testAPI(url, description) {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${description}`);
    console.log(`URL: ${url}`);
    console.log(`${'='.repeat(60)}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Results: ${data.data ? data.data.length : 0} DRs`);

    if (data.data && data.data.length > 0) {
      data.data.forEach((dr, index) => {
        console.log(`  ${index + 1}. ${dr.dr_number} - ${dr.project} - ${new Date(dr.installation_date).toISOString().split('T')[0]}`);
      });
    } else {
      console.log('  (No results)');
    }

    return { success: response.status === 200, data };
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 FOTO PHOTOS API FILTERING TESTS\n');

  // Test 1: Get all photos (no filter)
  await testAPI(BASE_URL, 'Get all photos (no filter)');

  // Test 2: Filter by project - Lawley
  await testAPI(`${BASE_URL}?project=Lawley`, 'Filter by project: Lawley');

  // Test 3: Filter by project - Mohadin
  await testAPI(`${BASE_URL}?project=Mohadin`, 'Filter by project: Mohadin');

  // Test 4: Filter by project - invalid project
  await testAPI(`${BASE_URL}?project=NonExistent`, 'Filter by invalid project (should return empty)');

  // Test 5: Filter by date range (December 1-2, 2024)
  await testAPI(`${BASE_URL}?startDate=2024-12-01&endDate=2024-12-02`, 'Filter by date range: Dec 1-2, 2024');

  // Test 6: Filter by start date only
  await testAPI(`${BASE_URL}?startDate=2024-12-01`, 'Filter by start date only: Dec 1, 2024');

  // Test 7: Filter by end date only
  await testAPI(`${BASE_URL}?endDate=2024-11-30`, 'Filter by end date only: before Nov 30, 2024');

  // Test 8: Invalid date format
  await testAPI(`${BASE_URL}?startDate=invalid-date`, 'Invalid date format (should return 400 error)');

  // Test 9: Combined filter (project + date)
  await testAPI(`${BASE_URL}?project=Lawley&startDate=2024-11-28&endDate=2024-12-02`, 'Combined: Lawley + Date range');

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch(console.error);
