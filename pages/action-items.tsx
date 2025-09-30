import { AppLayout } from '@/components/layout/AppLayout';
import { ActionItemsDashboard } from '@/modules/action-items/ActionItemsDashboard';

export default function ActionItemsPage() {
  return (
    <AppLayout>
      <ActionItemsDashboard />
    </AppLayout>
  );
}

// Use static generation for better performance
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60,
  };
};