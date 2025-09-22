const { Client } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// PostgreSQL connection
const pgConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

async function importNokiaVelocityData() {
  const client = new Client(pgConfig);

  try {
    console.log('='.repeat(80));
    console.log('            NOKIA FIBERTIME VELOCITY DATA IMPORT');
    console.log('='.repeat(80));
    console.log(`Started: ${new Date().toISOString()}\n`);

    await client.connect();
    console.log('✓ Connected to database\n');

    const filePath = '/home/louisdup/Downloads/Lawley Nokia Fibertime week ending template VELOCITY 15092025.xlsx';
    const projectId = 'e2a61399-275a-4c44-8008-e9e42b7a3501'; // louissep15

    // Create Nokia velocity tables
    console.log('📊 Creating Nokia data tables...');

    // 1. Main Nokia velocity table
    await client.query(`
      CREATE TABLE IF NOT EXISTS nokia_velocity (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL,
        property_id VARCHAR(100),
        onemap_nad_id VARCHAR(100),
        job_id VARCHAR(100),
        status VARCHAR(255),
        flow_name_groups VARCHAR(255),
        site VARCHAR(50),
        sections INTEGER,
        pons INTEGER,
        location_address TEXT,
        latitude NUMERIC(10,8),
        longitude NUMERIC(11,8),
        distance_actual_captured NUMERIC,
        pole_number VARCHAR(100),
        drop_number VARCHAR(100),
        stand_number VARCHAR(100),

        -- Pole permission fields
        pole_permission_status VARCHAR(255),
        pole_permission_date TIMESTAMP,
        pole_permission_agent VARCHAR(255),
        pole_permission_lat NUMERIC(10,8),
        pole_permission_lng NUMERIC(11,8),

        -- Home signup fields
        home_signup_date TIMESTAMP,
        home_signup_agent VARCHAR(255),
        contact_name VARCHAR(255),
        contact_surname VARCHAR(255),
        contact_number VARCHAR(100),
        email_address VARCHAR(255),
        id_number VARCHAR(50),

        -- Installation fields
        ont_barcode VARCHAR(255),
        ont_activation_code VARCHAR(255),
        dome_joint_number VARCHAR(100),
        drop_cable_length NUMERIC,
        installer_name VARCHAR(255),
        installation_date TIMESTAMP,
        installation_status VARCHAR(255),

        -- Sales fields
        sales_agent VARCHAR(255),
        sales_date TIMESTAMP,

        -- Metadata
        last_modified_by VARCHAR(255),
        last_modified_date TIMESTAMP,
        date_status_changed TIMESTAMP,
        week_ending DATE,
        import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        raw_data JSONB,

        UNIQUE(project_id, property_id, week_ending)
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_project
      ON nokia_velocity(project_id);

      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_property
      ON nokia_velocity(property_id);

      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_pole
      ON nokia_velocity(pole_number);

      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_drop
      ON nokia_velocity(drop_number);

      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_status
      ON nokia_velocity(status);

      CREATE INDEX IF NOT EXISTS idx_nokia_velocity_week
      ON nokia_velocity(week_ending);
    `);

    console.log('✓ Nokia velocity tables created\n');

    // Read Excel file
    console.log('📁 Reading Nokia Excel file...');
    const workbook = XLSX.readFile(filePath);

    // Import 1Map Field App sheet (main data)
    const fieldAppSheet = workbook.Sheets['1Map Field App'];
    if (!fieldAppSheet) {
      throw new Error('1Map Field App sheet not found');
    }

    const data = XLSX.utils.sheet_to_json(fieldAppSheet, { header: 1 });

    // Find header row (typically row 3 or 4)
    let headerRow = -1;
    for (let i = 0; i < 10; i++) {
      if (data[i] && data[i][0] === 'Property ID') {
        headerRow = i;
        break;
      }
    }

    if (headerRow === -1) {
      throw new Error('Could not find header row with Property ID');
    }

    const headers = data[headerRow];
    const dataRows = data.slice(headerRow + 1).filter(row => row && row[0]); // Filter empty rows

    console.log(`Found ${dataRows.length} data rows to import\n`);

    // Create header index map
    const headerMap = {};
    headers.forEach((header, idx) => {
      if (header) {
        headerMap[header] = idx;
      }
    });

    // Import in batches
    const BATCH_SIZE = 500;
    let imported = 0;
    let updated = 0;
    let errors = 0;
    const weekEnding = '2025-09-15'; // From filename

    console.log('🚀 Importing Nokia velocity data...');

    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, Math.min(i + BATCH_SIZE, dataRows.length));

      for (const row of batch) {
        try {
          // Extract values using header map
          const getValue = (headerName) => {
            const idx = headerMap[headerName];
            return idx !== undefined ? row[idx] : null;
          };

          // Parse dates
          const parseDate = (val) => {
            if (!val) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'number') {
              // Excel serial date
              const date = new Date((val - 25569) * 86400 * 1000);
              return date;
            }
            return new Date(val);
          };

          // Prepare data
          const propertyId = getValue('Property ID');
          const poleNumber = getValue('Pole Number');
          const dropNumber = getValue('Drop Number');

          if (!propertyId) continue; // Skip if no property ID

          const insertData = {
            project_id: projectId,
            property_id: propertyId?.toString(),
            onemap_nad_id: getValue('1map NAD ID')?.toString(),
            job_id: getValue('Job ID')?.toString(),
            status: getValue('Status')?.toString(),
            flow_name_groups: getValue('Flow Name Groups')?.toString(),
            site: getValue('Site')?.toString(),
            sections: parseInt(getValue('Sections')) || null,
            pons: parseInt(getValue('PONs')) || null,
            location_address: getValue('Location Address')?.toString(),
            latitude: parseFloat(getValue('Latitude')) || null,
            longitude: parseFloat(getValue('Longitude')) || null,
            distance_actual_captured: parseFloat(getValue('Distance between Actual and Captured Point')) || null,
            pole_number: poleNumber?.toString(),
            drop_number: dropNumber?.toString(),
            stand_number: getValue('Stand Number')?.toString(),

            // Pole permission
            pole_permission_status: getValue('Pole Permission Status')?.toString(),
            pole_permission_date: parseDate(getValue('Date of Signature')),
            pole_permission_agent: getValue('Field Agent Name (pole permission)')?.toString(),
            pole_permission_lat: parseFloat(getValue('Pole Permissions - Actual Device Location (Latitude)')) || null,
            pole_permission_lng: parseFloat(getValue('Pole Permissions - Actual Device Location (Longitude)')) || null,

            // Home signup
            home_signup_date: parseDate(getValue('Last Modified Home Sign Ups Date')),
            home_signup_agent: getValue('Last Modified Home Sign Ups By')?.toString(),
            contact_name: getValue('Contact Name')?.toString(),
            contact_surname: getValue('Contact Surname')?.toString(),
            contact_number: getValue('Phone Number')?.toString(),
            email_address: getValue('Email Address')?.toString(),
            id_number: getValue('ID Number')?.toString(),

            // Installation
            ont_barcode: getValue('ONT Barcode')?.toString(),
            ont_activation_code: getValue('Nokia Easy Start ONT Activation Code')?.toString(),
            dome_joint_number: getValue('Dome Joint Number / BB')?.toString(),
            drop_cable_length: parseFloat(getValue('Length of Drop Cable')) || null,
            installer_name: getValue('Last Modified Home Installations By')?.toString(),
            installation_date: parseDate(getValue('Last Modified Home Installations Date')),

            // Sales
            sales_agent: getValue('Last Modified Sales By')?.toString(),
            sales_date: parseDate(getValue('Last Modified Sales Date')),

            // Metadata
            last_modified_by: getValue('lst_mod_by')?.toString(),
            last_modified_date: parseDate(getValue('lst_mod_dt')),
            date_status_changed: parseDate(getValue('date_status_changed')),
            week_ending: weekEnding,
            raw_data: JSON.stringify(row)
          };

          // Insert or update
          const query = `
            INSERT INTO nokia_velocity (
              project_id, property_id, onemap_nad_id, job_id, status,
              flow_name_groups, site, sections, pons, location_address,
              latitude, longitude, distance_actual_captured,
              pole_number, drop_number, stand_number,
              pole_permission_status, pole_permission_date, pole_permission_agent,
              pole_permission_lat, pole_permission_lng,
              home_signup_date, home_signup_agent,
              contact_name, contact_surname, contact_number, email_address, id_number,
              ont_barcode, ont_activation_code, dome_joint_number, drop_cable_length,
              installer_name, installation_date,
              sales_agent, sales_date,
              last_modified_by, last_modified_date, date_status_changed,
              week_ending, raw_data
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
              $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
            )
            ON CONFLICT (project_id, property_id, week_ending)
            DO UPDATE SET
              status = EXCLUDED.status,
              pole_number = EXCLUDED.pole_number,
              drop_number = EXCLUDED.drop_number,
              last_modified_date = EXCLUDED.last_modified_date,
              date_status_changed = EXCLUDED.date_status_changed,
              raw_data = EXCLUDED.raw_data,
              import_date = CURRENT_TIMESTAMP
            RETURNING id
          `;

          const values = [
            insertData.project_id, insertData.property_id, insertData.onemap_nad_id,
            insertData.job_id, insertData.status, insertData.flow_name_groups,
            insertData.site, insertData.sections, insertData.pons,
            insertData.location_address, insertData.latitude, insertData.longitude,
            insertData.distance_actual_captured, insertData.pole_number,
            insertData.drop_number, insertData.stand_number,
            insertData.pole_permission_status, insertData.pole_permission_date,
            insertData.pole_permission_agent, insertData.pole_permission_lat,
            insertData.pole_permission_lng, insertData.home_signup_date,
            insertData.home_signup_agent, insertData.contact_name,
            insertData.contact_surname, insertData.contact_number,
            insertData.email_address, insertData.id_number,
            insertData.ont_barcode, insertData.ont_activation_code,
            insertData.dome_joint_number, insertData.drop_cable_length,
            insertData.installer_name, insertData.installation_date,
            insertData.sales_agent, insertData.sales_date,
            insertData.last_modified_by, insertData.last_modified_date,
            insertData.date_status_changed, insertData.week_ending,
            insertData.raw_data
          ];

          const result = await client.query(query, values);
          if (result.rowCount > 0) {
            imported++;
          }

        } catch (err) {
          errors++;
          if (errors <= 5) {
            console.error(`Error importing row:`, err.message);
          }
        }
      }

      // Progress update
      const progress = Math.min(100, ((i + batch.length) / dataRows.length * 100)).toFixed(1);
      process.stdout.write(`\r  Progress: ${progress}% | Imported: ${imported} | Errors: ${errors}`);
    }

    console.log('\n\n✓ Nokia velocity data import completed');
    console.log(`  - Total records: ${dataRows.length}`);
    console.log(`  - Successfully imported: ${imported}`);
    console.log(`  - Errors: ${errors}\n`);

    // Generate statistics
    console.log('📊 Generating import statistics...\n');

    const stats = await client.query(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT property_id) as unique_properties,
        COUNT(DISTINCT pole_number) as unique_poles,
        COUNT(DISTINCT drop_number) as unique_drops,
        COUNT(CASE WHEN status LIKE '%Approved%' THEN 1 END) as approved,
        COUNT(CASE WHEN status LIKE '%Installed%' THEN 1 END) as installed,
        COUNT(CASE WHEN ont_barcode IS NOT NULL THEN 1 END) as with_ont
      FROM nokia_velocity
      WHERE project_id = $1 AND week_ending = $2
    `, [projectId, weekEnding]);

    const s = stats.rows[0];
    console.log('Import Summary:');
    console.log(`  Total Records: ${s.total_records}`);
    console.log(`  Unique Properties: ${s.unique_properties}`);
    console.log(`  Unique Poles: ${s.unique_poles}`);
    console.log(`  Unique Drops: ${s.unique_drops}`);
    console.log(`  Approved: ${s.approved}`);
    console.log(`  Installed: ${s.installed}`);
    console.log(`  With ONT: ${s.with_ont}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Nokia Velocity Import Complete!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run import
importNokiaVelocityData()
  .then(() => console.log('Process completed successfully'))
  .catch(err => console.error('Process failed:', err));