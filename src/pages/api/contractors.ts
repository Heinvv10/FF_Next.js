/**
 * Contractors API Endpoint
 * GET /api/contractors - List all contractors
 * POST /api/contractors - Create new contractor
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sql } from '@neondatabase/serverless';
import { log } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await getContractors(req, res);
      case 'POST':
        return await createContractor(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    log.error('Contractors API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getContractors(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    // For now, return mock data to test the API structure
    const mockContractors = [
      {
        id: '1',
        companyName: 'Test Construction Inc',
        contactPerson: 'John Doe',
        email: 'john@testconstruction.com',
        phone: '+27 11 123 4567',
        status: 'active',
        registrationNumber: 'REG123456',
        city: 'Johannesburg',
        province: 'Gauteng',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        companyName: 'Fiber Solutions SA',
        contactPerson: 'Jane Smith',
        email: 'jane@fibersolutions.co.za',
        phone: '+27 21 987 6543',
        status: 'pending',
        registrationNumber: 'REG789012',
        city: 'Cape Town',
        province: 'Western Cape',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: mockContractors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockContractors.length
      }
    });
  } catch (error) {
    log.error('Error fetching contractors:', error);
    return res.status(500).json({
      error: 'Failed to fetch contractors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createContractor(req: NextApiRequest, res: NextApiResponse) {
  try {
    const contractorData = req.body;

    // For now, return mock created contractor
    const newContractor = {
      id: '3',
      ...contractorData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      data: newContractor,
      message: 'Contractor created successfully'
    });
  } catch (error) {
    log.error('Error creating contractor:', error);
    return res.status(500).json({
      error: 'Failed to create contractor',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}