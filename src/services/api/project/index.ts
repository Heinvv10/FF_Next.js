/**
 * Project API - Main Orchestrator
 * Maintains backward compatibility with original projectApi
 * Delegates to modular operations
 */

import { Project, ProjectFilter, ProjectFormData } from '@/types/project.types';
import { ProjectQueryOperations } from './QueryOperations';
import { ProjectCrudOperations } from './CrudOperations';
import { ProjectUpdateOperations } from './UpdateOperations';

/**
 * Project API service
 * Orchestrator that delegates to modular services
 */
export const projectApi = {
  // Query Operations
  getAllProjects: (filter?: ProjectFilter): Promise<Project[]> =>
    ProjectQueryOperations.getAllProjects(filter),

  getProjectById: (id: string): Promise<Project | null> =>
    ProjectQueryOperations.getProjectById(id),

  getProjectsByClient: (clientId: string): Promise<Project[]> =>
    ProjectQueryOperations.getProjectsByClient(clientId),

  getProjectsByStatus: (status: string): Promise<Project[]> =>
    ProjectQueryOperations.getProjectsByStatus(status),

  searchProjects: (searchTerm: string): Promise<Project[]> =>
    ProjectQueryOperations.searchProjects(searchTerm),

  getActiveProjects: (): Promise<Project[]> =>
    ProjectQueryOperations.getActiveProjects(),

  // CRUD Operations
  createProject: (data: ProjectFormData): Promise<string> =>
    ProjectCrudOperations.createProject(data),

  updateProject: (id: string, data: Partial<ProjectFormData>): Promise<void> =>
    ProjectCrudOperations.updateProject(id, data),

  deleteProject: (id: string): Promise<void> =>
    ProjectCrudOperations.deleteProject(id),

  // Update Operations
  updateProjectStatus: (id: string, status: string): Promise<void> =>
    ProjectUpdateOperations.updateProjectStatus(id, status),

  updateProjectProgress: (id: string, progress: number): Promise<void> =>
    ProjectUpdateOperations.updateProjectProgress(id, progress),

  updateProjectBudget: (id: string, budget: number): Promise<void> =>
    ProjectUpdateOperations.updateProjectBudget(id, budget),

  assignProjectToClient: (projectId: string, clientId: string): Promise<void> =>
    ProjectUpdateOperations.assignProjectToClient(projectId, clientId),

  updateProjectDates: (
    id: string,
    startDate?: Date | null,
    endDate?: Date | null
  ): Promise<void> =>
    ProjectUpdateOperations.updateProjectDates(id, startDate, endDate),
};

// Export individual operations for direct access
export { ProjectQueryOperations, ProjectCrudOperations, ProjectUpdateOperations };
