/**
 * GET /api/foto/photos
 * Fetch DRs with photos
 * Supports filtering by project, date range, and evaluation status
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { DropRecord } from '@/modules/foto-review/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Fetch from actual photo storage (VPS, Firebase, S3)
    // For now, return mock data for testing

    const mockPhotos: DropRecord[] = [
      {
        dr_number: 'DR1234567',
        project: 'Lawley',
        installation_date: new Date('2024-12-01'),
        customer_name: 'John Doe',
        address: '123 Main St',
        pole_number: 'POLE001',
        photos: [
          {
            id: '1',
            url: 'https://placehold.co/600x400/png?text=House+Photo',
            step: 'step_01_house_photo',
            stepLabel: 'House Photo',
            timestamp: new Date('2024-12-01T10:00:00Z'),
            filename: 'house.jpg',
          },
          {
            id: '2',
            url: 'https://placehold.co/600x400/png?text=Cable+Span',
            step: 'step_02_cable_span',
            stepLabel: 'Cable Span',
            timestamp: new Date('2024-12-01T10:05:00Z'),
            filename: 'cable.jpg',
          },
          {
            id: '3',
            url: 'https://placehold.co/600x400/png?text=ONT+Barcode',
            step: 'step_03_ont_barcode',
            stepLabel: 'ONT Barcode',
            timestamp: new Date('2024-12-01T10:10:00Z'),
            filename: 'barcode.jpg',
          },
        ],
        evaluated: false,
      },
      {
        dr_number: 'DR7654321',
        project: 'Mohadin',
        installation_date: new Date('2024-12-02'),
        customer_name: 'Jane Smith',
        address: '456 Oak Ave',
        pole_number: 'POLE002',
        photos: [
          {
            id: '4',
            url: 'https://placehold.co/600x400/png?text=House+Photo',
            step: 'step_01_house_photo',
            stepLabel: 'House Photo',
            timestamp: new Date('2024-12-02T14:00:00Z'),
            filename: 'house2.jpg',
          },
        ],
        evaluated: true,
        last_evaluation_date: new Date('2024-12-02T15:00:00Z'),
      },
    ];

    return res.status(200).json({
      success: true,
      data: mockPhotos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return res.status(500).json({
      error: 'Failed to fetch photos',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
