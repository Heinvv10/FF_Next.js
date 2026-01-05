# Asset Management Module

A free-standing, isolated module for managing company assets including test equipment, splice equipment, computing devices, and tools.

## Module Status

🔵 **IN DEVELOPMENT** - Phase 1: Foundation

## Features

- **Asset Categories**: Test Equipment, Splice Equipment, Computing Devices, Tools
- **Assignment Tracking**: Check-out/check-in to Staff, Projects, or Vehicles
- **Calibration Management**: Due date tracking with alerts for test equipment
- **Maintenance Scheduling**: Preventive and corrective maintenance
- **QR Code Integration**: Auto-generated QR codes for mobile scanning
- **Dashboard**: Asset health overview with key metrics
- **Email Notifications**: Alerts for due/overdue calibrations and maintenance

## Module Architecture

This module follows the **free-standing isolation pattern** - it can be extracted as a standalone service with minimal modifications.

### Directory Structure

```
assets/
├── index.ts           # Server-side exports (API routes)
├── client.ts          # Client-safe exports (browser)
├── README.md          # This file
├── types/             # TypeScript type definitions
├── services/          # Business logic (server-only)
├── hooks/             # React Query hooks (client-safe)
├── components/        # React UI components
├── utils/             # Utility functions
├── constants/         # Enums and constants
├── migrations/        # Database migrations
├── jobs/              # Background jobs
└── __tests__/         # Test suite
```

### Module Boundary

**Server-side** (`index.ts`):
- Types, services, utils, constants
- Used by API routes

**Client-side** (`client.ts`):
- Types, components, hooks, constants
- Safe for browser bundle
- NO database access

## Database Tables

- `asset_categories` - Category definitions
- `assets` - Main asset records
- `asset_assignments` - Check-out/in history
- `asset_maintenance` - Maintenance and calibration records
- `asset_documents` - Document attachments

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List assets |
| POST | `/api/assets` | Create asset |
| GET | `/api/assets/[id]` | Get asset details |
| PUT | `/api/assets/[id]` | Update asset |
| DELETE | `/api/assets/[id]` | Delete asset |
| POST | `/api/assets/[id]/checkout` | Check out asset |
| POST | `/api/assets/[id]/checkin` | Check in asset |
| GET | `/api/assets/barcode/[code]` | Lookup by barcode |
| GET | `/api/assets/dashboard/summary` | Dashboard stats |

## Usage

### Server-side (API Routes)

```typescript
import { assetService, categoryService } from '@/modules/assets';

// Create an asset
const asset = await assetService.create({
  name: 'EXFO MaxTester 730C',
  categoryId: 'otdr-category-id',
  serialNumber: 'EX123456',
});
```

### Client-side (React Components)

```typescript
import { useAssets, AssetList, AssetStatusBadge } from '@/modules/assets/client';

function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  return <AssetList assets={assets} isLoading={isLoading} />;
}
```

## Environment Variables

```bash
DATABASE_URL=postgresql://...     # Neon PostgreSQL
FIREBASE_STORAGE_BUCKET=...       # File uploads
RESEND_API_KEY=...                # Email notifications
CRON_SECRET=...                   # Job authentication
```

## Running Migrations

```bash
# From project root
psql $DATABASE_URL -f src/modules/assets/migrations/001_create_asset_tables.sql
psql $DATABASE_URL -f src/modules/assets/migrations/002_create_indexes.sql
psql $DATABASE_URL -f src/modules/assets/migrations/003_seed_categories.sql
```

## Testing

```bash
# Run asset module tests
npm test -- src/modules/assets

# Run with coverage
npm test -- src/modules/assets --coverage
```

## Extraction Guide

To extract this module as a standalone service:

1. Copy the entire `src/modules/assets/` directory
2. Replace `utils/db.ts` with your database adapter
3. Update environment variables
4. Deploy API routes to your HTTP framework
5. Schedule the alert generation job

No modifications to the core module logic are required.
