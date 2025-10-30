#!/usr/bin/env node
/**
 * Automated API Tests for Contractor Documents
 * Tests upload, list, update, verify, and delete endpoints
 */

import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3005';

// Test results tracker
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Store document ID for subsequent tests
let uploadedDocumentId = null;
let contractorId = null;

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, message) {
  testsRun++;
  if (condition) {
    testsPassed++;
    log(`  ✓ ${message}`, 'green');
    return true;
  } else {
    testsFailed++;
    log(`  ✗ ${message}`, 'red');
    return false;
  }
}

// Create a dummy PDF file in memory
function createDummyPDF() {
  // Minimal valid PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
409
%%EOF`;

  return Buffer.from(pdfContent);
}

// Get a real contractor ID from the database
async function getTestContractorId() {
  try {
    const response = await fetch(`${BASE_URL}/api/contractors`);
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }

    throw new Error('No contractors found in database');
  } catch (error) {
    log('\n⚠️  Could not fetch contractor from database', 'yellow');
    log('Please ensure you have at least one contractor in the system', 'yellow');
    throw error;
  }
}

// Test 1: Upload Document
async function testUploadDocument() {
  log('\n📤 Test 1: Upload Document', 'blue');

  try {
    const form = new FormData();
    const pdfBuffer = createDummyPDF();

    form.append('contractorId', contractorId);
    form.append('documentType', 'insurance_liability');
    form.append('documentName', 'Test Public Liability Insurance');
    form.append('documentNumber', 'TEST-2025-001');
    form.append('issueDate', '2025-01-01');
    form.append('expiryDate', '2026-01-01');
    form.append('notes', 'Automated test document');
    form.append('uploadedBy', 'test-script@fibreflow.com');
    form.append('file', pdfBuffer, {
      filename: 'test-insurance.pdf',
      contentType: 'application/pdf',
    });

    const response = await fetch(`${BASE_URL}/api/contractors-documents-upload`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const data = await response.json();

    assert(response.status === 201, 'Returns 201 status');
    assert(data.success === true, 'Response has success: true');
    assert(data.data?.id, 'Response contains document ID');
    assert(data.data?.fileUrl, 'Response contains file URL');
    assert(data.data?.documentType === 'insurance_liability', 'Document type correct');
    assert(data.data?.status === 'pending', 'Initial status is pending');
    assert(data.data?.isVerified === false, 'Initially not verified');

    uploadedDocumentId = data.data?.id;

    if (uploadedDocumentId) {
      log(`  → Document ID: ${uploadedDocumentId}`, 'blue');
    }

    return true;
  } catch (error) {
    log(`  ✗ Upload failed: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: List Documents
async function testListDocuments() {
  log('\n📋 Test 2: List Documents', 'blue');

  try {
    const response = await fetch(
      `${BASE_URL}/api/contractors-documents?contractorId=${contractorId}`
    );
    const data = await response.json();

    assert(response.status === 200, 'Returns 200 status');
    assert(data.success === true, 'Response has success: true');
    assert(Array.isArray(data.data), 'Response data is an array');
    assert(data.data.length > 0, 'At least one document returned');

    const uploadedDoc = data.data.find(doc => doc.id === uploadedDocumentId);
    assert(uploadedDoc !== undefined, 'Uploaded document found in list');

    if (uploadedDoc) {
      assert(uploadedDoc.daysUntilExpiry !== undefined, 'Days until expiry calculated');
      assert(uploadedDoc.isExpired === false, 'Document not expired');
      log(`  → Days until expiry: ${uploadedDoc.daysUntilExpiry}`, 'blue');
    }

    return true;
  } catch (error) {
    log(`  ✗ List failed: ${error.message}`, 'red');
    return false;
  }
}

// Test 3: Update Document
async function testUpdateDocument() {
  log('\n✏️  Test 3: Update Document', 'blue');

  if (!uploadedDocumentId) {
    log('  ⊘ Skipped (no document ID)', 'yellow');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/contractors-documents-update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uploadedDocumentId,
        documentName: 'Updated Test Insurance',
        notes: 'Updated by automated test',
      }),
    });

    const data = await response.json();

    assert(response.status === 200, 'Returns 200 status');
    assert(data.success === true, 'Response has success: true');
    assert(data.data?.documentName === 'Updated Test Insurance', 'Document name updated');
    assert(data.data?.notes === 'Updated by automated test', 'Notes updated');

    return true;
  } catch (error) {
    log(`  ✗ Update failed: ${error.message}`, 'red');
    return false;
  }
}

// Test 4: Verify (Approve) Document
async function testVerifyDocument() {
  log('\n✅ Test 4: Verify Document', 'blue');

  if (!uploadedDocumentId) {
    log('  ⊘ Skipped (no document ID)', 'yellow');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/contractors-documents-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uploadedDocumentId,
        action: 'approve',
        verifiedBy: 'test-admin@fibreflow.com',
        verificationNotes: 'Approved by automated test',
      }),
    });

    const data = await response.json();

    assert(response.status === 200, 'Returns 200 status');
    assert(data.success === true, 'Response has success: true');
    assert(data.data?.status === 'approved', 'Status changed to approved');
    assert(data.data?.isVerified === true, 'Document marked as verified');
    assert(data.data?.verifiedBy === 'test-admin@fibreflow.com', 'Verified by recorded');
    assert(data.data?.verifiedAt, 'Verification timestamp set');

    return true;
  } catch (error) {
    log(`  ✗ Verify failed: ${error.message}`, 'red');
    return false;
  }
}

// Test 5: Delete Document
async function testDeleteDocument() {
  log('\n🗑️  Test 5: Delete Document', 'blue');

  if (!uploadedDocumentId) {
    log('  ⊘ Skipped (no document ID)', 'yellow');
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/contractors-documents-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: uploadedDocumentId,
      }),
    });

    const data = await response.json();

    assert(response.status === 200, 'Returns 200 status');
    assert(data.success === true, 'Response has success: true');
    assert(data.message, 'Response contains success message');

    // Verify document is actually deleted
    const listResponse = await fetch(
      `${BASE_URL}/api/contractors-documents?contractorId=${contractorId}`
    );
    const listData = await listResponse.json();
    const deletedDoc = listData.data.find(doc => doc.id === uploadedDocumentId);

    assert(deletedDoc === undefined, 'Document removed from list');

    return true;
  } catch (error) {
    log(`  ✗ Delete failed: ${error.message}`, 'red');
    return false;
  }
}

// Run all tests
async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Contractor Documents API - Test Suite    ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  log(`Testing against: ${BASE_URL}`, 'blue');

  try {
    // Get a real contractor ID
    log('\n🔍 Fetching test contractor...', 'blue');
    contractorId = await getTestContractorId();
    log(`  → Using contractor ID: ${contractorId}`, 'blue');

    // Run tests sequentially
    await testUploadDocument();
    await testListDocuments();
    await testUpdateDocument();
    await testVerifyDocument();
    await testDeleteDocument();

    // Summary
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║           Test Results Summary             ║', 'blue');
    log('╚════════════════════════════════════════════╝\n', 'blue');

    log(`Total Tests:  ${testsRun}`, 'blue');
    log(`Passed:       ${testsPassed}`, 'green');
    log(`Failed:       ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');

    const successRate = ((testsPassed / testsRun) * 100).toFixed(1);
    log(`Success Rate: ${successRate}%\n`, testsFailed > 0 ? 'yellow' : 'green');

    if (testsFailed === 0) {
      log('🎉 All tests passed! Backend is ready for frontend.\n', 'green');
      process.exit(0);
    } else {
      log('⚠️  Some tests failed. Check the output above.\n', 'red');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}\n`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests();
