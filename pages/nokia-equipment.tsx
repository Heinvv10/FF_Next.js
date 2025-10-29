import { AppLayout } from '@/components/layout/AppLayout';
import { NokiaEquipmentDashboard } from '@/modules/nokia-equipment/NokiaEquipmentDashboard';

export default function NokiaEquipmentPage() {
  return (
    <AppLayout>
      <NokiaEquipmentDashboard />
    </AppLayout>
  );
}

// Prevent static generation to avoid router mounting issues
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};
