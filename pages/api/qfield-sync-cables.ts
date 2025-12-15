/**
 * API endpoint for fetching fiber cable data for QField Sync comparison
 * Returns both QFieldCloud and FibreFlow cable data for comparison
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

    // Fetch FibreFlow fiber cable data from the fibre table
    const fibreFlowQuery = `
      SELECT
        segment_id as cable_id,
        cable_type,
        cable_size,
        from_chamber,
        to_chamber,
        distance_m as length_m,
        installation_date,
        installation_status,
        contractor_name as contractor,
        created_at,
        updated_at,
        'fibreflow' as source
      FROM fibre
      ${projectId ? 'WHERE project_id = $1' : ''}
      ORDER BY segment_id
      LIMIT 100
    `;

    const fibreFlowResult = projectId
      ? await sql(fibreFlowQuery, [projectId])
      : await sql(fibreFlowQuery);

    // For now, we'll simulate QFieldCloud data
    // In production, this would call the actual QFieldCloud API
    const qfieldData = [];

    // Mock some QFieldCloud data for testing
    if (fibreFlowResult.length > 0) {
      // Simulate that some cables exist in QFieldCloud
      const mockQFieldCables = fibreFlowResult.slice(0, Math.min(5, fibreFlowResult.length)).map(cable => ({
        ...cable,
        source: 'qfieldcloud',
        // Simulate some differences
        installation_status: cable.installation_status === 'completed' ? 'installed' : cable.installation_status,
        updated_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }));
      qfieldData.push(...mockQFieldCables);
    }

    // Identify synchronized cables (exist in both with same updated_at)
    const synchronizedCables = fibreFlowResult.filter(ffCable =>
      qfieldData.some(qfCable =>
        qfCable.cable_id === ffCable.cable_id &&
        qfCable.updated_at === ffCable.updated_at
      )
    );

    // Identify cables only in QFieldCloud
    const qfieldOnlyCables = qfieldData.filter(qfCable =>
      !fibreFlowResult.some(ffCable => ffCable.cable_id === qfCable.cable_id)
    );

    // Identify cables only in FibreFlow
    const fibreflowOnlyCables = fibreFlowResult.filter(ffCable =>
      !qfieldData.some(qfCable => qfCable.cable_id === ffCable.cable_id)
    );

    // Identify cables that need sync (exist in both but different updated_at)
    const needSyncCables = fibreFlowResult.filter(ffCable =>
      qfieldData.some(qfCable =>
        qfCable.cable_id === ffCable.cable_id &&
        qfCable.updated_at !== ffCable.updated_at
      )
    );

    const response = {
      success: true,
      data: {
        summary: {
          qfieldcloud_total: qfieldData.length,
          fibreflow_total: fibreFlowResult.length,
          synchronized: synchronizedCables.length,
          needs_sync: needSyncCables.length,
          qfieldcloud_only: qfieldOnlyCables.length,
          fibreflow_only: fibreflowOnlyCables.length
        },
        qfieldcloud_cables: qfieldData,
        fibreflow_cables: fibreFlowResult,
        synchronized_cables: synchronizedCables,
        qfieldcloud_only: qfieldOnlyCables,
        fibreflow_only: fibreflowOnlyCables,
        needs_sync: needSyncCables
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching cable data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cable data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}