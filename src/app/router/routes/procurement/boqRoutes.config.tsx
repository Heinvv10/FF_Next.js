import { Suspense } from 'react';
import { Loading } from '../../components';
import {
  BOQList,
  BOQUpload,
  BOQMappingReview,
  BOQViewer,
  BOQHistory,
} from '../../lazyImports';
import { BOQDashboardRoute, BOQCreateRoute, BOQEditRoute } from './boqRoutes';

// Route configuration for BOQ module - separated to fix Fast Refresh warnings
export const boqRoutes = {
  path: 'boq',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <BOQDashboardRoute />
        </Suspense>
      ),
    },
    {
      path: 'list',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQList />
        </Suspense>
      ),
    },
    {
      path: 'create',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQCreateRoute />
        </Suspense>
      ),
    },
    {
      path: ':id/edit',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQEditRoute />
        </Suspense>
      ),
    },
    {
      path: 'upload',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQUpload />
        </Suspense>
      ),
    },
    {
      path: 'mapping-review',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQMappingReview />
        </Suspense>
      ),
    },
    {
      path: 'viewer',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQViewer />
        </Suspense>
      ),
    },
    {
      path: 'history',
      element: (
        <Suspense fallback={<Loading />}>
          <BOQHistory />
        </Suspense>
      ),
    },
  ],
};