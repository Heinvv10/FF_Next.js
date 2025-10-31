#!/usr/bin/env node

/**
 * Check contractor documents in production database
 */

require('dotenv').config({ path: ['.env.production.local', '.env.local', '.env.production', '.env'] });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);
const contractorId = '9ff731e1-eceb-40bb-8d9c-37635dc576b2';

async function checkDocuments() {
  console.log(`🔍 Checking documents for contractor: ${contractorId}`);
  console.log('');

  try {
    // Check if contractor exists
    const [contractor] = await sql`
      SELECT id, company_name FROM contractors WHERE id = ${contractorId}
    `;

    if (!contractor) {
      console.log('❌ Contractor not found in database');
      return;
    }

    console.log(`✓ Contractor found: ${contractor.company_name}`);
    console.log('');

    // Check documents
    const documents = await sql`
      SELECT id, document_name, document_type, status, created_at
      FROM contractor_documents
      WHERE contractor_id = ${contractorId}
      ORDER BY created_at DESC
    `;

    console.log(`📄 Documents in database: ${documents.length}`);
    console.log('');

    if (documents.length > 0) {
      documents.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.document_name}`);
        console.log(`   Type: ${doc.document_type}`);
        console.log(`   Status: ${doc.status}`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Created: ${doc.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No documents found in database');
      console.log('');
      console.log('This means:');
      console.log('- Documents may exist in Firebase Storage but not in database');
      console.log('- Need to re-upload documents after migration');
      console.log('- Or sync existing Firebase documents to database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDocuments();
