/**
 * Setup Suppliers Database using Next.js API pattern
 * This script creates the suppliers table and inserts sample data
 */

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aRNLhZc1G2CD@ep-dry-night-a9qyh4sj-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

async function setupSuppliersDatabase() {
  console.log('Setting up suppliers database...');

  try {
    // Use the same pattern as Next.js API
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    console.log('✓ Connected to Neon database');

    // Create the suppliers table
    console.log('Creating suppliers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100) DEFAULT 'Other',
        registration_number VARCHAR(100),
        tax_number VARCHAR(100),
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        website VARCHAR(255),

        -- Address information
        physical_address_street1 TEXT,
        physical_address_street2 TEXT,
        physical_address_city VARCHAR(100),
        physical_address_state VARCHAR(100),
        physical_address_postal_code VARCHAR(20),
        physical_address_country VARCHAR(100) DEFAULT 'South Africa',

        -- Supplier details
        is_preferred BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'PENDING',

        -- Categories and services
        categories TEXT[],
        services_offered TEXT[],

        -- Rating and performance
        overall_rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        performance_score DECIMAL(5,2) DEFAULT 0,

        -- Compliance
        tax_compliant BOOLEAN DEFAULT false,
        bee_compliant BOOLEAN DEFAULT false,
        insurance_valid BOOLEAN DEFAULT false,
        documents_verified BOOLEAN DEFAULT false,

        -- Contact information
        primary_contact_name VARCHAR(255),
        primary_contact_email VARCHAR(255),
        primary_contact_phone VARCHAR(50),

        -- Financial information
        bank_account_number VARCHAR(100),
        bank_name VARCHAR(255),
        bank_branch VARCHAR(255),

        -- Metadata
        notes TEXT,
        documents JSONB DEFAULT '{}',

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      )
    `;
    console.log('✓ Created suppliers table');

    // Create indexes for performance
    console.log('Creating indexes...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_company_name
      ON suppliers(company_name)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_status
      ON suppliers(status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_preferred
      ON suppliers(is_preferred)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_email
      ON suppliers(email)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_code
      ON suppliers(code)
    `;
    console.log('✓ Created all indexes');

    // Create full-text search index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_search
      ON suppliers USING GIN(
        to_tsvector('english',
          company_name || ' ' ||
          COALESCE(registration_number, '') || ' ' ||
          email || ' ' ||
          COALESCE(primary_contact_name, '') || ' ' ||
          COALESCE(notes, '')
        )
      )
    `;
    console.log('✓ Created search index');

    // Insert sample data for testing
    console.log('Inserting sample data...');
    await sql`
      INSERT INTO suppliers (
        code, company_name, business_type, email, phone,
        physical_address_city, status, is_preferred, categories,
        overall_rating, total_reviews, tax_compliant, bee_compliant,
        primary_contact_name, primary_contact_email, primary_contact_phone
      ) VALUES
        ('SUP-001', 'FiberTech Solutions', 'Fiber Cable Supplier', 'contact@fibertech.com', '011-123-4567', 'Johannesburg', 'ACTIVE', true, ARRAY['Fiber Cable', 'Network Equipment'], 4.5, 12, true, true, 'John Smith', 'john.smith@fibertech.com', '011-123-4567'),
        ('SUP-002', 'Network Connections', 'Network Equipment', 'info@networkconn.co.za', '021-234-5678', 'Cape Town', 'ACTIVE', false, ARRAY['Network Equipment', 'Connectors'], 3.8, 8, true, false, 'Sarah Johnson', 'sarah@networkconn.co.za', '021-234-5678'),
        ('SUP-003', 'Test Equipment SA', 'Test Equipment', 'sales@testequip.co.za', '012-345-6789', 'Pretoria', 'PENDING', false, ARRAY['Test Equipment', 'Consumables'], 0, 0, false, false, 'Mike Brown', 'mike@testequip.co.za', '012-345-6789'),
        ('SUP-004', 'Cable Suppliers Ltd', 'Fiber Cable Supplier', 'orders@cablesupp.co.za', '031-456-7890', 'Durban', 'ACTIVE', true, ARRAY['Fiber Cable', 'Consumables'], 4.2, 15, true, true, 'Lisa Williams', 'lisa@cablesupp.co.za', '031-456-7890')
      ON CONFLICT (code) DO NOTHING
    `;
    console.log('✓ Inserted sample suppliers data');

    // If that fails, try simpler insert without contact columns
    try {
      await sql`
        INSERT INTO suppliers (
          code, company_name, business_type, email, phone,
          physical_address_city, status, is_preferred, categories,
          overall_rating, total_reviews, tax_compliant, bee_compliant
        ) VALUES
          ('SUP-005', 'Simple Supplier', 'Test Supplier', 'test@simple.com', '011-999-8888', 'Johannesburg', 'ACTIVE', false, ARRAY['Test'], 0, 0, false, false)
        ON CONFLICT (code) DO NOTHING
      `;
      console.log('✓ Inserted simple test supplier');
    } catch (error) {
      console.log('ℹ Simple insert failed:', error.message);
    }

    // Verify the setup
    console.log('Verifying setup...');
    const count = await sql`SELECT COUNT(*) as total FROM suppliers`;
    console.log(`📊 Suppliers table contains ${count[0].total} records`);

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'suppliers'
    `;
    console.log(`✓ Table 'suppliers' exists: ${tables.length > 0}`);

    console.log('\n✅ Suppliers database setup completed successfully!');
    console.log('\nYou can now test the suppliers page at: http://localhost:3005/suppliers');

  } catch (error) {
    console.error('❌ Error setting up suppliers database:', error);
    process.exit(1);
  }
}

// Run the setup
setupSuppliersDatabase()
  .then(() => {
    console.log('\n🎉 Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });