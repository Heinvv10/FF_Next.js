#!/usr/bin/env tsx
/**
 * Integration test for contractor document upload with Neon PostgreSQL storage
 * Tests the complete workflow from service layer to database storage
 */

import { contractorDocumentService } from '../src/services/contractor/contractorDocumentService';
import { neonFileStorageService } from '../src/services/contractor/neonFileStorageService';
import { contractorApiService } from '../src/services/contractor/contractorApiService';
import { DocumentType } from '../src/types/contractor.types';
import { log } from '../src/lib/logger';

async function testContractorDocumentUpload() {
  console.log('🧪 Testing Contractor Document Upload with Neon PostgreSQL...\n');

  try {
    // Test 1: Get existing contractors
    console.log('1️⃣ Getting existing contractors...');
    const contractors = await contractorApiService.getAll();
    console.log(`   Found ${contractors.length} contractors`);

    if (contractors.length === 0) {
      throw new Error('No contractors found for testing');
    }

    const testContractor = contractors[0];
    console.log(`   Using contractor: ${testContractor.companyName} (${testContractor.id})`);

    // Test 2: Get current documents
    console.log('\n2️⃣ Getting current documents...');
    const currentDocs = await contractorDocumentService.getByContractor(testContractor.id);
    console.log(`   Current document count: ${currentDocs.length}`);

    // Test 3: Create test document data
    console.log('\n3️⃣ Preparing test document...');
    const testFileContent = 'This is a test company registration document for Neon PostgreSQL storage verification. ' +
      'This document contains all the necessary information to validate the file storage system. ' +
      'Created at: ' + new Date().toISOString();

    const fileBuffer = Buffer.from(testFileContent);

    const documentData = {
      documentType: DocumentType.COMPANY_REGISTRATION,
      documentName: 'Test Company Registration Certificate',
      fileName: 'company-registration-test.pdf',
      fileBuffer,
      fileSize: fileBuffer.length,
      mimeType: 'application/pdf',
      issueDate: new Date(),
      notes: 'Test document uploaded via integration test'
    };

    console.log(`   File size: ${fileBuffer.length} bytes`);
    console.log(`   Document type: ${documentData.documentType}`);

    // Test 4: Upload document
    console.log('\n4️⃣ Uploading document to Neon PostgreSQL...');
    const documentId = await contractorDocumentService.uploadDocument(testContractor.id, documentData);
    console.log(`   ✅ Document uploaded successfully: ${documentId}`);

    // Test 5: Verify document in database
    console.log('\n5️⃣ Verifying document in database...');
    const updatedDocs = await contractorDocumentService.getByContractor(testContractor.id);
    const newDoc = updatedDocs.find(doc => doc.id === documentId);

    if (!newDoc) {
      throw new Error('Uploaded document not found in database');
    }

    console.log('   ✅ Document found in database:');
    console.log(`      - ID: ${newDoc.id}`);
    console.log(`      - Name: ${newDoc.documentName}`);
    console.log(`      - File: ${newDoc.fileName}`);
    console.log(`      - Type: ${newDoc.documentType}`);
    console.log(`      - Storage: ${newDoc.storageType}`);
    console.log(`      - Storage ID: ${newDoc.storageId}`);
    console.log(`      - Status: ${newDoc.status}`);
    console.log(`      - Created: ${newDoc.createdAt}`);

    // Test 6: Retrieve file from storage
    console.log('\n6️⃣ Retrieving file from Neon storage...');
    const retrievedFile = await contractorDocumentService.retrieveDocument(documentId);
    console.log('   ✅ File retrieved successfully:');
    console.log(`      - Name: ${retrievedFile.fileName}`);
    console.log(`      - Size: ${retrievedFile.fileSize} bytes`);
    console.log(`      - Type: ${retrievedFile.mimeType}`);

    // Verify file integrity
    const retrievedContent = retrievedFile.fileData.toString();
    if (retrievedContent !== testFileContent) {
      throw new Error('File content integrity check failed');
    }
    console.log('   ✅ File integrity verified');

    // Test 7: Verify storage service directly
    console.log('\n7️⃣ Verifying storage service directly...');
    if (newDoc.storageId) {
      const storageFile = await neonFileStorageService.retrieveFile(newDoc.storageId);
      console.log('   ✅ Direct storage access successful:');
      console.log(`      - Storage ID: ${storageFile.fileHash}`);
      console.log(`      - Original size: ${storageFile.originalSize} bytes`);
      console.log(`      - MIME type: ${storageFile.mimeType}`);
    }

    // Test 8: Get updated storage stats
    console.log('\n8️⃣ Getting updated storage statistics...');
    const storageStats = await neonFileStorageService.getStorageStats();
    console.log('   Storage statistics:');
    console.log(`      - Total files: ${storageStats.totalFiles}`);
    console.log(`      - Total size: ${storageStats.totalSize} bytes`);
    console.log(`      - Average size: ${Math.round(storageStats.averageFileSize)} bytes`);
    console.log(`      - Compression ratio: ${storageStats.compressionRatio.toFixed(2)}`);

    // Test 9: Clean up - delete test document
    console.log('\n9️⃣ Cleaning up test document...');
    await contractorDocumentService.deleteDocument(documentId);
    console.log('   ✅ Test document deleted successfully');

    // Verify deletion
    const finalDocs = await contractorDocumentService.getByContractor(testContractor.id);
    if (finalDocs.some(doc => doc.id === documentId)) {
      throw new Error('Document deletion failed');
    }
    console.log('   ✅ Document deletion verified');

    console.log('\n🎉 All contractor document tests passed successfully!');
    console.log('\n📋 Integration Test Summary:');
    console.log('   ✅ Contractor retrieval works');
    console.log('   ✅ Document upload to Neon PostgreSQL works');
    console.log('   ✅ File storage and retrieval works');
    console.log('   ✅ File integrity verification works');
    console.log('   ✅ Database metadata management works');
    console.log('   ✅ Storage service integration works');
    console.log('   ✅ Document deletion works');
    console.log('   ✅ End-to-end workflow verified');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await testContractorDocumentUpload();
    console.log('\n✅ Contractor document upload system is production-ready!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    process.exit(1);
  }
}

main();