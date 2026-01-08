import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/shared/components/ui/Button';
import { StaffImportAdvanced } from '../../src/modules/staff/components/StaffImportAdvanced';

const StaffImportPage: NextPage = () => {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/staff')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--ff-text-primary)]">Import Staff</h1>
              <p className="text-[var(--ff-text-secondary)]">
                Bulk import staff members from CSV or Excel files
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/staff')}
          >
            Cancel
          </Button>
        </div>

        {/* Import Component */}
        <StaffImportAdvanced />
      </div>
    </AppLayout>
  );
};

export default StaffImportPage;

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};