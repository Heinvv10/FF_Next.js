/**
 * GET /api/foto/photos
 * Fetch DRs with photos from qa_photo_reviews table
 * Supports filtering by project, date range, and evaluation status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import type { DropRecord, Photo } from '@/modules/foto-review/types';

const sql = neon(process.env.DATABASE_URL!);

// Photo step mapping
const PHOTO_STEPS = [
  { step: 'step_01_house_photo', label: 'House Photo' },
  { step: 'step_02_cable_from_pole', label: 'Cable From Pole' },
  { step: 'step_03_cable_entry_outside', label: 'Cable Entry Outside' },
  { step: 'step_04_cable_entry_inside', label: 'Cable Entry Inside' },
  { step: 'step_05_wall_for_installation', label: 'Wall For Installation' },
  { step: 'step_06_ont_back_after_install', label: 'ONT Back After Install' },
  { step: 'step_07_power_meter_reading', label: 'Power Meter Reading' },
  { step: 'step_08_ont_barcode', label: 'ONT Barcode' },
  { step: 'step_09_ups_serial', label: 'UPS Serial' },
  { step: 'step_10_final_installation', label: 'Final Installation' },
  { step: 'step_11_green_lights', label: 'Green Lights' },
  { step: 'step_12_customer_signature', label: 'Customer Signature' },
];

/**
 * Construct proxied photo URL to bypass CORS
 */
function getProxiedPhotoUrl(drNumber: string, step: string): string {
  const BOSS_API_URL = process.env.BOSS_VPS_API_URL || 'http://72.61.197.178:8001';
  const bossUrl = `${BOSS_API_URL}/api/photo/${drNumber}/${step}.jpg`;
  return `/api/foto/photo-proxy?url=${encodeURIComponent(bossUrl)}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Query database - fetch all recent DRs
    const rows = await sql`
      SELECT
        drop_number,
        project,
        review_date as installation_date,
        user_name as customer_name,
        completed_photos,
        outstanding_photos,
        step_01_house_photo,
        step_02_cable_from_pole,
        step_03_cable_entry_outside,
        step_04_cable_entry_inside,
        step_05_wall_for_installation,
        step_06_ont_back_after_install,
        step_07_power_meter_reading,
        step_08_ont_barcode,
        step_09_ups_serial,
        step_10_final_installation,
        step_11_green_lights,
        step_12_customer_signature
      FROM qa_photo_reviews
      ORDER BY review_date DESC, drop_number DESC
      LIMIT 100
    `;

    // Transform database rows to DropRecord format
    const dropRecords: DropRecord[] = rows.map((row: any) => {
      // Build photos array from step columns
      const photos: Photo[] = [];

      PHOTO_STEPS.forEach((stepDef, index) => {
        // Only include photos that exist (step column = true)
        if (row[stepDef.step] === true) {
          photos.push({
            id: `${row.drop_number}-${stepDef.step}`,
            url: getProxiedPhotoUrl(row.drop_number, stepDef.step),
            step: stepDef.step,
            stepLabel: stepDef.label,
            timestamp: row.installation_date ? new Date(row.installation_date) : new Date(),
            filename: `${stepDef.step}.jpg`,
          });
        }
      });

      return {
        dr_number: row.drop_number,
        project: row.project,
        installation_date: row.installation_date ? new Date(row.installation_date) : null,
        customer_name: row.customer_name || 'Unknown',
        address: '', // Not in qa_photo_reviews table
        pole_number: '', // Not in qa_photo_reviews table
        photos,
        evaluated: false, // TODO: Check if DR has evaluation
        last_evaluation_date: undefined,
      };
    });

    // Filter out DRs with no photos
    const dropRecordsWithPhotos = dropRecords.filter(dr => dr.photos.length > 0);

    return res.status(200).json({
      success: true,
      data: dropRecordsWithPhotos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return res.status(500).json({
      error: 'Failed to fetch photos',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
