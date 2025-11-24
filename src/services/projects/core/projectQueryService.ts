/**
 * Project Query Service
 * Routes all database operations through API endpoints
 */

import type { Project, ProjectFilter } from '@/types/project.types';
import { projectApi } from '@/services/api/project';

/**
 * Project query and filtering service
 */
export class ProjectQueryService {
  /**
   * Get all projects with optional filtering
   */
  static async getAllProjects(filter?: ProjectFilter): Promise<Project[]> {
    return projectApi.getAllProjects(filter);
  }

  /**
   * Get a single project by ID
   */
  static async getProjectById(id: string): Promise<Project | null> {
    return projectApi.getProjectById(id);
  }

  /**
   * Get projects by client ID
   */
  static async getProjectsByClient(clientId: string): Promise<Project[]> {
    return projectApi.getProjectsByClient(clientId);
  }

  /**
   * Get projects by status
   */
  static async getProjectsByStatus(status: string): Promise<Project[]> {
    return projectApi.getProjectsByStatus(status);
  }

  /**
   * Search projects by name or code
   */
  static async searchProjects(searchTerm: string): Promise<Project[]> {
    return projectApi.searchProjects(searchTerm);
  }

  /**
   * Get active projects only
   */
  static async getActiveProjects(): Promise<Project[]> {
    return projectApi.getActiveProjects();
  }

  /**
   * Get projects with pagination
   */
  static async getProjectsPaginated(
    limit: number = 10,
    offset: number = 0,
    filter?: ProjectFilter
  ): Promise<{ projects: Project[]; total: number }> {
    // For now, return all projects without pagination
    // A proper pagination endpoint should be added to the API
    const projects = await projectApi.getAllProjects(filter);
    return {
      projects: projects.slice(offset, offset + limit),
      total: projects.length
    };
  }
}