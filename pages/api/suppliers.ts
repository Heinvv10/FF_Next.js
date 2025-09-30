import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '../lib/auth-mock';
import { SupplierNeonService } from '../src/services/suppliers/supplierNeonService';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle GET request - fetch suppliers
  if (req.method === 'GET') {
    try {
      const {
        limit = '100',
        offset = '0',
        status,
        isPreferred,
        search,
        category
      } = req.query;

      // Build filter object
      const filter: any = {};
      if (status) filter.status = status;
      if (isPreferred === 'true') filter.isPreferred = true;
      if (category) filter.category = category;

      let suppliers;

      // Use search if provided, otherwise use filters
      if (search) {
        suppliers = await SupplierNeonService.searchByName(search as string);
      } else {
        suppliers = await SupplierNeonService.getAll(filter);
      }

      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const startIndex = offsetNum;
      const endIndex = startIndex + limitNum;
      const paginatedSuppliers = suppliers.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: paginatedSuppliers,
        count: paginatedSuppliers.length,
        total: suppliers.length,
        page: Math.floor(offsetNum / limitNum) + 1,
        pageSize: limitNum,
        totalPages: Math.ceil(suppliers.length / limitNum)
      });

    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch suppliers'
      });
    }
  }

  // Handle POST request - create supplier
  if (req.method === 'POST') {
    try {
      const {
        name,
        companyName,
        businessType,
        email,
        phone,
        registrationNumber,
        categories,
        isPreferred = false
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
      }

      const supplierData = {
        name,
        companyName,
        businessType,
        email,
        phone,
        registrationNumber,
        categories,
        isPreferred
      };

      const id = await SupplierNeonService.create(supplierData);

      return res.status(201).json({
        success: true,
        data: {
          id,
          message: 'Supplier created successfully'
        }
      });

    } catch (error) {
      console.error('Error creating supplier:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create supplier'
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}