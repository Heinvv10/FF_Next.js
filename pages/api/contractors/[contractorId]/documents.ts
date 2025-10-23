/**
 * Contractor Documents API - Document management endpoints
 * GET /api/contractors/[id]/documents - List documents for a contractor
 * POST /api/contractors/[id]/documents - Upload a new document for a contractor
 * PUT /api/contractors/[id]/documents/[docId] - Update document (handled separately if needed)
 * DELETE /api/contractors/[id]/documents/[docId] - Delete document (handled separately if needed)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { log } from '@/lib/logger';
import type { ContractorDocument } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contractor ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(id, res);
      case 'POST':
        return await handlePost(id, req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Contractor Documents API error:', { data: error }, 'api/contractors/[id]/documents');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle GET request - List documents for a contractor
 */
async function handleGet(
  contractorId: string,
  res: NextApiResponse<ContractorDocument[] | { error: string }>
) {
  try {
    // Check if contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const documents = await neonContractorService.getContractorDocuments(contractorId);
    
    return res.status(200).json(documents);
  } catch (error) {
    log.error('Error fetching contractor documents:', { data: error }, 'api/contractors/[id]/documents');
    throw error;
  }
}

/**
 * Handle POST request - Add new document for contractor
 */
async function handlePost(
  contractorId: string,
  req: NextApiRequest,
  res: NextApiResponse<ContractorDocument | { error: string }>
) {
  try {
    const data = req.body;
    
    // Check if contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    // Basic validation
    if (!data.documentType || !data.documentName || !data.fileName || !data.filePath) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentType, documentName, fileName, filePath' 
      });
    }

    // Validate document type
    const validDocumentTypes = [
      'id_document',
      'tax_certificate',
      'bbbee_certificate',
      'company_registration',
      'bank_confirmation',
      'insurance_certificate',
      'safety_certificate',
      'quality_certificate',
      'training_certificate',
      'compliance_certificate',
      'other'
    ];

    if (!validDocumentTypes.includes(data.documentType)) {
      return res.status(400).json({ 
        error: `Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}` 
      });
    }

    // Check expiry date if provided
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiry date format' });
      }
      data.expiryDate = expiryDate;
    }

    const document = await neonContractorService.addDocument(contractorId, {
      documentType: data.documentType,
      documentName: data.documentName,
      fileName: data.fileName,
      filePath: data.filePath,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate,
      notes: data.notes
    });
    
    return res.status(201).json(document);
  } catch (error) {
    log.error('Error adding document:', { data: error }, 'api/contractors/[id]/documents');
    throw error;
  }
}

// Additional endpoints for document operations
export async function handleDocumentUpdate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, docId } = req.query;
  
  if (!id || !docId || typeof id !== 'string' || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'expired', 'replaced'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    await neonContractorService.updateDocumentStatus(docId, status, notes);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    log.error('Error updating document:', { data: error }, 'api/contractors/[id]/documents');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function handleDocumentDelete(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, docId } = req.query;
  
  if (!id || !docId || typeof id !== 'string' || typeof docId !== 'string') {
    return res.status(400).json({ error: 'Invalid IDs' });
  }

  try {
    await neonContractorService.deleteDocument(docId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    log.error('Error deleting document:', { data: error }, 'api/contractors/[id]/documents');
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}