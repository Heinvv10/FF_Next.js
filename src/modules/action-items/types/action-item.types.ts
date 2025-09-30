/**
 * Action Items Types - TypeScript interfaces and type definitions
 */

export interface ActionItem {
  id: string;
  action_id: string;
  project_id?: string;
  project_name?: string;
  related_table?: string;
  related_id?: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActionItemRequest {
  action_id?: string;
  project_id?: string;
  related_table?: string;
  related_id?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
  due_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateActionItemRequest {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
  due_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface ActionItemsQuery {
  projectId?: string;
  status?: string[];
  priority?: string[];
  assignedTo?: string;
  category?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
  overdue?: boolean;
  upcoming?: boolean;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface BulkActionRequest {
  ids: string[];
  updates: Partial<UpdateActionItemRequest>;
}

export interface PriorityEscalationRequest {
  projectId?: string;
  currentPriority?: 'low' | 'medium' | 'high';
  newPriority: 'low' | 'medium' | 'high';
  overdueOnly?: boolean;
  userId: string;
}

export interface AutoAssignmentRequest {
  projectId?: string;
  category?: string;
  priority?: ('low' | 'medium' | 'high')[];
  assigneeId: string;
  userId: string;
}

export interface ActionItemValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ActionItemsStats {
  summary: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
    upcoming: number;
    unassigned: number;
    assigned: number;
  };
  priority: {
    high: number;
    medium: number;
    low: number;
  };
  dueDates: {
    overdue: number;
    thisWeek: number;
    thisMonth: number;
  };
  performance: {
    completionRate: number;
    onTimeCompletionRate: number;
    completedOnTime: number;
    completedLate: number;
  };
  breakdowns: {
    categories: Array<{
      category: string;
      count: number;
    }>;
    projects: Array<{
      project_name: string;
      count: number;
    }>;
    assignees: Array<{
      assignee_name: string;
      count: number;
    }>;
  };
  trends: Array<{
    date: string;
    created_count: number;
    completed_count: number;
  }>;
  generatedAt: string;
}

export interface ActionItemNotification {
  id: string;
  type: 'overdue' | 'upcoming' | 'assigned' | 'updated' | 'completed';
  actionItemId: string;
  actionItemTitle: string;
  recipientId: string;
  recipientEmail: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
  isRead: boolean;
}

export interface ActionItemTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration?: number; // in hours
  requiredRoles?: string[];
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}