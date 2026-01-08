import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '../src/modules/dashboard/Dashboard';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div suppressHydrationWarning>
        <Dashboard />
      </div>
    </AppLayout>
  );
}
