/**
 * Contractors Documents Delete API - Flat Endpoint
 * POST /api/contractors-documents-delete
 * Deletes document from Firebase Storage AND database
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { storage } from '@/config/firebase';
import { ref, deleteObject } from 'firebase/storage';

const sql = neon(process.env.DATABASE_URL || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    // Validate required field
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Get document to get file path
    const [document] = await sql`
      SELECT id, file_path FROM contractor_documents WHERE id = ${id}
    `;

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from Firebase Storage
    try {
      const storageRef = ref(storage, document.file_path);
      await deleteObject(storageRef);
    } catch (firebaseError) {
      console.error('Firebase delete error:', firebaseError);
      // Continue even if Firebase delete fails (file might already be gone)
    }

    // Delete from database
    await sql`DELETE FROM contractor_documents WHERE id = ${id}`;

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
}
