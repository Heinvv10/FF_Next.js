import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="200px"
  >
    <CircularProgress size={40} />
  </Box>
);

// Lazy load heavy contractor components
export const ContractorImportLazy = lazy(() => 
  import('./ContractorImport').then(module => ({ default: module.ContractorImport }))
);

export const ContractorFileDropZoneLazy = lazy(() =>
  import('./import/ContractorFileDropZone').then(module => ({ default: module.ContractorFileDropZone }))
);

export const ContractorFilePreviewLazy = lazy(() =>
  import('./import/ContractorFilePreview').then(module => ({ default: module.ContractorFilePreview }))
);

export const ContractorImportResultsLazy = lazy(() =>
  import('./import/ContractorImportResults').then(module => ({ default: module.ContractorImportResults }))
);

// Higher-order component to wrap lazy components with Suspense
export function withLazyLoading<T extends object>(Component: React.ComponentType<T>) {
  const WrappedComponent = (props: T) => (
    <Suspense fallback={<LoadingSpinner />}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `LazyLoaded(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Export wrapped components ready to use
export const ContractorImport = withLazyLoading(ContractorImportLazy);
export const ContractorFileDropZone = withLazyLoading(ContractorFileDropZoneLazy);  
export const ContractorFilePreview = withLazyLoading(ContractorFilePreviewLazy);
export const ContractorImportResults = withLazyLoading(ContractorImportResultsLazy);