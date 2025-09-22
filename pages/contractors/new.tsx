/**
 * New Contractor Page - Create new contractor
 * Uses the ContractorCreate component adapted for Next.js
 */

import { AppLayout } from '../../src/components/layout/AppLayout';
import { ContractorCreate } from '../../src/modules/contractors/components/ContractorCreate';
import { useRouter } from 'next/router';

export default function NewContractor() {
  const router = useRouter();

  // Wrapper component to adapt ContractorCreate for Next.js
  const ContractorCreateWrapper = () => {
    // Adapt React Router's useNavigate to Next.js router
    const navigate = (path: string) => {
      router.push(path);
    };

    // Pass the adapted navigate function to ContractorCreate
    return <ContractorCreate navigate={navigate} />;
  };

  return (
    <AppLayout>
      <ContractorCreateWrapper />
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};