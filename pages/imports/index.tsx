import { GetServerSideProps } from 'next';
import { getAuth } from '../../lib/auth-mock';
import dynamic from 'next/dynamic';

const ImportsDataGridPage = dynamic(() => import('@/modules/sow/ImportsDataGridPage').then(mod => mod.ImportsDataGridPage || mod.default), {
  ssr: false,
  loading: () => <div>Loading Imports Data Grid...</div>
});

export default function ImportsPageWrapper() {
  return <ImportsDataGridPage />;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);

  if (!userId) {
    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    };
  }

  return { props: {} };
};