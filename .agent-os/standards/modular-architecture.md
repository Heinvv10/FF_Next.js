# Modular Architecture ("Lego Block" Pattern)

## Design Philosophy

FibreFlow uses a modular architecture where features are self-contained, plug-and-play modules. Each module is like a Lego block - independent, reusable, and easy to debug or remove.

## Module Structure

Modules live in `src/modules/` and follow this structure:

```
src/modules/{module-name}/
├── types/                    # TypeScript interfaces and types
│   └── {module}.types.ts
├── services/                 # Business logic and API services
│   ├── {module}Service.ts    # Core business logic
│   └── {module}ApiService.ts # Frontend API client
├── utils/                    # Helper functions and utilities
│   └── {module}Rules.ts      # Business rules/calculations
├── components/               # UI components (React)
│   ├── {Module}Dashboard.tsx
│   ├── {Module}Card.tsx
│   └── index.ts              # Component exports
└── hooks/                    # Custom React hooks (optional)
    └── use{Module}.ts
```

## Module Examples

### WA Monitor Module (Fully Isolated) 🔒

The **WA Monitor** is the **gold standard** for module isolation - completely self-contained with zero dependencies on main app:

```
src/modules/wa-monitor/
├── lib/                      # Internal utilities (isolated)
│   └── apiResponse.ts        # Frozen copy - no external deps
├── types/wa-monitor.types.ts
├── services/
│   ├── waMonitorService.ts
│   └── waMonitorApiService.ts
├── utils/waMonitorHelpers.ts
├── components/
│   ├── WaMonitorDashboard.tsx
│   ├── QaReviewCard.tsx
│   └── index.ts
├── hooks/useWaMonitorStats.ts
├── tests/integration.test.ts  # Independent testing
├── API_CONTRACT.md            # Frozen API specs
└── ISOLATION_GUIDE.md         # Development workflow
```

**Status:** ✅ **Fully Isolated** - Can operate independently, can be extracted to microservice

**API Endpoints:** `pages/api/wa-monitor-*.ts`

**Testing:** `npm run test:wa-monitor`

### RAG Module (Standard Modular)

The RAG (Red/Amber/Green) contractor health monitoring demonstrates standard modular pattern:

```
src/modules/rag/
├── types/rag.types.ts
├── services/
│   ├── ragCalculationService.ts
│   └── ragApiService.ts
├── utils/ragRules.ts
└── components/
    ├── RagDashboard.tsx
    ├── RagStatusBadge.tsx
    └── index.ts
```

**API Endpoint:** `pages/api/contractors-rag.ts`

**Page Route:** `app/contractors/rag-dashboard/page.tsx`

## Benefits of Modular Architecture

1. **Easy Debugging**: Issues are isolated to specific modules
2. **Maintainability**: Each module has clear boundaries and responsibilities
3. **Reusability**: Modules can be used across different parts of the app
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Testing**: Modules can be tested independently
6. **Documentation**: Each module is self-documenting with clear structure

## When to Create a Module

Create a new module when building:

- **Complex features** with multiple components
- **Features with business logic** that might be reused
- **Features that might be removed/disabled** in the future
- **Features that need independent testing**
- **Features with their own data model** and API endpoints

## Module Creation Checklist

When creating a new module:

- [ ] Create module directory in `src/modules/{module-name}/`
- [ ] Define TypeScript types in `types/{module}.types.ts`
- [ ] Create service layer in `services/`
  - [ ] Business logic: `{module}Service.ts`
  - [ ] API client: `{module}ApiService.ts`
- [ ] Add utility functions in `utils/{module}Helpers.ts`
- [ ] Build UI components in `components/`
  - [ ] Main dashboard component
  - [ ] Sub-components (cards, forms, etc.)
  - [ ] Export components via `index.ts`
- [ ] Create custom hooks (if needed) in `hooks/`
- [ ] Write module README: `README.md`
- [ ] Create API endpoints: `pages/api/{module}-*.ts`
- [ ] Add page routes: `app/{module}/page.tsx`
- [ ] Update navigation: Add links to sidebar config
- [ ] Document API contracts (if fully isolated)
- [ ] Write tests: Unit tests, integration tests
- [ ] Update `CLAUDE.md` with module documentation

## Module Integration

Modules integrate with the main app through:

1. **API Routes**: Flattened routes in `pages/api/`
   ```
   pages/api/{module}-action.ts
   pages/api/{module}-action-update.ts
   ```

2. **Page Routes**: Routes in `app/` that import module components
   ```typescript
   // app/module-name/page.tsx
   import { ModuleDashboard } from '@/modules/module-name/components';

   export default function ModulePage() {
     return <ModuleDashboard />;
   }
   ```

3. **Navigation**: Links added to sidebar config
   ```typescript
   {
     title: 'Module Name',
     href: '/module-name',
     icon: ModuleIcon
   }
   ```

4. **Shared Services**: Can use shared utilities from `src/lib/` and `src/utils/`

**Note:** Fully isolated modules (like WA Monitor) do NOT use shared services - they internalize all dependencies for complete independence.

## Module Isolation Levels

### Level 1: Standard Module (Most Common)
- Uses shared utilities (`@/lib/*`, `@/utils/*`)
- Uses shared services (`@/services/*`)
- Follows FibreFlow standards
- Can't be extracted independently

**Example**: RAG module, Procurement module

### Level 2: Isolated Module (Recommended for Complex Features)
- **Zero dependencies** on shared utilities
- **Zero dependencies** on shared services
- Internalizes all dependencies
- **Can be extracted** to microservice

**Example**: WA Monitor module

**When to use**: Large, complex features that might become separate services in the future

## File Size Limits

Keep modules maintainable:

- **Components**: < 200 lines
- **Services**: < 300 lines
- **Other files**: < 300 lines

**When approaching limits**:
- Extract business logic to custom hooks
- Split services into operations
- Break down components into sub-components

## Component Structure

```typescript
// ✅ Good - UI logic only in component
// src/modules/my-module/components/MyDashboard.tsx

import { useMyModuleData } from '../hooks/useMyModuleData';

export function MyDashboard() {
  const { data, loading, error } = useMyModuleData();

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {data.map(item => (
        <MyCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

```typescript
// ❌ Bad - Business logic mixed with UI
export function MyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Complex data fetching logic here... ❌
    fetchData().then(setData);
  }, []);

  // ... 300 lines of mixed logic and UI
}
```

## Service Layer Pattern

### Business Logic Service
```typescript
// src/modules/my-module/services/myModuleService.ts

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

export const myModuleService = {
  async getAll(): Promise<MyModuleData[]> {
    return await sql`SELECT * FROM my_module_table ORDER BY created_at DESC`;
  },

  async getById(id: string): Promise<MyModuleData | null> {
    const rows = await sql`SELECT * FROM my_module_table WHERE id = ${id}`;
    return rows[0] || null;
  },

  async create(data: CreateMyModuleData): Promise<MyModuleData> {
    const rows = await sql`
      INSERT INTO my_module_table (name, description)
      VALUES (${data.name}, ${data.description})
      RETURNING *
    `;
    return rows[0];
  },

  async update(id: string, data: UpdateMyModuleData): Promise<MyModuleData> {
    const rows = await sql`
      UPDATE my_module_table
      SET name = ${data.name}, description = ${data.description}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await sql`DELETE FROM my_module_table WHERE id = ${id}`;
  }
};
```

### Frontend API Client
```typescript
// src/modules/my-module/services/myModuleApiService.ts

export const myModuleApiService = {
  async getAll(): Promise<MyModuleData[]> {
    const response = await fetch('/api/my-module');
    if (!response.ok) throw new Error('Failed to fetch data');
    const json = await response.json();
    return json.data || json;
  },

  async getById(id: string): Promise<MyModuleData> {
    const response = await fetch(`/api/my-module?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch data');
    const json = await response.json();
    return json.data || json;
  },

  async create(data: CreateMyModuleData): Promise<MyModuleData> {
    const response = await fetch('/api/my-module-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create');
    const json = await response.json();
    return json.data || json;
  }
};
```

## Type Organization

```typescript
// src/modules/my-module/types/my-module.types.ts

// Base entity
export interface MyModuleData {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Create DTO
export interface CreateMyModuleData {
  name: string;
  description: string;
}

// Update DTO
export interface UpdateMyModuleData {
  name?: string;
  description?: string;
}

// API response
export interface MyModuleApiResponse {
  success: boolean;
  data: MyModuleData[];
  meta: {
    timestamp: string;
  };
}
```

## Custom Hooks Pattern

```typescript
// src/modules/my-module/hooks/useMyModuleData.ts

import { useState, useEffect } from 'react';
import { myModuleApiService } from '../services/myModuleApiService';
import type { MyModuleData } from '../types/my-module.types';

export function useMyModuleData() {
  const [data, setData] = useState<MyModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await myModuleApiService.getAll();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}
```

## Module README Template

```markdown
# Module Name

## Overview
[1-2 paragraph description of what this module does]

## Architecture
- **Type**: Standard Module | Isolated Module
- **Database Tables**: table_name1, table_name2
- **API Endpoints**: /api/module-*, /api/module-action-*
- **Dependencies**: List any external dependencies

## Components
- **ModuleDashboard** - Main dashboard view
- **ModuleCard** - Individual item card
- **ModuleForm** - Create/edit form

## Services
- **moduleService.ts** - Business logic and database operations
- **moduleApiService.ts** - Frontend API client

## API Contract
See [API_CONTRACT.md](./API_CONTRACT.md) for detailed API specifications.

## Usage

\`\`\`typescript
import { ModuleDashboard } from '@/modules/module-name/components';

export default function ModulePage() {
  return <ModuleDashboard />;
}
\`\`\`

## Testing
\`\`\`bash
npm run test:module-name
\`\`\`

## Future Improvements
- [ ] Item 1
- [ ] Item 2
```

## Anti-Patterns to Avoid

### ❌ Don't Do This
- Create global utilities in module (defeats isolation)
- Mix modules' logic (one module calling another's service directly)
- Put module code in `src/components/` or `src/services/` global folders
- Create deeply nested directory structures (keep it 2-3 levels max)
- Skip documentation (modules without READMEs are hard to understand)

### ✅ Do This
- Keep modules self-contained
- Use well-defined APIs between modules
- Put all module code in `src/modules/{module-name}/`
- Keep directory structure flat and simple
- Document module purpose, architecture, and usage

## Migration from Non-Modular Code

If you have existing code that should be a module:

1. Create module directory structure
2. Move related types to `types/`
3. Move business logic to `services/`
4. Move utilities to `utils/`
5. Move components to `components/`
6. Update imports throughout codebase
7. Test thoroughly
8. Document in module README

## Summary

Modular architecture makes FibreFlow:
- **Easier to debug** - Issues isolated to specific modules
- **Easier to maintain** - Clear boundaries and responsibilities
- **Easier to test** - Independent testing
- **Easier to scale** - Add features without affecting existing code
- **Easier to collaborate** - Multiple developers on different modules
- **Future-proof** - Modules can become microservices if needed
