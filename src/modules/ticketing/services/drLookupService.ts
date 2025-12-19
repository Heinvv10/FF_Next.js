// src/modules/ticketing/services/drLookupService.ts
// Business logic for DR (Drop Reference) number lookup and validation
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface DRLookupResult {
  dr_number: string;
  exists: boolean;
  project_id?: string;
  project_name?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  status?: string;
  is_guaranteed?: boolean;
  guarantee_details?: {
    guarantee_id: string;
    project_name: string;
    end_date: Date | null;
    incident_limit: number | null;
    incident_count: number;
  };
  sow_data?: {
    fibre_length?: number;
    pole_count?: number;
    splitter_count?: number;
    installation_type?: string;
  };
}

export interface DRValidationResult {
  is_valid: boolean;
  dr_number: string;
  error?: string;
  suggestions?: string[];
}

export class DRLookupService {
  /**
   * Look up a DR number and return all associated information
   * Checks both SOW drops table and WA Monitor qa_photo_reviews table
   */
  static async lookupDR(drNumber: string): Promise<DRLookupResult> {
    const normalizedDR = this.normalizeDRNumber(drNumber);

    // First, try SOW drops table
    const sowQuery = `
      SELECT
        drop_number,
        project_id,
        address,
        latitude,
        longitude,
        status
      FROM drops
      WHERE drop_number = $1
      LIMIT 1
    `;

    const sowResult = await sql.query(sowQuery, [normalizedDR]);

    if (sowResult.rows.length > 0) {
      const drop = sowResult.rows[0];

      // Check if this DR is covered under a project guarantee
      const guaranteeResult = await this.checkGuaranteeCoverage(
        normalizedDR,
        drop.project_id
      );

      // Get SOW fiber data
      const sowData = await this.getSOWData(normalizedDR);

      return {
        dr_number: normalizedDR,
        exists: true,
        project_id: drop.project_id,
        address: drop.address,
        coordinates: {
          lat: parseFloat(drop.latitude),
          lon: parseFloat(drop.longitude),
        },
        status: drop.status,
        is_guaranteed: guaranteeResult.is_guaranteed,
        guarantee_details: guaranteeResult.details,
        sow_data: sowData,
      };
    }

    // If not found in SOW, try WA Monitor qa_photo_reviews table
    const qaQuery = `
      SELECT
        drop_number,
        project,
        address
      FROM qa_photo_reviews
      WHERE drop_number = $1
      LIMIT 1
    `;

    const qaResult = await sql.query(qaQuery, [normalizedDR]);

    if (qaResult.rows.length > 0) {
      const qaRecord = qaResult.rows[0];

      return {
        dr_number: normalizedDR,
        exists: true,
        project_name: qaRecord.project,
        address: qaRecord.address,
      };
    }

    // DR not found in either table
    return {
      dr_number: normalizedDR,
      exists: false,
    };
  }

  /**
   * Validate DR number format
   * Expected format: DR followed by digits (e.g., DR001234, DRTEST0808)
   */
  static validateDRFormat(drNumber: string): DRValidationResult {
    const normalizedDR = this.normalizeDRNumber(drNumber);

    // DR number must start with "DR" followed by alphanumeric characters
    const drPattern = /^DR[A-Z0-9]+$/i;

    if (!drPattern.test(normalizedDR)) {
      return {
        is_valid: false,
        dr_number: normalizedDR,
        error: 'Invalid DR number format. Expected format: DR followed by numbers/letters (e.g., DR001234)',
        suggestions: this.generateDRSuggestions(drNumber),
      };
    }

    // Valid format
    return {
      is_valid: true,
      dr_number: normalizedDR,
    };
  }

  /**
   * Normalize DR number to consistent format
   * Converts to uppercase, removes spaces/dashes
   */
  private static normalizeDRNumber(drNumber: string): string {
    return drNumber.toUpperCase().replace(/[\s\-]/g, '');
  }

  /**
   * Generate DR number suggestions based on common mistakes
   */
  private static generateDRSuggestions(input: string): string[] {
    const suggestions: string[] = [];

    // Add "DR" prefix if missing
    if (!input.toUpperCase().startsWith('DR')) {
      suggestions.push(`DR${input.toUpperCase()}`);
    }

    // Remove common prefixes that might be mistaken for DR
    const cleaned = input.replace(/^(DROP|D|R)[\s\-]*/i, '');
    if (cleaned !== input) {
      suggestions.push(`DR${cleaned.toUpperCase()}`);
    }

    return suggestions;
  }

  /**
   * Check if DR number is covered under a project guarantee
   */
  private static async checkGuaranteeCoverage(
    drNumber: string,
    projectId: string
  ): Promise<{
    is_guaranteed: boolean;
    details?: {
      guarantee_id: string;
      project_name: string;
      end_date: Date | null;
      incident_limit: number | null;
      incident_count: number;
    };
  }> {
    const query = `
      SELECT
        id,
        project_name,
        end_date,
        incident_limit,
        incident_count,
        dr_numbers
      FROM project_guarantees
      WHERE project_id = $1
        AND is_active = TRUE
        AND (end_date IS NULL OR end_date > NOW())
      LIMIT 1
    `;

    const result = await sql.query(query, [projectId]);

    if (result.rows.length === 0) {
      return { is_guaranteed: false };
    }

    const guarantee = result.rows[0];

    // Check if this specific DR is in the guarantee list
    const drNumbers = guarantee.dr_numbers as string[] | null;
    if (!drNumbers || !drNumbers.includes(drNumber)) {
      return { is_guaranteed: false };
    }

    return {
      is_guaranteed: true,
      details: {
        guarantee_id: guarantee.id,
        project_name: guarantee.project_name,
        end_date: guarantee.end_date,
        incident_limit: guarantee.incident_limit,
        incident_count: guarantee.incident_count,
      },
    };
  }

  /**
   * Get SOW fiber installation data for a DR number
   */
  private static async getSOWData(drNumber: string): Promise<{
    fibre_length?: number;
    pole_count?: number;
    splitter_count?: number;
    installation_type?: string;
  } | null> {
    const query = `
      SELECT
        fibre_length_m,
        poles,
        splitters,
        type
      FROM sow_fibre
      WHERE drop_number = $1
      LIMIT 1
    `;

    const result = await sql.query(query, [drNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    const sowData = result.rows[0];

    return {
      fibre_length: sowData.fibre_length_m,
      pole_count: sowData.poles,
      splitter_count: sowData.splitters,
      installation_type: sowData.type,
    };
  }

  /**
   * Search for DR numbers by partial match
   * Useful for autocomplete/typeahead functionality
   */
  static async searchDRNumbers(params: {
    search_term: string;
    project_id?: string;
    limit?: number;
  }): Promise<DRLookupResult[]> {
    const searchTerm = this.normalizeDRNumber(params.search_term);
    const limit = params.limit || 10;

    const whereConditions: string[] = [`drop_number ILIKE $1`];
    const queryParams: unknown[] = [`${searchTerm}%`];
    let paramIndex = 2;

    if (params.project_id) {
      whereConditions.push(`project_id = $${paramIndex}`);
      queryParams.push(params.project_id);
      paramIndex++;
    }

    queryParams.push(limit);
    const limitParam = paramIndex;

    const query = `
      SELECT
        drop_number,
        project_id,
        address,
        latitude,
        longitude,
        status
      FROM drops
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY drop_number ASC
      LIMIT $${limitParam}
    `;

    const result = await sql.query(query, queryParams);

    const drResults: DRLookupResult[] = [];

    for (const row of result.rows) {
      const guaranteeResult = await this.checkGuaranteeCoverage(
        row.drop_number,
        row.project_id
      );

      drResults.push({
        dr_number: row.drop_number,
        exists: true,
        project_id: row.project_id,
        address: row.address,
        coordinates: {
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
        },
        status: row.status,
        is_guaranteed: guaranteeResult.is_guaranteed,
        guarantee_details: guaranteeResult.details,
      });
    }

    return drResults;
  }

  /**
   * Bulk validate multiple DR numbers
   */
  static async bulkValidate(
    drNumbers: string[]
  ): Promise<Map<string, DRValidationResult>> {
    const results = new Map<string, DRValidationResult>();

    for (const drNumber of drNumbers) {
      const validation = this.validateDRFormat(drNumber);
      results.set(drNumber, validation);
    }

    return results;
  }

  /**
   * Get all DR numbers for a specific project
   */
  static async getDRsByProject(params: {
    project_id: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: DRLookupResult[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }> {
    const whereConditions: string[] = ['project_id = $1'];
    const queryParams: unknown[] = [params.project_id];
    let paramIndex = 2;

    if (params.status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(params.status);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM drops
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countResult = await sql.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    queryParams.push(limit);
    const limitParam = paramIndex;
    paramIndex++;

    queryParams.push(offset);
    const offsetParam = paramIndex;

    const query = `
      SELECT
        drop_number,
        project_id,
        address,
        latitude,
        longitude,
        status
      FROM drops
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY drop_number ASC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `;

    const result = await sql.query(query, queryParams);

    const drResults: DRLookupResult[] = [];

    for (const row of result.rows) {
      const guaranteeResult = await this.checkGuaranteeCoverage(
        row.drop_number,
        params.project_id
      );

      drResults.push({
        dr_number: row.drop_number,
        exists: true,
        project_id: row.project_id,
        address: row.address,
        coordinates: {
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
        },
        status: row.status,
        is_guaranteed: guaranteeResult.is_guaranteed,
        guarantee_details: guaranteeResult.details,
      });
    }

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: drResults,
      total,
      page,
      per_page: limit,
      total_pages: totalPages,
    };
  }
}
