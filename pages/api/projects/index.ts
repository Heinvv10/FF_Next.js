/**
 * Projects API
 * Protected by Arcjet:
 * - Bot detection
 * - Rate limiting (100 req/min)
 * - Attack protection
 */

import type { NextApiRequest, NextApiResponse } from 'next';
// import { getAuth } from '@clerk/nextjs/server';
import { getAuth } from '../../../lib/auth-mock';
import { neon } from '@neondatabase/serverless';
import { safeArrayQuery, safeObjectQuery, safeMutation } from '../../../lib/safe-query';
import { apiResponse, ErrorCode } from '../../../lib/apiResponse';
import { logCreate, logUpdate, logDelete } from '../../../lib/db-logger';
import { withArcjetProtection, aj } from '@/lib/arcjet';

// Create a new connection for each request to avoid connection pooling issues
const getSql = () => neon(process.env.DATABASE_URL!);

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS for Vercel deployment
  apiResponse.setCorsHeaders(res);

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return apiResponse.handleOptions(res);
  }

  // Check authentication
  const { userId } = getAuth(req);
  if (!userId) {
    return apiResponse.unauthorized(res);
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all projects or single project by ID
        if (req.query.id) {
          const sql = getSql();
          const project = await safeArrayQuery(
            async () => sql`
              SELECT 
                p.id,
                p.project_code,
                p.project_name as name,
                p.client_id,
                p.description,
                p.project_type as type,
                p.status,
                p.priority,
                p.start_date,
                p.end_date,
                p.budget,
                p.actual_cost,
                p.project_manager,
                p.progress,
                p.created_at,
                p.updated_at,
                c.company_name as client_name
              FROM projects p
              LEFT JOIN clients c ON p.client_id = c.id
              WHERE p.id = ${req.query.id}
            `,
            { logError: true }
          );
          
          if (project.length === 0) {
            return apiResponse.notFound(res, 'Project', req.query.id as string);
          }
          
          return apiResponse.success(res, project[0]);
        } else {
          const sql = getSql();
          const projects = await safeArrayQuery(
            async () => sql`
              SELECT 
                p.id,
                p.project_code,
                p.project_name as name,
                p.client_id,
                p.description,
                p.project_type as type,
                p.status,
                p.priority,
                p.start_date,
                p.end_date,
                p.budget,
                p.actual_cost,
                p.project_manager,
                p.progress,
                p.created_at,
                p.updated_at,
                c.company_name as client_name
              FROM projects p
              LEFT JOIN clients c ON p.client_id = c.id
              ORDER BY p.created_at DESC NULLS LAST
            `,
            { logError: true, retryCount: 2 }
          );
          
          // Return empty array if no projects, not an error
          return apiResponse.success(
            res, 
            projects || [],
            projects.length === 0 ? 'No projects found' : undefined
          );
        }
        break;

      case 'POST': {
        // Create new project
        const projectData = req.body;
        const sql = getSql();
        const result = await safeMutation(
          async () => sql`
            INSERT INTO projects (
              project_code, project_name, client_id, description, 
              project_type, status, priority, start_date, end_date, 
              budget, project_manager, location
            )
            VALUES (
              ${projectData.project_code}, ${projectData.project_name}, 
              ${projectData.client_id}, ${projectData.description},
              ${projectData.project_type}, ${projectData.status || 'active'},
              ${projectData.priority || 'medium'}, ${projectData.start_date},
              ${projectData.end_date}, ${projectData.budget},
              ${projectData.project_manager}, ${projectData.location}
            )
            RETURNING *
          `,
          { logError: true }
        );
        
        if (!result.success) {
          return apiResponse.databaseError(
            res, 
            new Error(result.error || 'Failed to create project'),
            result.error || 'Failed to create project'
          );
        }
        
        // Log successful project creation
        const newProject = result.data?.[0];
        if (newProject) {
          logCreate('project', newProject.id, {
            project_code: newProject.project_code,
            project_name: newProject.project_name,
            client_id: newProject.client_id,
            created_by: userId
          });
        }
        
        return apiResponse.created(res, newProject, 'Project created successfully');
        break;
      }

      case 'PUT': {
        // Update project
        if (!req.query.id) {
          return apiResponse.validationError(res, { id: 'Project ID is required' });
        }
        
        const updateData = req.body;
        const sql = getSql();
        const updateResult = await safeMutation(
          async () => sql`
            UPDATE projects SET
              project_name = COALESCE(${updateData.project_name}, project_name),
              client_id = COALESCE(${updateData.client_id}, client_id),
              description = COALESCE(${updateData.description}, description),
              project_type = COALESCE(${updateData.project_type}, project_type),
              status = COALESCE(${updateData.status}, status),
              priority = COALESCE(${updateData.priority}, priority),
              start_date = COALESCE(${updateData.start_date}, start_date),
              end_date = COALESCE(${updateData.end_date}, end_date),
              budget = COALESCE(${updateData.budget}, budget),
              project_manager = COALESCE(${updateData.project_manager}, project_manager),
              location = COALESCE(${updateData.location}, location),
              updated_at = NOW()
            WHERE id = ${req.query.id}
            RETURNING *
          `,
          { logError: true }
        );
        
        if (!updateResult.success) {
          return apiResponse.databaseError(
            res,
            new Error(updateResult.error || 'Failed to update project'),
            updateResult.error || 'Failed to update project'
          );
        }
        
        // Log successful project update
        const updatedProject = updateResult.data?.[0];
        if (updatedProject) {
          logUpdate('project', req.query.id as string, {
            updated_fields: Object.keys(updateData),
            updated_by: userId
          });
        }
        
        return apiResponse.success(res, updatedProject, 'Project updated successfully');
        break;
      }

      case 'DELETE': {
        // Delete project
        if (!req.query.id) {
          return apiResponse.validationError(res, { id: 'Project ID is required' });
        }
        
        const sql = getSql();
        const deleteResult = await safeMutation(
          async () => sql`DELETE FROM projects WHERE id = ${req.query.id}`,
          { logError: true }
        );
        
        if (!deleteResult.success) {
          return apiResponse.databaseError(
            res,
            new Error(deleteResult.error || 'Failed to delete project'),
            deleteResult.error || 'Failed to delete project'
          );
        }
        
        // Log successful project deletion
        logDelete('project', req.query.id as string);
        
        return apiResponse.success(res, null, 'Project deleted successfully');
        break;
      }

      default:
        return apiResponse.methodNotAllowed(res, req.method!, ['GET', 'POST', 'PUT', 'DELETE']);
    }
  } catch (error: any) {
    return apiResponse.internalError(res, error);
  }
}

// Export with Arcjet protection
export default withArcjetProtection(handler, aj);