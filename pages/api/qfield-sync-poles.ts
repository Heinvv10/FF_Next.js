/**
 * API endpoint for fetching pole data for QField Sync comparison
 * Returns both QFieldCloud and FibreFlow pole data for field verification
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    // Fetch FibreFlow pole data from the poles table
    let fibreFlowResult;

    if (projectId) {
      fibreFlowResult = await sql`
        SELECT
          pole_number,
          type as pole_type,
          height,
          material,
          status,
          installation_date,
          latitude,
          longitude,
          address,
          notes,
          COALESCE(jsonb_array_length(images), 0) as image_count,
          inspection_data,
          created_at,
          updated_at,
          'fibreflow' as source
        FROM poles
        WHERE project_id = ${projectId}
        ORDER BY pole_number
        LIMIT 200
      `;
    } else {
      fibreFlowResult = await sql`
        SELECT
          pole_number,
          type as pole_type,
          height,
          material,
          status,
          installation_date,
          latitude,
          longitude,
          address,
          notes,
          COALESCE(jsonb_array_length(images), 0) as image_count,
          inspection_data,
          created_at,
          updated_at,
          'fibreflow' as source
        FROM poles
        ORDER BY pole_number
        LIMIT 200
      `;
    }

    // Simulate QFieldCloud data for testing
    // In production, this would call the actual QFieldCloud API
    const qfieldData = [];

    // Mock some QFieldCloud data (simulate field updates)
    if (fibreFlowResult.length > 0) {
      const mockQFieldPoles = fibreFlowResult.slice(0, Math.min(10, fibreFlowResult.length)).map(pole => ({
        ...pole,
        source: 'qfieldcloud',
        status: pole.status === 'pending' ? 'installed' : pole.status, // Simulate field updates
        installation_date: pole.status === 'pending' ? new Date().toISOString().split('T')[0] : pole.installation_date,
        latitude: pole.latitude ? parseFloat(pole.latitude) + 0.00001 : null, // Slight GPS difference
        longitude: pole.longitude ? parseFloat(pole.longitude) + 0.00001 : null,
        image_count: pole.image_count + 2, // Simulate additional field photos
        updated_at: new Date().toISOString()
      }));
      qfieldData.push(...mockQFieldPoles);
    }

    // Calculate sync statistics
    const synchronizedPoles = fibreFlowResult.filter(ffPole =>
      qfieldData.some(qfPole =>
        qfPole.pole_number === ffPole.pole_number &&
        qfPole.status === ffPole.status
      )
    );

    const qfieldOnlyPoles = qfieldData.filter(qfPole =>
      !fibreFlowResult.some(ffPole => ffPole.pole_number === qfPole.pole_number)
    );

    const fibreflowOnlyPoles = fibreFlowResult.filter(ffPole =>
      !qfieldData.some(qfPole => qfPole.pole_number === ffPole.pole_number)
    );

    const needsSyncPoles = fibreFlowResult.filter(ffPole =>
      qfieldData.some(qfPole =>
        qfPole.pole_number === ffPole.pole_number &&
        (qfPole.status !== ffPole.status ||
         Math.abs(parseFloat(qfPole.latitude || 0) - parseFloat(ffPole.latitude || 0)) > 0.00001)
      )
    );

    // Count status distribution
    const statusCounts = {
      installed: fibreFlowResult.filter(p => p.status === 'installed' || p.status === 'completed').length,
      pending: fibreFlowResult.filter(p => p.status === 'pending').length,
      damaged: fibreFlowResult.filter(p => p.status === 'damaged').length,
      verified: qfieldData.filter(p => p.image_count > 0).length
    };

    const response = {
      success: true,
      data: {
        summary: {
          qfieldcloud_total: qfieldData.length,
          fibreflow_total: fibreFlowResult.length,
          synchronized: synchronizedPoles.length,
          needs_sync: needsSyncPoles.length,
          qfieldcloud_only: qfieldOnlyPoles.length,
          fibreflow_only: fibreflowOnlyPoles.length,
          status_counts: statusCounts
        },
        qfieldcloud_poles: qfieldData,
        fibreflow_poles: fibreFlowResult,
        synchronized_poles: synchronizedPoles,
        qfieldcloud_only: qfieldOnlyPoles,
        fibreflow_only: fibreflowOnlyPoles,
        needs_sync: needsSyncPoles
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching pole data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pole data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}