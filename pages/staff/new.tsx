import type { NextPage } from 'next';
import { AppLayout } from '@/components/layout/AppLayout';
import { StaffForm } from '../../src/modules/staff/components/StaffForm';

const StaffCreatePage: NextPage = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <StaffForm />
      </div>
    </AppLayout>
  );
};

export default StaffCreatePage;

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};