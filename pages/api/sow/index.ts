import type { NextApiRequest, NextApiResponse } from 'next';
// import { getAuth } from '@clerk/nextjs/server';
import { getAuth } from '../../../lib/auth-mock';
import { withErrorHandler } from '@/lib/api-error-handler';
import { createLoggedSql, logCreate, logUpdate, logDelete } from '@/lib/db-logger';

const sql = createLoggedSql(process.env.DATABASE_URL!);

type SOWData = {
  success: boolean;
  data: any;
  message?: string;
  error?: string;
};

export default withErrorHandler(async (
  req: NextApiRequest,
  res: NextApiResponse<SOWData>
) => {
  // Check authentication
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, data: null, message: 'Unauthorized' });
  }

  try {
    const { action, projectId } = req.query;

    switch (req.method) {
      case 'GET':
        if (projectId && !action) {
          // Get all SOW data for a project
          return await handleGetProjectSOW(req, res, projectId as string);
        }
        return res.status(400).json({ success: false, data: null, error: 'Invalid GET request' });

      case 'POST':
        if (!action) {
          return res.status(400).json({ success: false, data: null, error: 'Action required for POST requests' });
        }

        switch (action) {
          case 'initialize':
            return await handleInitializeTables(req, res);
          case 'poles':
            return await handleUploadPoles(req, res);
          case 'drops':
            return await handleUploadDrops(req, res);
          case 'fibre':
            return await handleUploadFibre(req, res);
          default:
            return res.status(400).json({ success: false, data: null, error: 'Invalid action' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, data: null, message: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('SOW API Error:', error);
    return res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
});

async function handleGetProjectSOW(req: NextApiRequest, res: NextApiResponse<SOWData>, projectId: string) {
  try {
    // First ensure tables exist
    await ensureTablesExist();
    
    const [poles, drops, fibre] = await Promise.all([
      sql`SELECT * FROM sow_poles WHERE project_id = ${projectId}::uuid ORDER BY created_at DESC`,
      sql`SELECT * FROM sow_drops WHERE project_id = ${projectId}::uuid ORDER BY created_at DESC`,
      sql`SELECT * FROM sow_fibre WHERE project_id = ${projectId}::uuid ORDER BY created_at DESC`
    ]);

    return res.status(200).json({
      success: true,
      data: {
        poles: poles || [],
        drops: drops || [],
        fibre: fibre || [],
        summary: {
          totalPoles: poles?.length || 0,
          totalDrops: drops?.length || 0,
          totalFibre: fibre?.length || 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching SOW data:', error);
    return res.status(500).json({ success: false, data: null, error: 'Failed to fetch SOW data' });
  }
}

async function ensureTablesExist() {
  // Create SOW tables if they don't exist
  await sql`
    CREATE TABLE IF NOT EXISTS sow_poles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID,
      pole_number VARCHAR(255) NOT NULL,
      location VARCHAR(500),
      pole_type VARCHAR(100),
      height DECIMAL(10,2),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      status VARCHAR(50) DEFAULT 'pending',
      installation_date DATE,
      installed_by VARCHAR(255),
      inspection_status VARCHAR(50),
      inspection_date DATE,
      notes TEXT,
      photos JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS sow_drops (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID,
      drop_number VARCHAR(255) NOT NULL,
      address VARCHAR(500),
      drop_type VARCHAR(100),
      cable_length DECIMAL(10,2),
      cable_type VARCHAR(100),
      customer_name VARCHAR(255),
      customer_phone VARCHAR(20),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      status VARCHAR(50) DEFAULT 'pending',
      installation_date DATE,
      installed_by VARCHAR(255),
      tested BOOLEAN DEFAULT FALSE,
      test_date DATE,
      test_results JSONB DEFAULT '{}',
      notes TEXT,
      photos JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS sow_fibre (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID,
      cable_id VARCHAR(255) NOT NULL,
      cable_type VARCHAR(100),
      cable_size VARCHAR(50),
      fiber_count INTEGER,
      start_location VARCHAR(255),
      end_location VARCHAR(255),
      start_latitude DECIMAL(10,8),
      start_longitude DECIMAL(11,8),
      end_latitude DECIMAL(10,8),
      end_longitude DECIMAL(11,8),
      length DECIMAL(10,2),
      installation_method VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      installation_date DATE,
      installed_by VARCHAR(255),
      splicing_complete BOOLEAN DEFAULT FALSE,
      splicing_date DATE,
      testing_complete BOOLEAN DEFAULT FALSE,
      test_date DATE,
      test_results JSONB DEFAULT '{}',
      notes TEXT,
      route_map JSONB DEFAULT '[]',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
}

async function handleInitializeTables(req: NextApiRequest, res: NextApiResponse<SOWData>) {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ success: false, data: null, error: 'Project ID required' });
    }

    // Initialize SOW tables for the project (if needed)
    await sql`
      CREATE TABLE IF NOT EXISTS sow_poles (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        pole_number VARCHAR(255),
        location VARCHAR(255),
        pole_type VARCHAR(100),
        height DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sow_drops (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        drop_number VARCHAR(255),
        address VARCHAR(500),
        drop_type VARCHAR(100),
        cable_length DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sow_fibre (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(255) NOT NULL,
        cable_id VARCHAR(255),
        start_location VARCHAR(255),
        end_location VARCHAR(255),
        cable_type VARCHAR(100),
        length DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return res.status(200).json({ success: true, data: null, message: 'Tables initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing tables:', error);
    return res.status(500).json({ success: false, data: null, error: 'Failed to initialize tables' });
  }
}

async function handleUploadPoles(req: NextApiRequest, res: NextApiResponse<SOWData>) {
  try {
    const { projectId, poles } = req.body;
    
    if (!projectId || !Array.isArray(poles)) {
      return res.status(400).json({ success: false, data: null, error: 'Project ID and poles array required' });
    }

    await ensureTablesExist();

    const insertedPoles = [];
    for (const pole of poles) {
      const result = await sql`
        INSERT INTO sow_poles (project_id, pole_number, location, pole_type, height, status)
        VALUES (${projectId}::uuid, ${pole.pole_number}, ${pole.location}, ${pole.pole_type}, ${pole.height}, ${pole.status || 'pending'})
        RETURNING *
      `;
      insertedPoles.push(result[0]);
    }

    // Log SOW poles creation
    if (insertedPoles.length > 0) {
      logCreate('sow_poles_batch', projectId as string, {
        count: insertedPoles.length,
        project_id: projectId,
        uploaded_by: userId
      });
    }

    return res.status(201).json({ success: true, data: insertedPoles, message: `${insertedPoles.length} poles uploaded` });
  } catch (error: any) {
    console.error('Error uploading poles:', error);
    return res.status(500).json({ success: false, data: null, error: 'Failed to upload poles' });
  }
}

async function handleUploadDrops(req: NextApiRequest, res: NextApiResponse<SOWData>) {
  try {
    const { projectId, drops } = req.body;
    
    if (!projectId || !Array.isArray(drops)) {
      return res.status(400).json({ success: false, data: null, error: 'Project ID and drops array required' });
    }

    await ensureTablesExist();

    const insertedDrops = [];
    for (const drop of drops) {
      const result = await sql`
        INSERT INTO sow_drops (project_id, drop_number, address, drop_type, cable_length, status)
        VALUES (${projectId}::uuid, ${drop.drop_number}, ${drop.address}, ${drop.drop_type}, ${drop.cable_length}, ${drop.status || 'pending'})
        RETURNING *
      `;
      insertedDrops.push(result[0]);
    }

    // Log SOW drops creation
    if (insertedDrops.length > 0) {
      logCreate('sow_drops_batch', projectId as string, {
        count: insertedDrops.length,
        project_id: projectId,
        uploaded_by: userId
      });
    }

    return res.status(201).json({ success: true, data: insertedDrops, message: `${insertedDrops.length} drops uploaded` });
  } catch (error: any) {
    console.error('Error uploading drops:', error);
    return res.status(500).json({ success: false, data: null, error: 'Failed to upload drops' });
  }
}

async function handleUploadFibre(req: NextApiRequest, res: NextApiResponse<SOWData>) {
  try {
    const { projectId, fibre } = req.body;
    
    if (!projectId || !Array.isArray(fibre)) {
      return res.status(400).json({ success: false, data: null, error: 'Project ID and fibre array required' });
    }

    await ensureTablesExist();

    const insertedFibre = [];
    for (const cable of fibre) {
      const result = await sql`
        INSERT INTO sow_fibre (project_id, cable_id, start_location, end_location, cable_type, length, status)
        VALUES (${projectId}::uuid, ${cable.cable_id}, ${cable.start_location}, ${cable.end_location}, ${cable.cable_type}, ${cable.length}, ${cable.status || 'pending'})
        RETURNING *
      `;
      insertedFibre.push(result[0]);
    }

    // Log SOW fibre creation
    if (insertedFibre.length > 0) {
      logCreate('sow_fibre_batch', projectId as string, {
        count: insertedFibre.length,
        project_id: projectId,
        uploaded_by: userId
      });
    }

    return res.status(201).json({ success: true, data: insertedFibre, message: `${insertedFibre.length} fibre cables uploaded` });
  } catch (error: any) {
    console.error('Error uploading fibre:', error);
    return res.status(500).json({ success: false, data: null, error: 'Failed to upload fibre' });
  }
}