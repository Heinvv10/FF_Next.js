/**
 * Contractor Document API - Individual document operations
 * GET /api/contractors/[contractorId]/documents/[docId] - Get document by ID
 * PUT /api/contractors/[contractorId]/documents/[docId] - Update document metadata
 * DELETE /api/contractors/[contractorId]/documents/[docId] - Delete document
 * PATCH /api/contractors/[contractorId]/documents/[docId] - Update status or verify
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neonContractorService } from '@/services/contractor/neonContractorService';
import { apiResponse } from '@/lib/apiResponse';
import { log } from '@/lib/logger';
import type { ContractorDocument } from '@/types/contractor.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { contractorId, docId } = req.query;

  // Validate parameters
  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, { contractorId: 'Invalid contractor ID' });
  }

  if (!docId || typeof docId !== 'string') {
    return apiResponse.validationError(res, { docId: 'Invalid document ID' });
  }

  try {
    switch (method) {
      case 'GET':
        return await handleGet(contractorId, docId, res);
      case 'PUT':
        return await handlePut(contractorId, docId, req, res);
      case 'DELETE':
        return await handleDelete(contractorId, docId, res);
      case 'PATCH':
        return await handlePatch(contractorId, docId, req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    log.error('Document API error:', { data: error }, 'api/contractors/[contractorId]/documents/[docId]');
    return apiResponse.internalError(res, error);
  }
}

/**
 * Handle GET request - Get document by ID
 */
async function handleGet(
  contractorId: string,
  docId: string,
  res: NextApiResponse
) {
  try {
    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Get all documents and find the specific one
    const documents = await neonContractorService.getContractorDocuments(contractorId);
    const document = documents.find(d => d.id === docId);

    if (!document) {
      return apiResponse.notFound(res, 'Document', docId);
    }

    // Verify document belongs to contractor
    if (document.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        docId: 'Document does not belong to this contractor'
      });
    }

    return apiResponse.success(res, document);
  } catch (error) {
    log.error('Error fetching document:', { data: error }, 'api/contractors/[contractorId]/documents/[docId]');
    throw error;
  }
}

/**
 * Handle PUT request - Update document metadata
 */
async function handlePut(
  contractorId: string,
  docId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const data = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify document exists and belongs to contractor
    const documents = await neonContractorService.getContractorDocuments(contractorId);
    const existingDocument = documents.find(d => d.id === docId);

    if (!existingDocument) {
      return apiResponse.notFound(res, 'Document', docId);
    }

    if (existingDocument.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        docId: 'Document does not belong to this contractor'
      });
    }

    // Validate document type if provided
    if (data.documentType) {
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
        return apiResponse.validationError(res, {
          documentType: `Invalid document type. Must be one of: ${validDocumentTypes.join(', ')}`
        });
      }
    }

    // Validate expiry date if provided
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      if (isNaN(expiryDate.getTime())) {
        return apiResponse.validationError(res, {
          expiryDate: 'Invalid expiry date format'
        });
      }
      data.expiryDate = expiryDate;
    }

    // Validate issue date if provided
    if (data.issueDate) {
      const issueDate = new Date(data.issueDate);
      if (isNaN(issueDate.getTime())) {
        return apiResponse.validationError(res, {
          issueDate: 'Invalid issue date format'
        });
      }
      data.issueDate = issueDate;
    }

    // Prevent changing file path (security)
    if (data.filePath) {
      return apiResponse.validationError(res, {
        filePath: 'File path cannot be changed after upload'
      });
    }

    // Update document
    const updatedDocument = await neonContractorService.updateDocument(docId, {
      documentName: data.documentName,
      documentNumber: data.documentNumber,
      documentType: data.documentType,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      notes: data.notes
    });

    return apiResponse.success(res, updatedDocument, 'Document updated successfully');
  } catch (error) {
    log.error('Error updating document:', { data: error }, 'api/contractors/[contractorId]/documents/[docId]');
    throw error;
  }
}

/**
 * Handle DELETE request - Delete document
 */
async function handleDelete(
  contractorId: string,
  docId: string,
  res: NextApiResponse
) {
  try {
    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify document exists and belongs to contractor
    const documents = await neonContractorService.getContractorDocuments(contractorId);
    const existingDocument = documents.find(d => d.id === docId);

    if (!existingDocument) {
      return apiResponse.notFound(res, 'Document', docId);
    }

    if (existingDocument.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        docId: 'Document does not belong to this contractor'
      });
    }

    // Delete document
    await neonContractorService.deleteDocument(docId);

    return apiResponse.success(res, { id: docId }, 'Document deleted successfully');
  } catch (error) {
    log.error('Error deleting document:', { data: error }, 'api/contractors/[contractorId]/documents/[docId]');
    throw error;
  }
}

/**
 * Handle PATCH request - Update status or verify document
 */
async function handlePatch(
  contractorId: string,
  docId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { action, status, rejectionReason, verifiedBy, verificationNotes } = req.body;

    // Verify contractor exists
    const contractor = await neonContractorService.getContractorById(contractorId);
    if (!contractor) {
      return apiResponse.notFound(res, 'Contractor', contractorId);
    }

    // Verify document exists and belongs to contractor
    const documents = await neonContractorService.getContractorDocuments(contractorId);
    const existingDocument = documents.find(d => d.id === docId);

    if (!existingDocument) {
      return apiResponse.notFound(res, 'Document', docId);
    }

    if (existingDocument.contractorId !== contractorId) {
      return apiResponse.validationError(res, {
        docId: 'Document does not belong to this contractor'
      });
    }

    // Handle different patch actions
    if (action === 'verify') {
      // Verify document
      if (!verifiedBy) {
        return apiResponse.validationError(res, {
          verifiedBy: 'verifiedBy is required for verification'
        });
      }

      const verifiedDocument = await neonContractorService.verifyDocument(
        docId,
        verifiedBy,
        verificationNotes
      );

      return apiResponse.success(res, verifiedDocument, 'Document verified successfully');
    } else if (action === 'update_status' || status) {
      // Update document status
      const statusToUpdate = status || req.body.status;

      if (!statusToUpdate) {
        return apiResponse.validationError(res, {
          status: 'status is required for status update'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'expired', 'replaced'];
      if (!validStatuses.includes(statusToUpdate)) {
        return apiResponse.validationError(res, {
          status: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Require rejection reason for rejected status
      if (statusToUpdate === 'rejected' && !rejectionReason) {
        return apiResponse.validationError(res, {
          rejectionReason: 'Rejection reason is required when rejecting a document'
        });
      }

      const updatedDocument = await neonContractorService.updateDocumentStatus(
        docId,
        statusToUpdate,
        rejectionReason
      );

      return apiResponse.success(res, updatedDocument, 'Document status updated successfully');
    }

    // If no recognized action provided
    return apiResponse.validationError(res, {
      action: 'No valid action provided. Supported actions: "verify", "update_status", or provide "status" field'
    });
  } catch (error) {
    log.error('Error patching document:', { data: error }, 'api/contractors/[contractorId]/documents/[docId]');
    throw error;
  }
}
