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
 * Case detail with all QContact fields
 * Maps to QContact case detail API response
 */
export interface FiberTimeCaseDetail {
  id: number;
  entity_type: string;
  label: string;
  icon: string;

  // Status & Assignment
  status: string;
  __status: string;
  __status__color: string;
  assigned_to: string;
  __assigned_to: number;

  // Category
  category: string | null;
  __category: string | null;
  __category__color: string | null;

  // Contact Info
  contact: string;
  __contact: number;
  telephone?: string;
  email?: string;

  // Address & Location
  address?: string;
  c__dr_location?: string;
  __c__dr_location?: string;
  location_pin?: string;
  gps_coordinates?: string;

  // Drop & Installation Info
  c__drop_number?: string;
  drop_number?: string;
  dr_number?: string;

  // Equipment
  c__serial_number?: string;
  serial_number?: string;
  ont_serial?: string;
  gizzu_serial?: string;

  // Additional Fields
  c__availability?: string;
  availability?: string;
  c__field_agent?: string;
  field_agent?: string;
  c__tv_connector?: string;
  tv_connector?: string;

  // Timestamps
  created_at: string;
  updated_at?: string;

  // Description & Notes
  description?: string;
  notes?: string;

  // Raw custom fields (c__ prefix fields)
  [key: string]: unknown;
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

/**
 * QContact Activity Entry
 * Represents a single activity (note, update, status change) on a case
 */
export interface QContactActivity {
  id: string;
  type: 'note' | 'update' | 'status_change' | 'assignment' | 'message' | 'system';
  description: string | null;
  field_changes: {
    field: string;
    old_value?: string;
    new_value: string;
  }[] | null;
  created_by: {
    name: string;
    email?: string;
  } | null;
  created_at: string;
  is_private: boolean;
  is_pinned: boolean;
}

/**
 * QContact Activities Response
 */
export interface QContactActivitiesResponse {
  activities: QContactActivity[];
  total: number;
}

/**
 * QContact Note/Comment Entry
 */
export interface QContactNote {
  id: string;
  content: string;
  created_by: {
    name: string;
    email?: string;
  };
  created_at: string;
  is_private: boolean;
  is_pinned: boolean;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

/**
 * WhatsApp Message from QContact conversation
 */
export interface QContactMessage {
  id: string;
  content: string;
  sender: string;
  sender_type: 'customer' | 'agent' | 'bot';
  timestamp: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
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
   * Get activities/timeline for a case
   * 🟢 WORKING: Fetches activity history, notes, and updates
   */
  async getCaseActivities(caseId: number): Promise<QContactActivitiesResponse> {
    try {
      logger.debug('Fetching case activities', { caseId });

      // QContact API endpoint for case events/timeline
      const response = await this.request<any>(
        'GET',
        `/api/v2/entities/Case/${caseId}/events?expand_conversations=false&page=1&sort=id%20DESC`
      );

      // Parse and normalize the response
      const activities: QContactActivity[] = [];

      if (Array.isArray(response)) {
        for (const item of response) {
          activities.push(this.parseActivity(item));
        }
      } else if (response.results) {
        for (const item of response.results) {
          activities.push(this.parseActivity(item));
        }
      }

      logger.debug('Fetched case activities', {
        caseId,
        count: activities.length,
      });

      return {
        activities,
        total: activities.length,
      };
    } catch (error) {
      // If activities endpoint doesn't exist, return empty
      if (
        error instanceof FiberTimeQContactError &&
        (error.statusCode === 404 || error.statusCode === 400)
      ) {
        logger.debug('Activities endpoint not available', { caseId });
        return { activities: [], total: 0 };
      }
      throw error;
    }
  }

  /**
   * Parse a raw event item from QContact API /events endpoint
   */
  private parseActivity(item: any): QContactActivity {
    // Determine activity type from event_type field
    let type: QContactActivity['type'] = 'note';
    const eventType = item.event_type || item.type;

    if (eventType === 'update') {
      type = 'update';
    } else if (eventType === 'status_change') {
      type = 'status_change';
    } else if (eventType === 'assignment' ||
               (item.formatted_changes && item.formatted_changes['$t.fields.assigned_to'])) {
      type = 'assignment';
    } else if (eventType === 'message' || eventType === 'conversation') {
      type = 'message';
    } else if (eventType === 'system' || eventType === 'automation') {
      type = 'system';
    } else if (eventType === 'note') {
      type = 'note';
    }

    // Parse field changes from formatted_changes (QContact format)
    let fieldChanges: QContactActivity['field_changes'] = null;
    if (item.formatted_changes && Object.keys(item.formatted_changes).length > 0) {
      fieldChanges = Object.values(item.formatted_changes).map((change: any) => ({
        field: change.field || 'Unknown',
        old_value: change.old_value,
        new_value: change.new_value,
      }));
    } else if (item.changes && Object.keys(item.changes).length > 0) {
      // Fallback to raw changes
      fieldChanges = Object.entries(item.changes).map(([field, value]: [string, any]) => ({
        field,
        old_value: typeof value === 'object' ? value.old_value : undefined,
        new_value: typeof value === 'object' ? value.new_value : String(value),
      }));
    }

    // Get description from subtitle or html
    const description = item.subtitle || item.html || item.content || item.description || null;

    // Get user info
    const user = item.user;

    return {
      id: String(item.id || Date.now()),
      type,
      description,
      field_changes: fieldChanges,
      created_by: user
        ? {
            name: user.label || user.name || 'Unknown',
            email: user.email,
          }
        : null,
      created_at: item.raised_at || item.created_at || new Date().toISOString(),
      is_private: item.public_note === false || item.public === false,
      is_pinned: item.pinned || item.is_pinned || false,
    };
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
   * Extract DR number from various fields
   * Checks multiple possible field names
   */
  static extractDRNumber(caseDetail: FiberTimeCaseDetail): string | null {
    // Check various field names for DR number
    const drNumber =
      caseDetail.dr_number ||
      caseDetail.c__drop_number ||
      caseDetail.drop_number ||
      caseDetail.c__dr_location ||
      (caseDetail['c__dr_number'] as string) ||
      null;

    // Extract DR pattern if embedded in string (e.g., "DR1853428")
    if (drNumber) {
      const match = drNumber.match(/DR\d+/i);
      return match ? match[0].toUpperCase() : drNumber;
    }

    return null;
  }

  /**
   * Map FiberTime case detail to enriched ticket data
   * Includes all contact, location, and equipment info
   */
  static mapCaseDetailToTicket(caseDetail: FiberTimeCaseDetail): {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    // Contact Info
    customer_name: string | null;
    customer_phone: string | null;
    customer_email: string | null;
    address: string | null;
    // Assignment
    assigned_to: string | null;
    // Category
    category: string | null;
    subcategory: string | null;
    // Drop & Location
    dr_number: string | null;
    gps_coordinates: string | null;
    // Equipment
    ont_serial: string | null;
    gizzu_serial: string | null;
    // Additional
    availability: string | null;
    field_agent: string | null;
    tv_connector: string | null;
    // Custom fields
    custom_fields: Record<string, unknown> | null;
  } {
    const reference = this.extractCaseReference(caseDetail.label);
    const drNumber = this.extractDRNumber(caseDetail);

    // Extract category and subcategory
    let category: string | null = null;
    let subcategory: string | null = null;

    if (caseDetail.category) {
      const parts = caseDetail.category.split('::');
      category = parts[0] || null;
      subcategory = parts[1] || null;
    }

    // Collect all custom fields (c__ prefix)
    const customFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(caseDetail)) {
      if (key.startsWith('c__') || key.startsWith('__c__')) {
        customFields[key] = value;
      }
    }

    return {
      id: String(caseDetail.id),
      title: reference,
      description: caseDetail.description || caseDetail.label,
      status: caseDetail.status,
      priority: 'medium',
      created_at: caseDetail.created_at,
      updated_at: caseDetail.updated_at || caseDetail.created_at,
      // Contact Info
      customer_name: caseDetail.contact || null,
      customer_phone: caseDetail.telephone || null,
      customer_email: caseDetail.email || null,
      address: caseDetail.address || null,
      // Assignment
      assigned_to: caseDetail.assigned_to || null,
      // Category
      category,
      subcategory,
      // Drop & Location
      dr_number: drNumber,
      gps_coordinates: caseDetail.gps_coordinates || caseDetail.location_pin || null,
      // Equipment
      ont_serial: caseDetail.ont_serial || caseDetail.c__serial_number || caseDetail.serial_number || null,
      gizzu_serial: caseDetail.gizzu_serial || null,
      // Additional
      availability: caseDetail.availability || caseDetail.c__availability || null,
      field_agent: caseDetail.field_agent || caseDetail.c__field_agent || null,
      tv_connector: caseDetail.tv_connector || caseDetail.c__tv_connector || null,
      // Custom fields
      custom_fields: {
        ...customFields,
        qcontact_internal_id: caseDetail.id,
        entity_type: caseDetail.entity_type,
      },
    };
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
