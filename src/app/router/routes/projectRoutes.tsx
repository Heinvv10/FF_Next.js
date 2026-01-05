import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Loading } from '../components';
import {
  Projects,
  ProjectCreationWizard,
  ProjectForm,
  ProjectDetail,
  PoleTrackerDashboard,
  PoleTrackerList,
  UnifiedTrackerGrid,
  HomeInstallsDashboard,
  HomeInstallsList,
  FiberStringingDashboard,
  DropsManagement,
  PoleCaptureMobile,
  SOWManagement
} from '../lazyImports';

export const projectRoutes = [
  {
    path: 'projects',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Projects />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: 'projects/new',
    element: (
      <Suspense fallback={<Loading />}>
        <ProjectCreationWizard />
      </Suspense>
    ),
  },
  {
    path: 'projects/create',
    element: (
      <Suspense fallback={<Loading />}>
        <ProjectCreationWizard />
      </Suspense>
    ),
  },
  {
    path: 'projects/:id/edit',
    element: (
      <Suspense fallback={<Loading />}>
        <ProjectForm />
      </Suspense>
    ),
  },
  {
    path: 'projects/:id',
    element: (
      <Suspense fallback={<Loading />}>
        <ProjectDetail />
      </Suspense>
    ),
  },
  {
    path: 'projects/:projectId/tracker',
    element: (
      <Suspense fallback={<Loading />}>
        <UnifiedTrackerGrid />
      </Suspense>
    ),
  },
  {
    path: 'pole-tracker',
    element: (
      <Suspense fallback={<Loading />}>
        <PoleTrackerDashboard />
      </Suspense>
    ),
  },
  {
    path: 'pole-tracker/list',
    element: (
      <Suspense fallback={<Loading />}>
        <PoleTrackerList />
      </Suspense>
    ),
  },
  {
    path: 'pole-capture',
    element: (
      <Suspense fallback={<Loading />}>
        <PoleCaptureMobile 
          projectId="default" 
          onSave={async () => {}} 
          onCancel={() => {}} 
        />
      </Suspense>
    ),
  },
  {
    path: 'fiber-stringing',
    element: (
      <Suspense fallback={<Loading />}>
        <FiberStringingDashboard />
      </Suspense>
    ),
  },
  {
    path: 'drops',
    element: (
      <Suspense fallback={<Loading />}>
        <DropsManagement />
      </Suspense>
    ),
  },
  {
    path: 'sow-management',
    element: (
      <Suspense fallback={<Loading />}>
        <SOWManagement />
      </Suspense>
    ),
  },
  {
    path: 'home-installs',
    element: (
      <Suspense fallback={<Loading />}>
        <HomeInstallsDashboard />
      </Suspense>
    ),
  },
  {
    path: 'home-installs/list',
    element: (
      <Suspense fallback={<Loading />}>
        <HomeInstallsList />
      </Suspense>
    ),
  },
  {
    path: 'installations',
    element: (
      <Suspense fallback={<Loading />}>
        <HomeInstallsDashboard />
      </Suspense>
    ),
  },
];