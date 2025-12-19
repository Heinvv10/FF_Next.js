// src/modules/ticketing/integrations/invoicing/invoicingClient.ts
// Client for external invoicing system integration

import type { InvoiceLineItem, InvoiceResponse, GenerateInvoiceInput } from '../../types';

interface InvoicingClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

/**
 * Client for integrating with external invoicing system
 * Generates invoice line items from resolved billable tickets
 */
export class InvoicingClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: InvoicingClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Create an invoice line item from a billable ticket
   */
  async createLineItem(data: InvoiceLineItem): Promise<InvoiceResponse> {
    const response = await this.request<InvoiceResponse>('/line-items', {
      method: 'POST',
      body: JSON.stringify({
        reference: data.ticket_uid,
        description: data.description,
        quantity: data.quantity || 1,
        unit_price: data.unit_price,
        total: data.total,
        client_id: data.client_id,
        project_id: data.project_id,
        tax_rate: data.tax_rate || 0,
        metadata: {
          ticket_id: data.ticket_id,
          billing_type: data.billing_type,
          service_date: data.service_date,
        },
      }),
    });

    return response;
  }

  /**
   * Generate a full invoice for a ticket
   */
  async generateInvoice(input: GenerateInvoiceInput): Promise<InvoiceResponse> {
    const lineItems = input.line_items.map(item => ({
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price,
      total: item.total,
    }));

    const response = await this.request<InvoiceResponse>('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        client_id: input.client_id,
        project_id: input.project_id,
        reference: input.ticket_uid,
        line_items: lineItems,
        subtotal: input.subtotal,
        tax: input.tax || 0,
        total: input.total,
        due_date: input.due_date,
        notes: input.notes,
      }),
    });

    return response;
  }

  /**
   * Get invoice status by ID
   */
  async getInvoiceStatus(invoiceId: string): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>(`/invoices/${invoiceId}`);
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>(`/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Make HTTP request to invoicing API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new InvoicingError(
          `Invoicing API error: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof InvoicingError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new InvoicingError('Request timeout', 408);
      }

      throw new InvoicingError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }
}

/**
 * Custom error class for invoicing operations
 */
export class InvoicingError extends Error {
  public statusCode: number;
  public responseBody?: string;

  constructor(message: string, statusCode: number, responseBody?: string) {
    super(message);
    this.name = 'InvoicingError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Create invoicing client from environment variables
 */
export function createInvoicingClient(): InvoicingClient | null {
  const baseUrl = process.env.INVOICING_API_URL;
  const apiKey = process.env.INVOICING_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return new InvoicingClient({
    baseUrl,
    apiKey,
    timeout: 30000,
  });
}
