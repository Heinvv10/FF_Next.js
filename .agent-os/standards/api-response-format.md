# API Response Standards

**CRITICAL**: All API endpoints MUST use standardized response formats for consistency.

## Standard Response Helper

Use the `apiResponse` helper from `lib/apiResponse.ts`:

```typescript
import { apiResponse } from '@/lib/apiResponse';

// Success response (200)
return apiResponse.success(res, data, 'Optional message');

// Created response (201)
return apiResponse.created(res, data, 'Resource created successfully');

// Error responses
return apiResponse.notFound(res, 'Resource', id);
return apiResponse.validationError(res, { field: 'Error message' });
return apiResponse.unauthorized(res);
return apiResponse.internalError(res, error);
```

## Response Structure

All responses follow this format:

### Success Response
```typescript
{
  success: true,
  data: {...},           // The actual data
  message?: string,      // Optional success message
  meta: {
    timestamp: string    // ISO timestamp
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,        // Error code enum
    message: string,     // Human-readable message
    details?: any        // Optional error details
  },
  meta: {
    timestamp: string
  }
}
```

## Frontend API Service Pattern

Frontend services must handle the standard response format:

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;  // Unwrap { success: true, data: {...} }
}
```

## Why This Matters

- **Inconsistent response formats cause frontend parsing errors**
- The `data.data || data` pattern handles both wrapped and unwrapped responses
- Standardization prevents 405 errors and mysterious failures
- See `src/services/contractor/contractorApiService.ts` for reference implementation

## Best Practice

**Always use `apiResponse` helper in new APIs**. When modifying existing APIs that use manual `{ success: true, data: ... }`, consider migrating to the helper for maintainability.

## Complete Example

```typescript
// pages/api/contractors-documents.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { apiResponse } from '@/lib/apiResponse';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return apiResponse.methodNotAllowed(res);
  }

  const { contractorId } = req.query;

  if (!contractorId || typeof contractorId !== 'string') {
    return apiResponse.validationError(res, {
      contractorId: 'Contractor ID is required'
    });
  }

  try {
    const documents = await sql`
      SELECT * FROM contractor_documents
      WHERE contractor_id = ${contractorId}
      ORDER BY created_at DESC
    `;

    if (documents.length === 0) {
      return apiResponse.notFound(res, 'Documents', contractorId);
    }

    return apiResponse.success(res, documents, 'Documents retrieved successfully');
  } catch (error) {
    console.error('Database error:', error);
    return apiResponse.internalError(res, error);
  }
}
```

## Error Code Enums

Available error codes in `apiResponse` helper:

- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `INTERNAL_ERROR` - Server error
- `METHOD_NOT_ALLOWED` - Wrong HTTP method

## Frontend Example

```typescript
// src/services/contractor/contractorApiService.ts
export const contractorApiService = {
  async getDocuments(contractorId: string): Promise<Document[]> {
    const response = await fetch(`/api/contractors-documents?contractorId=${contractorId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.error?.message || error.message || 'Failed to fetch documents');
    }

    const json = await response.json();
    return json.data || json; // Handle both { success: true, data: [...] } and [...]
  }
};
```

## Migration Guide

If you find an endpoint using manual response format:

```typescript
// ❌ Before (manual format)
export default async function handler(req, res) {
  const data = await fetchData();
  return res.status(200).json({ success: true, data });
}

// ✅ After (using helper)
import { apiResponse } from '@/lib/apiResponse';

export default async function handler(req, res) {
  const data = await fetchData();
  return apiResponse.success(res, data);
}
```

This standardization ensures:
- Consistent error handling across the app
- Easier debugging with standard error codes
- Better TypeScript type inference
- Simpler frontend service implementations
