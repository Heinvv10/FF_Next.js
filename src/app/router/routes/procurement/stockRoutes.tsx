import { Suspense } from 'react';
import { Loading } from '../../components';
import {
  StockManagementDashboard,
  StockDashboard,
  GoodsReceipt,
  StockMovements,
  DrumTracking,
} from '../../lazyImports';

export const stockRoutes = {
  path: 'stock',
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<Loading />}>
          <StockManagementDashboard />
        </Suspense>
      ),
    },
    {
      path: 'dashboard',
      element: (
        <Suspense fallback={<Loading />}>
          <StockDashboard />
        </Suspense>
      ),
    },
    {
      path: 'goods-receipt',
      element: (
        <Suspense fallback={<Loading />}>
          <GoodsReceipt />
        </Suspense>
      ),
    },
    {
      path: 'movements',
      element: (
        <Suspense fallback={<Loading />}>
          <StockMovements />
        </Suspense>
      ),
    },
    {
      path: 'drum-tracking',
      element: (
        <Suspense fallback={<Loading />}>
          <DrumTracking />
        </Suspense>
      ),
    },
  ],
};