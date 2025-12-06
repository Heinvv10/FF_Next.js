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
    // Extract query parameters for filtering
    const { project, startDate, endDate } = req.query;

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
      {
        dr_number: 'DR9999999',
        project: 'Lawley',
        installation_date: new Date('2024-11-28'),
        customer_name: 'Bob Wilson',
        address: '789 Elm St',
        pole_number: 'POLE003',
        photos: [
          {
            id: '5',
            url: 'https://placehold.co/600x400/png?text=House+Photo',
            step: 'step_01_house_photo',
            stepLabel: 'House Photo',
            timestamp: new Date('2024-11-28T09:00:00Z'),
            filename: 'house3.jpg',
          },
        ],
        evaluated: false,
      },
    ];

    // Apply filters
    let filteredPhotos = [...mockPhotos];

    // Filter by project
    if (project && typeof project === 'string') {
      filteredPhotos = filteredPhotos.filter(
        (dr) => dr.project.toLowerCase() === project.toLowerCase()
      );
    }

    // Filter by date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string) : null;
      const end = endDate ? new Date(endDate as string) : null;

      // Validate dates
      if (start && isNaN(start.getTime())) {
        return res.status(400).json({
          error: 'Invalid startDate format',
        });
      }
      if (end && isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid endDate format',
        });
      }

      // Set end date to end of day for inclusive filtering
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      filteredPhotos = filteredPhotos.filter((dr) => {
        if (!dr.installation_date) return false;
        const drDate = new Date(dr.installation_date);
        if (start && drDate < start) return false;
        if (end && drDate > end) return false;
        return true;
      });
    }

    return res.status(200).json({
      success: true,
      data: filteredPhotos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return res.status(500).json({
      error: 'Failed to fetch photos',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
