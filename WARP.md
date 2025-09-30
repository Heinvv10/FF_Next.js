# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**FibreFlow Next.js** - A modern fiber network project management application migrated from React/Vite to Next.js 14 with Clerk authentication. This is a comprehensive business application for managing fiber optic network installations, procurement, and project workflows.

## 🚨 Critical Development Setup

### Start the Application (PRODUCTION MODE ONLY)

**⚠️ DO NOT USE `npm run dev` - It has a known Watchpack bug that WILL cause failure!**

```bash
# REQUIRED: Build first (always do this before starting)
npm run build

# Start production server on port 3005
PORT=3005 npm start
```

**Access at: http://localhost:3005**

### Making Code Changes

1. Make your code changes
2. Stop the server (Ctrl+C)
3. Rebuild: `npm run build`
4. Restart: `PORT=3005 npm start`

### Why This Approach Works

- **Known Issue**: Development server has Watchpack bug due to nested package.json files in `neon/` directory
- **Solution**: Production mode bypasses file watcher entirely
- **Stability**: 100% reliable for local development

## Essential Commands

### Development & Build
```bash
npm run build            # Build for production (REQUIRED before starting)
PORT=3005 npm start      # Start production server
npm run build:turbo      # Turbo build (faster)
npm run analyze          # Bundle analysis
npm run type-check       # TypeScript checking
```

### Testing
```bash
npm test                        # Run Vitest unit tests
npm run test:ui                 # Vitest UI mode
npm run test:coverage           # Coverage reports
npm run test:e2e               # Playwright E2E tests
npm run test:e2e:ui            # Playwright UI mode
npm run test:e2e:debug         # Debug E2E tests
npm run test:e2e:smoke         # Smoke tests (@smoke tagged)
npm run test:integration       # API integration tests
npm run test:no-direct-db      # Tests without direct DB access
```

### Database Operations
```bash
npm run db:migrate             # Run custom migration scripts
npm run db:seed                # Seed database with initial data
npm run db:validate            # Validate schema and connections
npm run db:setup               # Initial database setup
npm run db:test                # Run database tests
npm run db:test:suite          # Full database test suite
npm run db:test:schema         # Schema validation tests
npm run db:migrate:realtime    # Real-time migration scripts
```

### Code Quality
```bash
npm run lint                   # ESLint checking
npm run lint:strict           # Strict linting (no warnings)
npm run lint:fix              # Auto-fix lint issues
npm run format                # Prettier formatting
npm run format:check          # Check formatting
npm run antihall              # Anti-hallucination validator
npm run check:db-connections  # Check for direct DB connections
npm run test:logger           # Test logging functionality
```

### Single Test Execution
```bash
# Run specific test file
npx vitest run src/path/to/test.test.ts

# Run specific test suite pattern
npx vitest run --grep "test pattern"

# Debug specific test
npx vitest --run src/path/to/test.test.ts --reporter=verbose

# Run E2E test by tag
npm run test:e2e -- --grep "@smoke"
npm run test:e2e -- --grep "@visual"
npm run test:e2e -- --grep "@mobile"
```

### Custom Tooling & Specifications
```bash
# Project specification management
npm run spec-kit constitution  # Create/update project constitution
npm run spec-kit specify       # Create new specifications
npm run spec-kit plan          # Create implementation plans
npm run spec-kit tasks         # Generate task lists
npm run spec-kit analyze       # Analyze project alignment

# Module-specific specifications
npm run spec-module spec        # Create module specifications
npm run spec-module list        # List all module specifications

# Direct usage alternatives
./spec-kit <command>            # Direct CLI access
./spec-kit-module <command>     # Direct module CLI access
./spec.sh <command>            # Wrapper script
```

### Warp Workflow Automation
```bash
# Development cycle automation (recommended for Warp agents)
npm run warp:restart           # Stop → Build → Start cycle
npm run warp:quick-test        # Restart + smoke tests
npm run warp:full-cycle        # Full workflow: lint → build → start → test

# Project context and status (ideal for Warp agents)
npm run warp:status            # Complete project status overview
npm run warp:context           # Contextual project information
npm run warp:health            # Health check of all project components

# Direct script access
node scripts/warp-dev-cycle.js [restart|quick-test|full-cycle|status]
node scripts/warp-context.js [status|recent|health|env|server|json]
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14.2.18 with App Router
- **Frontend**: React 18, TypeScript, TailwindCSS
- **Authentication**: Clerk (replaces Firebase Auth)
- **Database**: Neon PostgreSQL with serverless client
- **State Management**: Zustand, React Query (@tanstack/react-query)
- **UI Components**: Custom components + Material-UI + Radix UI
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: TailwindCSS with custom design system

### High-Level Architecture

#### Modular Domain Structure
The application uses a modular architecture organized by business domains:

```
src/modules/
├── projects/           # Core project management
├── procurement/        # BOQ, RFQ, supplier management
├── installations/      # Home installations tracking
├── workflow/          # Business process workflows
├── suppliers/         # Supplier portal and management
├── meetings/          # Meeting management and notes
├── analytics/         # KPI dashboards and reporting
├── staff/            # Staff management
├── clients/          # Client management
└── contractors/      # Contractor onboarding and compliance
```

#### Service Layer Architecture
Business logic is organized in domain-focused services:

```
src/services/
├── procurement/       # BOQ, RFQ, stock management
├── projects/         # Project lifecycle management
├── fileImport/       # Excel/CSV import engine
├── auth/            # Authentication services
├── realtime/        # Socket.io real-time updates
├── sync/            # Data synchronization
└── core/            # Shared utilities and validation
```

#### Data Flow Patterns

1. **Database Access**: Direct SQL queries using Neon serverless client (no ORM)
2. **API Layer**: Next.js App Router API routes (`/api/*`)
3. **State Management**: React Query for server state, Zustand for client state
4. **Real-time Updates**: Socket.io for live data synchronization
5. **File Processing**: Dedicated import engine for Excel/CSV processing

### Key Architectural Decisions

#### Database Strategy
- **Neon PostgreSQL**: Serverless database with direct SQL queries
- **No ORM**: Uses template literals for type-safe SQL
- **Connection Pattern**: `@neondatabase/serverless` client
- **Migrations**: Custom migration system in `scripts/migrations/`

#### Authentication Flow
- **Clerk Integration**: Complete replacement of Firebase Auth
- **Route Protection**: Middleware-based auth checking
- **User Context**: Centralized user state management

#### Component Organization
- **Shared Components**: `src/components/` for reusable UI
- **Module Components**: Domain-specific components in respective modules
- **Layout System**: `AppLayout` as the standard application layout
- **UI Library**: Custom design system in `src/components/ui/`

## Development Guidelines

### File Organization Standards
- **File Size Limit**: Keep files under 300 lines for better organization
- **Component Structure**: Components should be < 200 lines, extract business logic to hooks
- **Type Organization**: Group types by domain (e.g., `types/procurement/`)
- **Service Pattern**: Domain-focused services, split large services into operations

### Import Path Aliases
The project uses TypeScript path mapping for clean imports:

```typescript
@/*              # src/*
@/components/*   # src/components/*
@/services/*     # src/services/*
@/modules/*      # src/modules/*
@/types/*        # src/types/*
@/hooks/*        # src/hooks/*
@/lib/*          # src/lib/*
@/utils/*        # src/utils/*
@/config/*       # src/config/*
```

### Database Development
- **Connection**: Use Neon serverless client for all database operations
- **Query Pattern**: Direct SQL with template literals for type safety
- **Transactions**: Handle within service layer methods
- **Migrations**: Use custom migration runner in `scripts/migrations/`

### Testing Strategy
- **Unit Tests**: Vitest for service layer and utility functions
- **Integration Tests**: API endpoint testing with test database
- **E2E Tests**: Playwright for user workflow testing
- **Database Tests**: Validate schema and connection integrity

### Code Quality Enforcement
- **Anti-hallucination**: Run `npm run antihall` to validate code references exist
- **Database Patterns**: `npm run check:db-connections` prevents direct DB access in components
- **TypeScript**: Strict mode enabled with comprehensive path mapping
- **Linting**: ESLint with React and TypeScript rules

## Important Project Context

### Migration Status
- **✅ Complete**: Successfully migrated from React/Vite to Next.js
- **✅ Authentication**: Clerk fully integrated (Firebase Auth removed)
- **✅ API Layer**: Next.js API routes replace Express server
- **✅ Production Ready**: Stable production deployment

### Active Features
- **SOW Import**: Statement of Work import functionality (`SOW/` directory)
- **Real-time Updates**: Socket.io integration for live data
- **File Processing**: Advanced Excel/CSV import engine
- **Procurement Module**: Complete BOQ, RFQ, and supplier management
- **Project Tracking**: Multi-phase project lifecycle management

### Development Logging
After making significant changes to pages, update corresponding logs in `docs/page-logs/`:
- **Format**: Timestamp with `Month DD, YYYY - HH:MM AM/PM`
- **Include**: Problem description, solution with file:line references, testing results
- **Index**: Update `docs/page-logs/README.md` for new page logs

### Known Limitations
- **Development Server**: `npm run dev` fails due to Watchpack bug - use production mode
- **File Watching**: Nested package.json files in `neon/` directory cause issues
- **Build Requirement**: Must build before starting server for local development

### Troubleshooting Guide

#### Common Issues
1. **Build Failures**
   ```bash
   npm run type-check          # Check TypeScript errors
   npm run lint:strict         # Check for linting issues
   ```

2. **Database Connection Issues**
   ```bash
   npm run db:validate         # Validate database connections
   npm run db:test             # Run database connectivity tests
   ```

3. **Performance Issues**
   ```bash
   npm run analyze             # Analyze bundle size
   npm run analyze:bundle      # Detailed bundle analysis
   ```

4. **Development Server Problems**
   - Always use production mode: `npm run build && PORT=3005 npm start`
   - Check for port conflicts: `lsof -ti:3005`
   - Clear Next.js cache: `rm -rf .next`

#### Debug Commands
```bash
# Test specific functionality
npm run test:logger           # Test logging system
npm run antihall:stats        # View anti-hallucination stats
npm run check:db-connections  # Verify database access patterns

# E2E debugging
npm run test:e2e:debug        # Debug Playwright tests
npm run test:e2e:smoke        # Run smoke tests only
```

### Performance Monitoring

#### Bundle Analysis
```bash
npm run analyze               # Generate bundle analysis
npm run analyze:bundle        # Detailed bundle breakdown
```

#### Performance Optimization
- **Bundle Size**: Monitor with `npm run analyze`
- **Database Queries**: Use direct SQL for performance
- **Real-time Features**: Optimize Socket.io connections
- **Image Optimization**: Leverage Next.js Image component
- **Caching**: Implement React Query for server state

## Environment Configuration

### Environment Files
- **`.env.example`**: Template for environment variables
- **`.env.local.example`**: Local development template
- **`.env.production`**: Production-specific configuration
- **`.env.fireflies`**: Fireflies.ai integration configuration

### Required Environment Variables
- **Database**: Neon PostgreSQL connection strings
- **Authentication**: Clerk API keys and configuration
- **External Services**: API keys for integrated services

⚠️ **Never commit actual environment files** - use the `.example` files as templates.

### Deployment Configuration

#### Vercel Configuration
The project is configured for Vercel deployment with `vercel.json`:
- **Build Command**: `npm run build`
- **Framework**: Next.js with automatic detection
- **Region**: Frankfurt (fra1) for European deployment
- **API Functions**: 30-second timeout for database operations
- **Output**: `.next` directory for static exports

#### Production Deployment
```bash
# Local production testing
npm run build                 # Build for production
PORT=3005 npm start          # Test production build locally

# Vercel deployment
npx vercel                   # Deploy to preview
npx vercel --prod           # Deploy to production
```

## Environment Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Database**: Neon PostgreSQL (configured via environment variables)
- **Authentication**: Clerk (API keys required)

This architecture supports a complex business application with multiple domains, real-time features, and comprehensive data management while maintaining clean separation of concerns and type safety throughout.