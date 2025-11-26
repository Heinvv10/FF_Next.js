/**
 * WA Monitor DR Validation API
 * POST /api/wa-monitor-dr-validation - Upload CSV/Excel and validate against database
 * GET /api/wa-monitor-dr-validation?project={project}&date={date} - Get drops for project/date
 * DELETE /api/wa-monitor-dr-validation?id={id} - Delete a drop record
 * PUT /api/wa-monitor-dr-validation - Add missing drop records
 *
 * Handles DR number validation and reconciliation for Janice
 * Supports CSV and Excel (.xlsx) file uploads
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { neon } from '@neondatabase/serverless';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const sql = neon(process.env.DATABASE_URL || '');

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface CsvRow {
  date: string;
  dropNumber: string;
  time: string;
}

interface ValidationResult {
  inCsvAndDb: CsvRow[];
  inCsvNotInDb: CsvRow[];
  inDbNotInCsv: any[];
  csvTotal: number;
  dbTotal: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - Fetch drops for a project/date
  if (req.method === 'GET') {
    try {
      const { project, date } = req.query;

      if (!project || !date) {
        return apiResponse.validationError(res, {
          project: 'Project is required',
          date: 'Date is required',
        });
      }

      // Fetch drops from database for this project and date
      const drops = await sql`
        SELECT
          id,
          drop_number as "dropNumber",
          DATE(created_at) as date,
          TO_CHAR(created_at, 'HH24:MI') as time,
          project,
          completed,
          incomplete
        FROM qa_photo_reviews
        WHERE project = ${project as string}
          AND DATE(created_at) = ${date as string}
        ORDER BY created_at ASC
      `;

      return apiResponse.success(res, { drops, total: drops.length });
    } catch (error: any) {
      console.error('Error fetching drops:', error);
      return apiResponse.internalError(res, error, 'Failed to fetch drops');
    }
  }

  // POST - Upload CSV and validate
  if (req.method === 'POST') {
    try {
      // Parse multipart form data
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });

      const [fields, files] = await form.parse(req);
      const project = fields.project?.[0];
      const date = fields.date?.[0];

      if (!project || !date) {
        return apiResponse.validationError(res, {
          project: 'Project is required',
          date: 'Date is required',
        });
      }

      const uploadedFile = files.file?.[0];
      if (!uploadedFile) {
        return apiResponse.validationError(res, {
          file: 'CSV or Excel file is required',
        });
      }

      // Determine file type
      const fileExtension = uploadedFile.originalFilename?.split('.').pop()?.toLowerCase();
      let parsedData: any[] = [];

      // Parse based on file type
      if (fileExtension === 'csv') {
        // Parse CSV
        const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf-8');
        const parseResult = Papa.parse<any>(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => {
            // Normalize headers
            const lower = header.toLowerCase().trim();
            if (lower === 'date') return 'date';
            if (lower.includes('dr') && lower.includes('nr')) return 'dropNumber';
            if (lower === 'time') return 'time';
            return header;
          },
        });

        if (parseResult.errors.length > 0) {
          return apiResponse.validationError(res, {
            csv: 'CSV parsing error: ' + parseResult.errors[0].message,
          });
        }

        parsedData = parseResult.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const fileBuffer = fs.readFileSync(uploadedFile.filepath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Normalize headers
        parsedData = jsonData.map((row: any) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach((key) => {
            const lower = key.toLowerCase().trim();
            if (lower === 'date') {
              normalizedRow.date = row[key];
            } else if (lower.includes('dr') && lower.includes('nr')) {
              normalizedRow.dropNumber = row[key];
            } else if (lower === 'time') {
              normalizedRow.time = row[key];
            }
          });
          return normalizedRow;
        });
      } else {
        return apiResponse.validationError(res, {
          file: 'Unsupported file type. Please upload CSV or Excel (.xlsx) file',
        });
      }

      // Extract and normalize data
      const csvRows: CsvRow[] = parsedData
        .map((row: any) => ({
          date: normalizeDate(row.date, date as string),
          dropNumber: normalizeDropNumber(row.dropNumber),
          time: row.time || '',
        }))
        .filter((row) => row.dropNumber); // Remove rows without DR numbers

      // Get all drop numbers from CSV
      const csvDropNumbers = csvRows.map((r) => r.dropNumber);

      // Fetch drops from database for this project and date
      const dbDrops = await sql`
        SELECT
          id,
          drop_number as "dropNumber",
          DATE(created_at) as date,
          TO_CHAR(created_at, 'HH24:MI') as time,
          project,
          completed,
          incomplete
        FROM qa_photo_reviews
        WHERE project = ${project as string}
          AND DATE(created_at) = ${date as string}
      `;

      const dbDropNumbers = dbDrops.map((d) => d.dropNumber);

      // Compare: In CSV and in DB
      const inCsvAndDb = csvRows.filter((csv) =>
        dbDropNumbers.includes(csv.dropNumber)
      );

      // Compare: In CSV but NOT in DB (missing from DB)
      const inCsvNotInDb = csvRows.filter(
        (csv) => !dbDropNumbers.includes(csv.dropNumber)
      );

      // Compare: In DB but NOT in CSV (extra in DB)
      const inDbNotInCsv = dbDrops.filter(
        (db) => !csvDropNumbers.includes(db.dropNumber)
      );

      const result: ValidationResult = {
        inCsvAndDb,
        inCsvNotInDb,
        inDbNotInCsv,
        csvTotal: csvRows.length,
        dbTotal: dbDrops.length,
      };

      return apiResponse.success(res, result);
    } catch (error: any) {
      console.error('Error validating CSV:', error);
      return apiResponse.internalError(res, error, 'Failed to validate CSV');
    }
  }

  // PUT - Add missing drop records
  if (req.method === 'PUT') {
    try {
      const { drops, project } = req.body;

      if (!drops || !Array.isArray(drops) || drops.length === 0) {
        return apiResponse.validationError(res, {
          drops: 'Drops array is required',
        });
      }

      if (!project) {
        return apiResponse.validationError(res, {
          project: 'Project is required',
        });
      }

      // Insert drops in batch
      const insertedIds: string[] = [];
      for (const drop of drops) {
        const { date, dropNumber, time } = drop;

        // Create timestamp from date and time
        const timestamp = time
          ? `${date} ${time}:00`
          : `${date} 00:00:00`;

        const [result] = await sql`
          INSERT INTO qa_photo_reviews (
            drop_number,
            project,
            created_at,
            updated_at,
            review_date,
            user_name,
            completed_photos,
            outstanding_photos,
            outstanding_photos_loaded_to_1map,
            completed,
            incomplete
          ) VALUES (
            ${dropNumber},
            ${project},
            ${timestamp}::timestamp,
            ${timestamp}::timestamp,
            ${date}::date,
            'Manual Entry',
            0,
            12,
            false,
            false,
            true
          )
          ON CONFLICT (drop_number) DO NOTHING
          RETURNING id
        `;

        if (result?.id) {
          insertedIds.push(result.id);
        }
      }

      return apiResponse.created(res, {
        inserted: insertedIds.length,
        ids: insertedIds,
      }, `${insertedIds.length} drop(s) added successfully`);
    } catch (error: any) {
      console.error('Error adding drops:', error);
      return apiResponse.internalError(res, error, 'Failed to add drops');
    }
  }

  // DELETE - Remove a drop record
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return apiResponse.validationError(res, {
          id: 'Drop ID is required',
        });
      }

      const [deleted] = await sql`
        DELETE FROM qa_photo_reviews
        WHERE id = ${id}
        RETURNING id
      `;

      if (!deleted) {
        return apiResponse.notFound(res, 'Drop', id);
      }

      return apiResponse.success(res, { deleted: true, id });
    } catch (error: any) {
      console.error('Error deleting drop:', error);
      return apiResponse.internalError(res, error, 'Failed to delete drop');
    }
  }

  return apiResponse.methodNotAllowed(res, req.method || 'UNKNOWN', [
    'GET',
    'POST',
    'PUT',
    'DELETE',
  ]);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Normalize drop number to DR######## format
 * Handles: DR1733545, Dr1733545, dr1733545, 1733545
 */
function normalizeDropNumber(input: string): string {
  if (!input) return '';

  const cleaned = input.trim().toUpperCase();

  // Already in correct format
  if (/^DR\d{7,8}$/.test(cleaned)) {
    return cleaned;
  }

  // Extract numbers only
  const numbers = cleaned.replace(/[^\d]/g, '');

  // Must have at least 7 digits
  if (numbers.length >= 7) {
    return `DR${numbers}`;
  }

  return cleaned; // Return as-is if can't normalize
}

/**
 * Normalize date to YYYY-MM-DD format
 * Handles: 25/11/2025, 2025-11-25, etc.
 */
function normalizeDate(input: string, fallback: string): string {
  if (!input) return fallback;

  // Try DD/MM/YYYY format
  const ddmmyyyy = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month}-${day}`;
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  return fallback;
}
