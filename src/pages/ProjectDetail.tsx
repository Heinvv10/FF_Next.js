import { useState } from 'react';
import { useRouter } from 'next/router';
import { useProject, useProjectHierarchy, useDeleteProject } from '@/hooks/useProjects';
import { EnhancedSOWDisplay } from '@/components/sow/EnhancedSOWDisplay';

// Import split components
import { ProjectInfoCard } from './detail/ProjectInfoCard';
import { ProjectProgressCard } from './detail/ProjectProgressCard';
import { ProjectDetailHeader } from './detail/ProjectDetailHeader';
import { ProjectStatusBadges } from './detail/ProjectStatusBadges';
import { ProjectTabs } from './detail/ProjectTabs';
import { ProjectKeyDetails } from './detail/ProjectKeyDetails';
import { ProjectQuickStats } from './detail/ProjectQuickStats';
import { ProjectHierarchyTab } from './detail/ProjectHierarchyTab';
import { ProjectTimelineTab } from './detail/ProjectTimelineTab';
import { ProjectDetailLoading } from './detail/ProjectDetailLoading';
import { ProjectDetailNotFound } from './detail/ProjectDetailNotFound';

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const id = projectId;
  type TabId = 'overview' | 'hierarchy' | 'sow' | 'timeline';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  const { data: project, isLoading, error } = useProject(id!);
  const { data: hierarchy, isLoading: isHierarchyLoading } = useProjectHierarchy(id!);
  const deleteMutation = useDeleteProject();

  if (isLoading) {
    return <ProjectDetailLoading />;
  }

  if (error || !project) {
    return <ProjectDetailNotFound onNavigateBack={() => router.push('/projects')} />;
  }

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(id!);
      router.push('/projects');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ProjectDetailHeader
        project={project}
        onNavigateBack={() => router.push('/projects')}
        onEdit={() => router.push(`/projects/${id}/edit`)}
        onDelete={handleDeleteProject}
      />

      <ProjectStatusBadges project={project} />

      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Information */}
          <div className="lg:col-span-2 space-y-6">
            <ProjectInfoCard project={project} />
            <ProjectProgressCard project={project} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProjectKeyDetails project={project} />
            <ProjectQuickStats project={project} />
          </div>
          </div>
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <ProjectHierarchyTab hierarchy={hierarchy} isLoading={isHierarchyLoading} />
      )}

      {activeTab === 'sow' && (
        <EnhancedSOWDisplay projectId={id!} projectName={project.name} />
      )}

      {activeTab === 'timeline' && (
        <ProjectTimelineTab />
      )}
    </div>
  );
}

// Default export for Next.js dynamic import
export default ProjectDetail;