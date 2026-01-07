import type { NextPage } from 'next';
import { AppLayout } from '@/components/layout/AppLayout';
import { StaffForm } from '../../../src/modules/staff/components/StaffForm';

/**
 * Staff Edit Page
 * StaffForm automatically detects edit mode from URL params (router.query.id)
 */
const StaffEditPage: NextPage = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <StaffForm />
      </div>
    </AppLayout>
  );
};

export default StaffEditPage;

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};