const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createSuppliersTable() {
  console.log('Creating suppliers table in Neon database...');

  try {
    // Create the suppliers table
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_company_name
      ON suppliers(company_name)
    `;
    console.log('✓ Created idx_suppliers_company_name');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_status
      ON suppliers(status)
    `;
    console.log('✓ Created idx_suppliers_status');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_preferred
      ON suppliers(is_preferred)
    `;
    console.log('✓ Created idx_suppliers_preferred');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_email
      ON suppliers(email)
    `;
    console.log('✓ Created idx_suppliers_email');

    await sql`
      CREATE INDEX IF NOT EXISTS idx_suppliers_code
      ON suppliers(code)
    `;
    console.log('✓ Created idx_suppliers_code');

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
    console.log('✓ Created idx_suppliers_search');

    // Insert sample data for testing
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

    // Analyze the table to update statistics
    await sql`ANALYZE suppliers`;
    console.log('✓ Analyzed suppliers table');

    console.log('\n✅ Suppliers table setup completed successfully!');

    // Show table info
    const count = await sql`SELECT COUNT(*) as total FROM suppliers`;
    console.log(`\n📊 Suppliers table now contains ${count[0].total} records`);

  } catch (error) {
    console.error('❌ Error creating suppliers table:', error);
    process.exit(1);
  }
}

// Run the migration
createSuppliersTable()
  .then(() => {
    console.log('\n🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });