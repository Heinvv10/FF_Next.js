import { AppLayout } from '@/components/layout/AppLayout';
import { MeetingsDashboard } from '@/modules/meetings/MeetingsDashboard';

export default function MeetingsPage() {
  return (
    <AppLayout>
      <MeetingsDashboard />
    </AppLayout>
  );
}

// Use static generation for better performance
export const getStaticProps = async () => {
  return {
    props: {},
    revalidate: 60, // Optional revalidation
  };
};