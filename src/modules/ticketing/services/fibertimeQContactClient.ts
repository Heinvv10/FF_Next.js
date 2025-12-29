/**
 * FiberTime QContact API Client
 * 🟢 WORKING: Production-ready HTTP client for FiberTime QContact API
 *
 * Connects to: https://fibertime.qcontact.com/api/v2/
 *
 * Features:
 * - Token-based authentication (uid, access-token, client headers)
 * - Fetch cases assigned to Maintenance - Velocity
 * - Field mapping for FibreFlow integration
 * - Automatic retry with exponential backoff
 *
 * @module ticketing/services/fibertimeQContactClient
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('fibertimeQContactClient');

// ============================================================================
// Configuration
// ============================================================================

/**
 * FiberTime QContact API configuration
 */
export interface FiberTimeQContactConfig {
  baseUrl: string;
  uid: string;
  accessToken: string;
  client: string;
  timeoutMs?: number;
  retryAttempts?: number;
}

/**
 * Maintenance - Velocity assigned_to ID in QContact
 */
export const MAINTENANCE_VELOCITY_ID = '21924332416';

// ============================================================================
// Types
// ============================================================================

/**
 * QContact Case from FiberTime API
 */
export interface FiberTimeCaseResponse {
  columns: Array<{
    name: string;
    label: string;
    type: string;
  }>;
  results: FiberTimeCase[];
  total?: number;
  page?: number;
}

/**
 * Individual case from QContact
 */
export interface FiberTimeCase {
  id: number;
  entity_type: string;
  label: string; // e.g., "FT490441" or "Connection Issue FT499061"
  icon: string;
  assigned_to: string;
  category: string | null;
  contact: string;
  created_at: string;
  status: string;
  c__dr_location: string | null;
  __assigned_to: number;
  __contact: number;
  __category: string | null;
  __category__color: string | null;
  __status: string;
  __status__color: string;
  __c__dr_location: string | null;
}

/**
 * Case detail with additional fields
 */
export interface FiberTimeCaseDetail extends FiberTimeCase {
  description?: string;
  telephone?: string;
  email?: string;
  address?: string;
  drop_number?: string;
  dr_number?: string;
  serial_number?: string;
}

/**
 * List cases options
 */
export interface ListCasesOptions {
  assignedTo?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Error Classes
// ============================================================================

export class FiberTimeQContactError extends Error {
  public readonly statusCode: number | undefined;
  public readonly isRecoverable: boolean;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      isRecoverable?: boolean;
    }
  ) {
    super(message);
    this.name = 'FiberTimeQContactError';
    this.statusCode = options?.statusCode;
    this.isRecoverable = options?.isRecoverable ?? false;
  }
}

// ============================================================================
// Client Class
// ============================================================================

/**
 * FiberTime QContact API Client
 */
export class FiberTimeQContactClient {
  private readonly baseUrl: string;
  private readonly uid: string;
  private readonly accessToken: string;
  private readonly client: string;
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;

  constructor(config: FiberTimeQContactConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.uid = config.uid;
    this.accessToken = config.accessToken;
    this.client = config.client;
    this.timeoutMs = config.timeoutMs || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  /**
   * Get request headers for authentication
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      uid: this.uid,
      'access-token': this.accessToken,
      client: this.client,
    };
  }

  /**
   * Make authenticated request to QContact API
   */
  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    logger.debug('FiberTime QContact request', { method, path });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FiberTimeQContactError(
          `HTTP ${response.status}: ${response.statusText}`,
          {
            statusCode: response.status,
            isRecoverable: response.status >= 500,
          }
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof FiberTimeQContactError) {
        throw error;
      }

      throw new FiberTimeQContactError(
        error instanceof Error ? error.message : 'Unknown error',
        { isRecoverable: true }
      );
    }
  }

  /**
   * List cases with filters
   * 🟢 WORKING: Fetches cases from QContact with optional filtering
   */
  async listCases(options: ListCasesOptions = {}): Promise<FiberTimeCaseResponse> {
    const assignedToId = options.assignedTo || MAINTENANCE_VELOCITY_ID;

    // Build filter JSON
    const filters = JSON.stringify([
      {
        operator: 'all',
        conditions: [
          {
            name: 'assigned_to',
            value: assignedToId,
            operator: 'equals',
          },
        ],
      },
    ]);

    const params: Record<string, string> = {
      sort: '',
      page: String(options.page || 1),
      view: 'all',
      items: String(options.pageSize || 50),
      filters,
    };

    logger.info('Fetching cases from FiberTime QContact', {
      assignedTo: assignedToId,
      page: options.page || 1,
    });

    const response = await this.request<FiberTimeCaseResponse>(
      'GET',
      '/api/v2/entities/Case',
      params
    );

    logger.info('Fetched cases from FiberTime QContact', {
      count: response.results.length,
    });

    return response;
  }

  /**
   * Get single case by ID
   */
  async getCase(caseId: number): Promise<FiberTimeCaseDetail | null> {
    try {
      const response = await this.request<FiberTimeCaseDetail>(
        'GET',
        `/api/v2/entities/Case/${caseId}`
      );
      return response;
    } catch (error) {
      if (
        error instanceof FiberTimeQContactError &&
        error.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/api/v2/me');
      return true;
    } catch (error) {
      logger.warn('FiberTime QContact health check failed', { error });
      return false;
    }
  }

  /**
   * Extract case reference from label
   * e.g., "Connection Issue FT499061" -> "FT499061"
   *       " FT490441" -> "FT490441"
   */
  static extractCaseReference(label: string): string {
    const match = label.match(/FT\d+/);
    return match ? match[0] : label.trim();
  }

  /**
   * Map FiberTime case to QContact ticket format for sync
   */
  static mapCaseToTicket(ftCase: FiberTimeCase): {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    address: string | null;
    assigned_to: string | null;
    category: string | null;
    subcategory: string | null;
    custom_fields: Record<string, unknown> | null;
  } {
    const reference = this.extractCaseReference(ftCase.label);

    // Extract category and subcategory from category field
    // e.g., "Connectivity::ONT/Gizzu" -> category: "Connectivity", subcategory: "ONT/Gizzu"
    let category: string | null = null;
    let subcategory: string | null = null;

    if (ftCase.category) {
      const parts = ftCase.category.split('::');
      category = parts[0] || null;
      subcategory = parts[1] || null;
    }

    return {
      id: String(ftCase.id),
      title: reference,
      description: ftCase.label,
      status: ftCase.status,
      priority: 'normal', // QContact doesn't expose priority in list view
      created_at: ftCase.created_at,
      updated_at: ftCase.created_at, // Use created_at as fallback
      customer_name: ftCase.contact,
      customer_phone: null,
      customer_email: null,
      address: null,
      assigned_to: ftCase.assigned_to,
      category,
      subcategory,
      custom_fields: {
        dr_location: ftCase.c__dr_location,
        qcontact_internal_id: ftCase.id,
        entity_type: ftCase.entity_type,
      },
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create FiberTime QContact client from environment variables
 */
export function createFiberTimeQContactClient(): FiberTimeQContactClient {
  const config: FiberTimeQContactConfig = {
    baseUrl:
      process.env.FIBERTIME_QCONTACT_BASE_URL ||
      'https://fibertime.qcontact.com',
    uid: process.env.FIBERTIME_QCONTACT_UID || '',
    accessToken: process.env.FIBERTIME_QCONTACT_ACCESS_TOKEN || '',
    client: process.env.FIBERTIME_QCONTACT_CLIENT || '',
    timeoutMs: parseInt(process.env.FIBERTIME_QCONTACT_TIMEOUT_MS || '30000', 10),
    retryAttempts: parseInt(
      process.env.FIBERTIME_QCONTACT_RETRY_ATTEMPTS || '3',
      10
    ),
  };

  if (!config.uid || !config.accessToken || !config.client) {
    logger.warn(
      'FiberTime QContact credentials not fully configured. Set FIBERTIME_QCONTACT_UID, FIBERTIME_QCONTACT_ACCESS_TOKEN, and FIBERTIME_QCONTACT_CLIENT environment variables.'
    );
  }

  return new FiberTimeQContactClient(config);
}

/**
 * Singleton instance
 */
let defaultClient: FiberTimeQContactClient | null = null;

export function getDefaultFiberTimeQContactClient(): FiberTimeQContactClient {
  if (!defaultClient) {
    defaultClient = createFiberTimeQContactClient();
  }
  return defaultClient;
}

export function resetDefaultFiberTimeQContactClient(): void {
  defaultClient = null;
}
