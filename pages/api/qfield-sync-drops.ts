/**
 * API endpoint for fetching drop data for QField Sync comparison
 * Returns both QFieldCloud and FibreFlow drop data for field verification
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

    // Fetch FibreFlow drop data from the drops table
    let fibreFlowResult;

    if (projectId) {
      fibreFlowResult = await sql`
        SELECT
          drop_number,
          pole_number,
          address,
          customer_name,
          cable_length,
          installation_date,
          status,
          qc_status,
          notes,
          metadata,
          created_at,
          updated_at,
          qc_updated_at,
          'fibreflow' as source
        FROM drops
        WHERE project_id = ${projectId}
        ORDER BY drop_number
        LIMIT 200
      `;
    } else {
      fibreFlowResult = await sql`
        SELECT
          drop_number,
          pole_number,
          address,
          customer_name,
          cable_length,
          installation_date,
          status,
          qc_status,
          notes,
          metadata,
          created_at,
          updated_at,
          qc_updated_at,
          'fibreflow' as source
        FROM drops
        ORDER BY drop_number
        LIMIT 200
      `;
    }

    // Simulate QFieldCloud data for testing
    // In production, this would call the actual QFieldCloud API
    const qfieldData = [];

    // Mock some QFieldCloud data (simulate field updates)
    if (fibreFlowResult.length > 0) {
      const mockQFieldDrops = fibreFlowResult.slice(0, Math.min(15, fibreFlowResult.length)).map(drop => ({
        ...drop,
        source: 'qfieldcloud',
        // Simulate field updates
        status: drop.status === 'planned' ? 'installed' : drop.status,
        qc_status: drop.status === 'planned' ? 'pending' : 'approved',
        installation_date: drop.status === 'planned' ? new Date().toISOString().split('T')[0] : drop.installation_date,
        cable_length: drop.cable_length ? `${parseInt(drop.cable_length) + 5}m` : '50m', // Field measurements
        metadata: {
          ...drop.metadata,
          field_verified: true,
          photos_taken: 12,
          gps_captured: true
        },
        updated_at: new Date().toISOString()
      }));
      qfieldData.push(...mockQFieldDrops);
    }

    // Calculate sync statistics
    const synchronizedDrops = fibreFlowResult.filter(ffDrop =>
      qfieldData.some(qfDrop =>
        qfDrop.drop_number === ffDrop.drop_number &&
        qfDrop.status === ffDrop.status &&
        qfDrop.qc_status === ffDrop.qc_status
      )
    );

    const qfieldOnlyDrops = qfieldData.filter(qfDrop =>
      !fibreFlowResult.some(ffDrop => ffDrop.drop_number === qfDrop.drop_number)
    );

    const fibreflowOnlyDrops = fibreFlowResult.filter(ffDrop =>
      !qfieldData.some(qfDrop => qfDrop.drop_number === ffDrop.drop_number)
    );

    const needsSyncDrops = fibreFlowResult.filter(ffDrop =>
      qfieldData.some(qfDrop =>
        qfDrop.drop_number === ffDrop.drop_number &&
        (qfDrop.status !== ffDrop.status ||
         qfDrop.qc_status !== ffDrop.qc_status ||
         qfDrop.cable_length !== ffDrop.cable_length)
      )
    );

    // Count status distribution
    const statusCounts = {
      installed: fibreFlowResult.filter(d => d.status === 'installed' || d.status === 'completed').length,
      planned: fibreFlowResult.filter(d => d.status === 'planned').length,
      in_progress: fibreFlowResult.filter(d => d.status === 'in_progress').length,
      qc_approved: fibreFlowResult.filter(d => d.qc_status === 'approved').length,
      qc_pending: fibreFlowResult.filter(d => d.qc_status === 'pending').length,
      qc_failed: fibreFlowResult.filter(d => d.qc_status === 'failed' || d.qc_status === 'rejected').length
    };

    const response = {
      success: true,
      data: {
        summary: {
          qfieldcloud_total: qfieldData.length,
          fibreflow_total: fibreFlowResult.length,
          synchronized: synchronizedDrops.length,
          needs_sync: needsSyncDrops.length,
          qfieldcloud_only: qfieldOnlyDrops.length,
          fibreflow_only: fibreflowOnlyDrops.length,
          status_counts: statusCounts
        },
        qfieldcloud_drops: qfieldData,
        fibreflow_drops: fibreFlowResult,
        synchronized_drops: synchronizedDrops,
        qfieldcloud_only: qfieldOnlyDrops,
        fibreflow_only: fibreflowOnlyDrops,
        needs_sync: needsSyncDrops
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching drop data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drop data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}