import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Loading component
export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--ff-background-primary)]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}

// Protected route wrapper
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

// 404 Not Found component
export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </div>
  );
}