/**
 * Contractors Documents Upload API - Flat Endpoint
 * POST /api/contractors-documents-upload
 * Handles file upload to Firebase Storage + metadata to Neon
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import formidable from 'formidable';
import fs from 'fs';
import { storage } from '@/config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const sql = neon(process.env.DATABASE_URL || '');

// Disable body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const { fields, files } = await parseForm(req);

    // Extract fields
    const contractorId = Array.isArray(fields.contractorId) ? fields.contractorId[0] : fields.contractorId;
    const documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType;
    const documentName = Array.isArray(fields.documentName) ? fields.documentName[0] : fields.documentName;
    const documentNumber = Array.isArray(fields.documentNumber) ? fields.documentNumber[0] : fields.documentNumber;
    const issueDate = Array.isArray(fields.issueDate) ? fields.issueDate[0] : fields.issueDate;
    const expiryDate = Array.isArray(fields.expiryDate) ? fields.expiryDate[0] : fields.expiryDate;
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes;
    const uploadedBy = Array.isArray(fields.uploadedBy) ? fields.uploadedBy[0] : fields.uploadedBy;

    // Validate required fields
    if (!contractorId || !documentType || !documentName || !uploadedBy) {
      return res.status(400).json({
        error: 'Missing required fields: contractorId, documentType, documentName, uploadedBy'
      });
    }

    // Get uploaded file
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large. Maximum size: 10MB'
      });
    }

    // Upload to Firebase Storage
    const timestamp = Date.now();
    const sanitizedFileName = sanitizeFileName(file.originalFilename || 'document');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const storagePath = `contractors/${contractorId}/documents/${fileName}`;

    // Read file buffer
    const fileBuffer = await fs.promises.readFile(file.filepath);

    // Upload to Firebase
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, fileBuffer, {
      contentType: file.mimetype || 'application/octet-stream',
    });

    // Get download URL
    const fileUrl = await getDownloadURL(storageRef);

    // Save metadata to Neon
    const [document] = await sql`
      INSERT INTO contractor_documents (
        contractor_id,
        document_type,
        document_name,
        document_number,
        file_name,
        file_path,
        file_url,
        file_size,
        mime_type,
        issue_date,
        expiry_date,
        is_expired,
        is_verified,
        status,
        notes,
        uploaded_by
      ) VALUES (
        ${contractorId},
        ${documentType},
        ${documentName},
        ${documentNumber || null},
        ${sanitizedFileName},
        ${storagePath},
        ${fileUrl},
        ${file.size},
        ${file.mimetype},
        ${issueDate ? new Date(issueDate) : null},
        ${expiryDate ? new Date(expiryDate) : null},
        ${false},
        ${false},
        ${'pending'},
        ${notes || null},
        ${uploadedBy}
      )
      RETURNING *
    `;

    // Clean up temp file
    await fs.promises.unlink(file.filepath);

    return res.status(201).json({
      success: true,
      data: mapDbToDocument(document)
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload document',
      message: error.message
    });
  }
}

// Parse multipart form data
function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Sanitize filename
function sanitizeFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  const ext = lastDot > 0 ? fileName.substring(lastDot) : '';

  const sanitized = name
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 100);

  return sanitized + ext;
}

// Map database row to ContractorDocument interface
function mapDbToDocument(row: any) {
  return {
    id: row.id,
    contractorId: row.contractor_id,
    documentType: row.document_type,
    documentName: row.document_name,
    documentNumber: row.document_number,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    issueDate: row.issue_date ? new Date(row.issue_date) : undefined,
    expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
    isExpired: row.is_expired,
    daysUntilExpiry: row.days_until_expiry,
    isVerified: row.is_verified,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    verificationNotes: row.verification_notes,
    status: row.status,
    rejectionReason: row.rejection_reason,
    notes: row.notes,
    tags: row.tags || [],
    uploadedBy: row.uploaded_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
