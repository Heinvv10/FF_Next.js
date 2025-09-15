import { GetServerSideProps } from 'next';
import { getAuth } from '../../lib/auth-mock';
import { ProjectCreationWizard } from '@/modules/projects/components/ProjectWizard/ProjectCreationWizard';

export default function NewProjectPage() {
  return <ProjectCreationWizard />;
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