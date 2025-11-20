// GET /api/foto-reviews/image?path={image_path}
// Serve images from 1Map storage

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { path: imagePath } = req.query;

    if (!imagePath || typeof imagePath !== 'string') {
      return res.status(400).json({ error: 'Image path is required' });
    }

    // Construct full path to image
    const baseDir = '/home/louisdup/Agents/antigravity';
    const fullPath = path.join(baseDir, imagePath);

    // Security check: ensure path is within base directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedBaseDir = path.resolve(baseDir);

    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(fullPath);

    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
