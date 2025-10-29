# Next.js Routing Checklist

## Problem: Routes Returning 404 in Production

This app uses **Next.js with file-based routing**. Components alone don't create routes - you MUST have corresponding files in the `pages/` directory.

## Common Mistake Pattern

❌ **Wrong - This causes 404s:**
```
1. Create component: src/modules/my-feature/MyFeaturePage.tsx
2. Add to router config: src/app/router/routes/moduleRoutes.tsx
3. Deploy → 404 ERROR
```

✅ **Correct - This works:**
```
1. Create component: src/modules/my-feature/MyFeaturePage.tsx
2. Add to router config: src/app/router/routes/moduleRoutes.tsx
3. CREATE PAGE FILE: pages/my-feature.tsx (renders the component)
4. Deploy → Works!
```

## Checklist: Before Deploying New Routes

### 1. Run the Route Audit Script
```bash
node scripts/audit-routes.js
```

This will show you any routes defined in the router config that don't have corresponding page files.

### 2. Create Missing Page Files

For each missing route, create a page file in `pages/` that renders your component:

**Example for a simple route:**
```tsx
// pages/my-feature.tsx
import { AppLayout } from '@/components/layout/AppLayout';
import { MyFeaturePage } from '@/modules/my-feature/MyFeaturePage';

export default function MyFeature() {
  return (
    <AppLayout>
      <MyFeaturePage />
    </AppLayout>
  );
}

export const getServerSideProps = async () => {
  return { props: {} };
};
```

**Example for routes with sub-pages:**
```tsx
// pages/my-feature/[slug].tsx
import { AppLayout } from '@/components/layout/AppLayout';
import { SubPageOne } from '@/modules/my-feature/pages/SubPageOne';
import { SubPageTwo } from '@/modules/my-feature/pages/SubPageTwo';
import { useRouter } from 'next/router';

const components = {
  'sub-one': SubPageOne,
  'sub-two': SubPageTwo,
};

export default function MyFeatureSubPage() {
  const router = useRouter();
  const { slug } = router.query;
  const Component = components[slug as keyof typeof components];

  if (!Component) {
    return <AppLayout><div>Page Not Found</div></AppLayout>;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

export const getServerSideProps = async () => {
  return { props: {} };
};
```

### 3. Test Locally
```bash
npm run build
PORT=3005 npm start
```

Visit your routes and confirm they work.

### 4. Test on Vercel After Deploy

After pushing to GitHub and Vercel deploys, verify all routes work:
```bash
curl -I https://fibreflow.app/your-route
# Should return 200, not 404
```

## Quick Reference: File Structure

```
Your codebase structure:

pages/                          ← Next.js routes (REQUIRED for URLs to work)
  my-feature.tsx                ← Creates /my-feature route
  my-feature/
    [slug].tsx                  ← Handles /my-feature/* routes
  another-route.tsx             ← Creates /another-route

src/
  modules/
    my-feature/                 ← Your React components (NOT routes)
      MyFeaturePage.tsx
      pages/
        SubPageOne.tsx
        SubPageTwo.tsx

  app/
    router/
      routes/
        moduleRoutes.tsx        ← React Router config (client-side only)
```

## Previous Issues Fixed

### October 29, 2025
- **Action Items sub-routes** - Created `pages/action-items/[slug].tsx`
- **Nokia Equipment** - Created `pages/nokia-equipment.tsx`
- **Workflow Portal** - Created `pages/workflow-portal.tsx`
- **Migration Status** - Created `pages/migration-status.tsx`

## Why This Happens

The app was originally a pure React SPA with React Router. During migration to Next.js, not all routes were properly converted to Next.js page files. The React Router config still exists for client-side navigation, but Vercel needs actual page files to serve the routes initially.

## Key Takeaway

**In Next.js apps: No page file = No route = 404 error**

Always create page files in `pages/` directory when adding new routes!
