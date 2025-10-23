import type { NextPage } from 'next';
import { AppLayout } from '../../src/components/layout/AppLayout';
import { SupplierForm } from '../../src/modules/suppliers/components/SupplierForm';

const SupplierCreatePage: NextPage = () => {
  return (
    <AppLayout>
      <div className="p-6">
        <SupplierForm />
      </div>
    </AppLayout>
  );
};

export default SupplierCreatePage;

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
