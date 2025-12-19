// tests/api/ticketing/helpers/apiResponseMock.ts
// Shared mock for apiResponse to ensure consistent testing
import { vi } from 'vitest';

/**
 * Mock apiResponse helper for tests
 * This mock replicates the actual apiResponse behavior for testing
 */
export function setupApiResponseMock() {
  vi.mock('@/lib/apiResponse', () => {
    const mockResponse = (res: any, statusCode: number, body: any) => {
      res.status(statusCode).json(body);
    };
    return {
      apiResponse: {
        success: (res: any, data: any, message?: string) => {
          mockResponse(res, 200, {
            success: true,
            data,
            ...(message && { message }),
            meta: { timestamp: new Date().toISOString() }
          });
        },
        created: (res: any, data: any, message?: string) => {
          mockResponse(res, 201, {
            success: true,
            data,
            message: message || 'Resource created successfully',
            meta: { timestamp: new Date().toISOString() }
          });
        },
        paginated: (res: any, data: any[], pagination: { page: number; pageSize: number; total: number }) => {
          mockResponse(res, 200, {
            success: true,
            data,
            pagination: {
              ...pagination,
              totalPages: Math.ceil(pagination.total / pagination.pageSize),
            },
            meta: { timestamp: new Date().toISOString() },
          });
        },
        noContent: (res: any) => {
          res.status(204).end();
        },
        methodNotAllowed: (res: any, method: string, allowed: string[]) => {
          res.setHeader('Allow', allowed.join(', '));
          mockResponse(res, 405, {
            success: false,
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `Method ${method} not allowed. Allowed methods: ${allowed.join(', ')}`
            },
            meta: { timestamp: new Date().toISOString() }
          });
        },
        badRequest: (res: any, message: string, details?: any) => {
          mockResponse(res, 400, {
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message,
              ...(details && { details }),
            },
            meta: { timestamp: new Date().toISOString() }
          });
        },
        validationError: (res: any, errors: Record<string, string | string[]>, message = 'Validation failed') => {
          mockResponse(res, 422, {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message,
              details: errors,
            },
            meta: { timestamp: new Date().toISOString() },
          });
        },
        unauthorized: (res: any, message = 'Authentication required') => {
          mockResponse(res, 401, {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message
            },
            meta: { timestamp: new Date().toISOString() }
          });
        },
        forbidden: (res: any, message = 'You do not have permission to perform this action') => {
          mockResponse(res, 403, {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message,
            },
            meta: { timestamp: new Date().toISOString() },
          });
        },
        notFound: (res: any, resource: string, identifier?: string | number) => {
          const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
          mockResponse(res, 404, {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message
            },
            meta: { timestamp: new Date().toISOString() }
          });
        },
        internalError: (res: any, error: any, message = 'An internal error occurred') => {
          console.error('Internal Server Error:', error);
          mockResponse(res, 500, {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message
            },
            meta: { timestamp: new Date().toISOString() }
          });
        },
        databaseError: (res: any, error: any, message = 'A database error occurred') => {
          console.error('Database Error:', error);
          mockResponse(res, 500, {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message,
            },
            meta: { timestamp: new Date().toISOString() },
          });
        },
      },
    };
  });
}
